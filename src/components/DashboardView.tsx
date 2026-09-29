import React, { useMemo } from 'react';
import { 
  Expense, 
  ThreeMonthPeriodSettings, 
  Category, 
  PaymentMethod 
} from '../types';
import { formatUZS, formatShortDate } from '../utils/formatters';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  Receipt, 
  CreditCard, 
  PieChart as PieIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

interface DashboardViewProps {
  expenses: Expense[];
  settings: ThreeMonthPeriodSettings;
  categories: Category[];
  onOpenAddModal: () => void;
  onNavigateToMonthly: (monthTab: 'Month 1' | 'Month 2' | 'Month 3') => void;
  onNavigateToHistory: () => void;
}

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#ef4444'
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  settings,
  categories,
  onOpenAddModal,
  onNavigateToMonthly,
  onNavigateToHistory,
}) => {
  // Only ACTIVE expenses count towards financial calculations
  const activeExpenses = useMemo(() => {
    return expenses.filter((e) => e.status === 'ACTIVE');
  }, [expenses]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. TODAY METRICS
  const todayStats = useMemo(() => {
    const list = activeExpenses.filter((e) => e.date === todayStr);
    const total = list.reduce((s, e) => s + e.amount, 0);
    const count = list.length;
    const largest = list.reduce((max, e) => (e.amount > max ? e.amount : max), 0);
    const average = count > 0 ? Math.round(total / count) : 0;
    return { total, count, largest, average };
  }, [activeExpenses, todayStr]);

  // Determine current active month (e.g. Month 1, Month 2, Month 3 based on today)
  const currentMonthPeriod = useMemo(() => {
    if (todayStr >= settings.month1.startDate && todayStr <= settings.month1.endDate) {
      return { tag: 'Month 1', period: settings.month1 };
    }
    if (todayStr >= settings.month2.startDate && todayStr <= settings.month2.endDate) {
      return { tag: 'Month 2', period: settings.month2 };
    }
    if (todayStr >= settings.month3.startDate && todayStr <= settings.month3.endDate) {
      return { tag: 'Month 3', period: settings.month3 };
    }
    // Default to Month 1 if outside period or start of period
    return { tag: 'Month 1', period: settings.month1 };
  }, [todayStr, settings]);

  // 2. CURRENT MONTH METRICS
  const currentMonthStats = useMemo(() => {
    const list = activeExpenses.filter((e) => e.month === currentMonthPeriod.tag);
    const total = list.reduce((s, e) => s + e.amount, 0);
    const count = list.length;
    const averageTx = count > 0 ? Math.round(total / count) : 0;
    const daysInMonth = 30; // standard accounting month
    const dailyAverage = Math.round(total / daysInMonth);

    // Top expense category in this month
    const catMap = new Map<string, number>();
    list.forEach((e) => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });
    let topCategory = 'None';
    let maxCatAmount = 0;
    catMap.forEach((amt, cat) => {
      if (amt > maxCatAmount) {
        maxCatAmount = amt;
        topCategory = cat;
      }
    });

    // Remaining days in month
    const endMs = new Date(currentMonthPeriod.period.endDate).getTime();
    const todayMs = new Date(todayStr).getTime();
    const remainingDays = Math.max(0, Math.ceil((endMs - todayMs) / (1000 * 60 * 60 * 24)));

    return { total, count, dailyAverage, averageTx, topCategory, remainingDays };
  }, [activeExpenses, currentMonthPeriod, todayStr]);

  // 3. 3-MONTH PERIOD METRICS
  const threeMonthStats = useMemo(() => {
    const total = activeExpenses.reduce((s, e) => s + e.amount, 0);
    const count = activeExpenses.length;
    const averageMonthly = Math.round(total / 3);
    const averageDaily = Math.round(total / 90);

    // Monthly breakdown
    const m1Total = activeExpenses.filter((e) => e.month === 'Month 1').reduce((s, e) => s + e.amount, 0);
    const m2Total = activeExpenses.filter((e) => e.month === 'Month 2').reduce((s, e) => s + e.amount, 0);
    const m3Total = activeExpenses.filter((e) => e.month === 'Month 3').reduce((s, e) => s + e.amount, 0);

    const monthlyComparison = [
      { name: settings.month1.name, month: 'Month 1', total: m1Total, count: activeExpenses.filter((e) => e.month === 'Month 1').length },
      { name: settings.month2.name, month: 'Month 2', total: m2Total, count: activeExpenses.filter((e) => e.month === 'Month 2').length },
      { name: settings.month3.name, month: 'Month 3', total: m3Total, count: activeExpenses.filter((e) => e.month === 'Month 3').length },
    ];

    // Category breakdown
    const catMap = new Map<string, number>();
    activeExpenses.forEach((e) => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });
    const categoryComparison = Array.from(catMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { total, count, averageMonthly, averageDaily, monthlyComparison, categoryComparison };
  }, [activeExpenses, settings]);

  // 4. CHART DATA PREPARATION
  // Daily expenses trend (last 14 active days)
  const dailyChartData = useMemo(() => {
    const dayMap = new Map<string, number>();
    activeExpenses.forEach((e) => {
      dayMap.set(e.date, (dayMap.get(e.date) || 0) + e.amount);
    });
    const sortedDays = Array.from(dayMap.keys()).sort().slice(-14);
    return sortedDays.map((d) => ({
      date: formatShortDate(d),
      rawDate: d,
      amount: dayMap.get(d) || 0,
    }));
  }, [activeExpenses]);

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const payMap = new Map<string, number>();
    activeExpenses.forEach((e) => {
      const pm = e.paymentMethod || 'Cash';
      payMap.set(pm, (payMap.get(pm) || 0) + e.amount);
    });
    return Array.from(payMap.entries()).map(([name, value]) => ({ name, value }));
  }, [activeExpenses]);

  // Top 10 Expense Items
  const top10Expenses = useMemo(() => {
    return [...activeExpenses].sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [activeExpenses]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Accounting Period Announcement */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              3-Month Business Accounting
            </span>
            <span className="text-xs text-slate-400">
              {formatShortDate(settings.startDate)} — {formatShortDate(settings.endDate)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Financial Expense Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time tracking synchronized with Google Sheets (*1bONPkd7...*)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition active:scale-95 flex items-center gap-2"
          >
            <span>+ Record Expense</span>
          </button>
          <button
            onClick={onNavigateToHistory}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm transition"
          >
            History
          </button>
        </div>
      </div>

      {/* 3 CORE SUMMARY TILES: TODAY | CURRENT MONTH | 3-MONTH TOTAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* TODAY CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Today's Total</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono">
              {formatShortDate(todayStr)}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            {formatUZS(todayStats.total)}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-400 text-[11px]">Transactions</p>
              <p className="font-semibold text-slate-200">{todayStats.count}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Largest</p>
              <p className="font-semibold text-slate-200 truncate">{formatUZS(todayStats.largest)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Average</p>
              <p className="font-semibold text-slate-200 truncate">{formatUZS(todayStats.average)}</p>
            </div>
          </div>
        </div>

        {/* CURRENT MONTH CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="text-emerald-400">{currentMonthPeriod.period.name} (Current)</span>
            <span className="text-slate-400 text-[11px]">
              {currentMonthStats.remainingDays} days left
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
            {formatUZS(currentMonthStats.total)}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-400 text-[11px]">Daily Avg</p>
              <p className="font-semibold text-slate-200 truncate">{formatUZS(currentMonthStats.dailyAverage)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Avg Transaction</p>
              <p className="font-semibold text-slate-200 truncate">{formatUZS(currentMonthStats.averageTx)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Top Category</p>
              <p className="font-semibold text-slate-200 truncate">{currentMonthStats.topCategory}</p>
            </div>
          </div>
        </div>

        {/* 3-MONTH TOTAL CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="text-teal-400">3-Month Total Period</span>
            <span className="text-slate-300 font-mono text-[11px] font-semibold">
              {threeMonthStats.count} txns
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 tracking-tight font-mono">
            {formatUZS(threeMonthStats.total)}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-400 text-[11px]">Average Monthly</p>
              <p className="font-semibold text-slate-200 truncate">{formatUZS(threeMonthStats.averageMonthly)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Average Daily</p>
              <p className="font-semibold text-slate-200 truncate">{formatUZS(threeMonthStats.averageDaily)}</p>
            </div>
          </div>
        </div>

      </div>

      {/* MONTHLY COMPARISON CARDS (Month 1 | Month 2 | Month 3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              3-Month Breakdown & Comparison
            </h2>
            <p className="text-xs text-slate-400">
              Separate monitoring for Month 1, Month 2, and Month 3
            </p>
          </div>
          <button
            onClick={() => onNavigateToMonthly('Month 1')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            <span>Full Monthly Monitoring</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {threeMonthStats.monthlyComparison.map((m, idx) => (
            <div
              key={m.month}
              onClick={() => onNavigateToMonthly(m.month as any)}
              className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-emerald-500/30 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">{m.name}</span>
                <span className="font-mono text-[11px]">{m.count} txns</span>
              </div>
              <div className="text-xl font-bold text-white font-mono group-hover:text-emerald-400 transition">
                {formatUZS(m.total)}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Share of 3-month total:</span>
                <span className="font-semibold text-slate-200">
                  {threeMonthStats.total > 0 ? ((m.total / threeMonthStats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2 CHARTS ROW: DAILY TREND & CATEGORY DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: DAILY EXPENSES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Daily Expenses Trend</h3>
              <p className="text-xs text-slate-400">Expense volume over the past active days</p>
            </div>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-64 w-full">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(v: any) => [formatUZS(Number(v)), 'Expenses']}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No expense data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: EXPENSES BY CATEGORY (DONUT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Expenses by Category</h3>
              <p className="text-xs text-slate-400">3-month category distribution and percentages</p>
            </div>
            <PieIcon className="w-4 h-4 text-teal-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-56">
              {threeMonthStats.categoryComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={threeMonthStats.categoryComparison}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {threeMonthStats.categoryComparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(v: any) => [formatUZS(Number(v)), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No category data available.
                </div>
              )}
            </div>

            {/* Category breakdown legend list */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
              {threeMonthStats.categoryComparison.slice(0, 6).map((c, i) => (
                <div key={c.category} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-slate-300 truncate">{c.category}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-white font-mono">{c.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: PAYMENT METHOD BREAKDOWN & TOP 10 EXPENSES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PAYMENT METHODS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Payment Methods</h3>
              <p className="text-xs text-slate-400">Cash vs Card vs Bank Transfer</p>
            </div>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3">
            {paymentMethodData.map((pm) => {
              const total = threeMonthStats.total || 1;
              const pct = Number(((pm.value / total) * 100).toFixed(1));
              return (
                <div key={pm.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{pm.name}</span>
                    <span className="font-mono text-slate-200 font-semibold">{formatUZS(pm.value)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP 10 EXPENSE ITEMS TABLE */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Top 10 Expense Items</h3>
              <p className="text-xs text-slate-400">Largest individual expenses recorded in the period</p>
            </div>
            <button
              onClick={onNavigateToHistory}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              View all history →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {top10Expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{e.id}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{formatShortDate(e.date)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-100 max-w-xs truncate">{e.description}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{formatUZS(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
