import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Bot
} from 'lucide-react';
import { Transaction, RecurringBill, SavingsGoal, ActiveTab } from '../types';
import { formatUZS, formatDateUz, formatShortUZS } from '../utils/formatters';
import { getTransactionTimeString } from '../utils/csvExport';

interface DashboardOverviewProps {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  goals: SavingsGoal[];
  balance: number;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onOpenTelegram: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  recurringBills,
  goals,
  balance,
  setActiveTab,
  onOpenAddModal,
  onOpenTelegram,
}) => {
  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const unpaidBills = recurringBills.filter((b) => !b.isPaidThisMonth);

  // Safe daily spend calculation
  const safeDailySpend = Math.max(0, Math.round(Math.max(0, netSavings) / 30));

  return (
    <div className="space-y-6">
      {/* AI Smart Insight Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">AI Moliyaviy Tahlili</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
                  Avtomatik
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Joriy oyda daromadning <strong className="text-emerald-400 font-semibold">{savingsRate}%</strong> qismi tejalmoqda. 
                Siz uchun tavsiya etiladigan <strong className="text-white font-semibold">kunlik xavfsiz sarf: {formatUZS(safeDailySpend || 120000)}</strong>. 
                Kafe va ko‘ngilochar xarajatlarni 20% qisqartirsangiz, oyiga <strong className="text-emerald-300 font-semibold">600 000 so‘mdan ko‘proq</strong> qo‘shimcha tejash mumkin!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('ai-advisor')}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>To‘liq tahlilni ko‘rish</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Jami Balans</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-200">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatUZS(balance)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +{savingsRate}%
            </span>
            <span>oylik sof o‘sish sur'ati</span>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Oylik Kirim</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400">
            {formatUZS(totalIncome)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <span>{transactions.filter((t) => t.type === 'income').length} ta kirim manbai</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Oylik Chiqim</span>
            <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/50">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-400">
            {formatUZS(totalExpense)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <span>{transactions.filter((t) => t.type === 'expense').length} ta xarajat qayd etildi</span>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Jamg‘arma Darajasi</span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-900/50">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-400">
            {savingsRate}%
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <span>Sof tejalgan: <strong className="text-slate-200">{formatShortUZS(netSavings)}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid: Visual Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Monthly Ratio Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Kirim va Chiqim Nisbati</h3>
              <p className="text-xs text-slate-400">Mablag‘lar oqimi va sof jamg‘arma taqsimoti</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
              Sentyabr 2026
            </span>
          </div>

          {/* Visual Bar Comparison */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Jami Kirim</span>
                <span className="text-emerald-400 font-bold">{formatUZS(totalIncome)} (100%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Jami Chiqim</span>
                <span className="text-rose-400 font-bold">
                  {formatUZS(totalExpense)} ({totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Sof Jamg‘arma (Tejalgan qism)</span>
                <span className="text-amber-400 font-bold">{formatUZS(netSavings)} ({savingsRate}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, savingsRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3 Quick highlights */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-5 border-t border-slate-800 text-center">
            <div className="p-2 sm:p-3 bg-slate-800/40 rounded-xl">
              <span className="text-[11px] text-slate-400 block">Kunlik sarf o‘rtacha</span>
              <span className="text-xs sm:text-sm font-bold text-white mt-1 block">
                {formatShortUZS(totalExpense / 23)}
              </span>
            </div>
            <div className="p-2 sm:p-3 bg-slate-800/40 rounded-xl">
              <span className="text-[11px] text-slate-400 block">Xavfsiz kunlik limit</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 block">
                {formatShortUZS(safeDailySpend)}
              </span>
            </div>
            <div className="p-2 sm:p-3 bg-slate-800/40 rounded-xl">
              <span className="text-[11px] text-slate-400 block">Kutilayotgan oylik sof foyda</span>
              <span className="text-xs sm:text-sm font-bold text-amber-400 mt-1 block">
                {formatShortUZS(netSavings)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Expense Categories Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Eng Katta Xarajatlar</h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Hammasi
            </button>
          </div>

          <div className="space-y-3.5">
            {sortedCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Hali xarajatlar kiritilmagan</p>
            ) : (
              sortedCategories.map(([cat, amt]) => {
                const percent = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium truncate">{cat}</span>
                      <span className="text-slate-200 font-semibold">
                        {formatUZS(amt)} <span className="text-slate-400 text-[10px]">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('forecast')}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kelgusi xarajat prognozini ko‘rish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row: Recent Transactions & Upcoming Recurring Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">So‘nggi Amaliyotlar</h3>
              <p className="text-xs text-slate-400">Oxirgi amalga oshirilgan kirim va chiqimlar</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                + Yangi
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-medium text-slate-400 hover:text-white"
              >
                Barchasi &rarr;
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl text-white ${tx.type === 'income' ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">{tx.description}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.category}</span>
                      <span>·</span>
                      <span>{formatDateUz(tx.date)}</span>
                      <span>·</span>
                      <span className="font-mono text-amber-400/90">{getTransactionTimeString(tx)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs sm:text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatUZS(tx.amount)}
                  </span>
                  {tx.paymentMethod && (
                    <span className="block text-[10px] text-slate-400">{tx.paymentMethod}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bills & Telegram Quick Card (1 col) */}
        <div className="space-y-6">
          {/* Recurring Bills */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Doimiy To‘lovlar</span>
              </h3>
              <button
                onClick={() => setActiveTab('goals')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Barchasi
              </button>
            </div>

            <div className="space-y-2.5">
              {recurringBills.slice(0, 3).map((bill) => (
                <div
                  key={bill.id}
                  className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">{bill.title}</span>
                    <span className="text-[10px] text-slate-400">Har oyning {bill.dueDay}-sanasida</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">{formatUZS(bill.amount)}</span>
                    <span className={`text-[10px] font-medium ${bill.isPaidThisMonth ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {bill.isPaidThisMonth ? "To'langan" : "Kutilmoqda"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telegram Bot Callout */}
          <div className="bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-800/60 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Telegram orqali boshqarish</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Telegramda xarajatlarni yozing: bot avtomatik hisoblaydi, tahlil qiladi va prognoz beradi.
                </p>
                <button
                  onClick={onOpenTelegram}
                  className="mt-3 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Telegram botni ochish</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
