import React from 'react';
import { Transaction, RecurringBill } from '../types';
import { formatUZS } from '../utils/formatters';
import { 
  AlertOctagon, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Flame, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export interface CategoryBudget {
  category: string;
  limitAmount: number;
}

export interface FinancialAnomaly {
  id: string;
  type: 'critical' | 'warning' | 'anomaly';
  title: string;
  category?: string;
  amount?: number;
  description: string;
  recommendation: string;
  date?: string;
}

interface FinancialRiskAuditProps {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  balance: number;
  categoryBudgets: CategoryBudget[];
  onNavigateToTab?: (tab: string) => void;
}

export const FinancialRiskAudit: React.FC<FinancialRiskAuditProps> = ({
  transactions,
  recurringBills,
  balance,
  categoryBudgets,
  onNavigateToTab,
}) => {
  const anomalies: FinancialAnomaly[] = [];

  // 1. Check Cashflow deficit & negative balance
  if (balance < 0) {
    anomalies.push({
      id: 'neg-balance',
      type: 'critical',
      title: "KASSA KAMOMADI: Hisob balansi manfiy!",
      amount: Math.abs(balance),
      description: `Joriy hisobingizda ${formatUZS(Math.abs(balance))} qarz yoki kamomad yuzaga kelgan. Barcha ixtiyoriy xarajatlar darhol to'xtatilishi shart!`,
      recommendation: "Favqulodda jamg'armadan to'ldiring yoki kechiktirib bo'lmaydigan daromad manbalarini jalb qiling.",
    });
  } else if (balance < 500000) {
    anomalies.push({
      id: 'low-balance',
      type: 'warning',
      title: "Xavfli past kassa qoldig'i",
      amount: balance,
      description: `Joriy balans atigi ${formatUZS(balance)}. Bu 1 haftalik o'rtacha xarajatdan ham kamroq.`,
      recommendation: "Kelgusi haftadagi to'lovlar uchun minimal 1 500 000 so'm xavfsizlik yostig'i shakllantiring.",
    });
  }

  // 2. Check Overdue or Urgent Recurring Bills
  const now = new Date();
  const currentDay = now.getDate();
  recurringBills.forEach((bill) => {
    if (!bill.isPaidThisMonth && bill.dueDay <= currentDay) {
      anomalies.push({
        id: `bill-overdue-${bill.id}`,
        type: 'critical',
        title: `Muddati o'tgan to'lov: ${bill.title}`,
        category: bill.category,
        amount: bill.amount,
        description: `Ushbu to'lov muddati oyning ${bill.dueDay}-sanasida bo'lgan, ammo to'lanmagan deb belgilangan. Jarima va foizlar xavfi bor!`,
        recommendation: "Penya yoki xizmat to'xtatilishining oldini olish uchun bugunoq to'lang.",
      });
    }
  });

  // 3. Check Category Budget Overruns (Qizil chegara)
  const categorySpend: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
    });

  categoryBudgets.forEach((b) => {
    const spent = categorySpend[b.category] || 0;
    if (spent > b.limitAmount) {
      const overspent = spent - b.limitAmount;
      const overPercent = Math.round((spent / b.limitAmount) * 100);
      anomalies.push({
        id: `budget-over-${b.category}`,
        type: 'critical',
        title: `BYUDJET OSHIB KETDI: ${b.category} (${overPercent}%)`,
        category: b.category,
        amount: overspent,
        description: `Belgilangan limit ${formatUZS(b.limitAmount)} edi, amalda esa ${formatUZS(spent)} sarflandi (+${formatUZS(overspent)} ortiqcha).`,
        recommendation: `Ushbu toifadagi xarajatlarni keyingi oygacha 100% cheklang.`,
      });
    } else if (spent >= b.limitAmount * 0.85) {
      const percent = Math.round((spent / b.limitAmount) * 100);
      anomalies.push({
        id: `budget-warn-${b.category}`,
        type: 'warning',
        title: `Byudjet xavfli chegarada: ${b.category} (${percent}%)`,
        category: b.category,
        amount: b.limitAmount - spent,
        description: `Limitning ${percent}% qismi sarflab bo'lindi. Atigi ${formatUZS(b.limitAmount - spent)} qoldi.`,
        recommendation: "Kunlik xarajatlarni qat'iy nazoratga oling.",
      });
    }
  });

  // 4. Check Anomalous large individual expenses (> 1,000,000 UZS or unusual spike)
  transactions
    .filter((t) => t.type === 'expense' && t.amount >= 1500000)
    .slice(0, 3)
    .forEach((t) => {
      anomalies.push({
        id: `spike-${t.id}`,
        type: 'warning',
        title: `Yirik bir martalik chiqim: ${t.category}`,
        amount: t.amount,
        date: t.date,
        description: `"${t.description || t.category}" uchun kutilmagan yirik mablag' (${formatUZS(t.amount)}) sarflangan.`,
        recommendation: "Bunday yirik xarajatlar oldindan maqsadli jamg'armalarga kiritilishi lozim.",
      });
    });

  const criticalCount = anomalies.filter((a) => a.type === 'critical').length;
  const warningCount = anomalies.filter((a) => a.type === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with high-contrast red alerts */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>Moliyaviy Xatolar va Xatarlar Auditi</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <span>Aniqlangan Kamchiliklar va Xatarlar</span>
              {criticalCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-xs font-black animate-pulse">
                  {criticalCount} TA QIZIL XATAR
                </span>
              )}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tizim byudjetdan oshib ketish, kassa defitsiti, muddati o'tgan qarzdorliklar va sun'iy intellekt aniqlagan moliyaviy oqishlarni qizil rang bilan belgilab beradi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/30 text-center min-w-[100px]">
              <div className="text-2xl font-black text-rose-500">{criticalCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                Qizil Xatar
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center min-w-[100px]">
              <div className="text-2xl font-black text-amber-400">{warningCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Ogohlantirish
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {anomalies.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-200">
              Hech qanday kritik xato yoki kamomad topilmadi!
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Barcha xarajatlar byudjet me'yorida, to'lovlar o'z vaqtida to'lanmoqda va balansingiz xavfsiz zonada.
            </p>
          </div>
        ) : (
          anomalies.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.type === 'critical'
                  ? 'bg-gradient-to-r from-rose-950/60 to-slate-900 border-rose-500/50 shadow-lg shadow-rose-950/30'
                  : 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'critical'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-900/50'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.type === 'critical' ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-black ${
                          item.type === 'critical' ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.category && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                          {item.category}
                        </span>
                      )}
                      {item.date && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.date}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {item.description}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2 mt-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-400">Yechim tavsiyasi: </span>
                        <span>{item.recommendation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {item.amount !== undefined && (
                  <div className="text-right sm:shrink-0 pl-12 sm:pl-0">
                    <div
                      className={`text-base font-black font-mono ${
                        item.type === 'critical' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {item.type === 'critical' ? '-' : ''}
                      {formatUZS(item.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Taqchillik / Miqdor
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
