import React, { useState, useMemo } from 'react';
import { Expense, ThreeMonthPeriodSettings } from '../types';
import { formatUZS, formatShortDate } from '../utils/formatters';
import { 
  Calendar, 
  TrendingUp, 
  ArrowRightLeft, 
  PieChart as PieIcon, 
  Layers, 
  CreditCard,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface MonthlyMonitoringViewProps {
  expenses: Expense[];
  settings: ThreeMonthPeriodSettings;
  selectedMonthTab?: 'Month 1' | 'Month 2' | 'Month 3';
  onSelectExpense?: (expense: Expense) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const MonthlyMonitoringView: React.FC<MonthlyMonitoringViewProps> = ({
  expenses,
  settings,
  selectedMonthTab = 'Month 1',
  onSelectExpense,
}) => {
  const [activeMonth, setActiveMonth] = useState<'Month 1' | 'Month 2' | 'Month 3'>(selectedMonthTab);

  // Filter only ACTIVE expenses
  const activeExpenses = useMemo(() => {
    return expenses.filter((e) => e.status === 'ACTIVE');
  }, [expenses]);

  // Separate expenses for Month 1, Month 2, Month 3
  const m1Expenses = useMemo(() => activeExpenses.filter((e) => e.month === 'Month 1'), [activeExpenses]);
  const m2Expenses = useMemo(() => activeExpenses.filter((e) => e.month === 'Month 2'), [activeExpenses]);
  const m3Expenses = useMemo(() => activeExpenses.filter((e) => e.month === 'Month 3'), [activeExpenses]);

  // Current active month's expenses
  const currentMonthExpenses = useMemo(() => {
    if (activeMonth === 'Month 1') return m1Expenses;
    if (activeMonth === 'Month 2') return m2Expenses;
    return m3Expenses;
  }, [activeMonth, m1Expenses, m2Expenses, m3Expenses]);

  // Current month definition
  const currentMonthConfig = useMemo(() => {
    if (activeMonth === 'Month 1') return settings.month1;
    if (activeMonth === 'Month 2') return settings.month2;
    return settings.month3;
  }, [activeMonth, settings]);

  // Stats for the active month
  const stats = useMemo(() => {
    const total = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const count = currentMonthExpenses.length;
    const daysInMonth = 30;
    const dailyAverage = Math.round(total / daysInMonth);
    const averageTransaction = count > 0 ? Math.round(total / count) : 0;

    let largest = 0;
    let lowest = count > 0 ? currentMonthExpenses[0].amount : 0;
    currentMonthExpenses.forEach((e) => {
      if (e.amount > largest) largest = e.amount;
      if (e.amount < lowest) lowest = e.amount;
    });

    // Category Totals
    const catMap = new Map<string, number>();
    currentMonthExpenses.forEach((e) => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });
    const categoryTotals = Array.from(catMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const top5Categories = categoryTotals.slice(0, 5);
    const top10Transactions = [...currentMonthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 10);

    // Daily Trend
    const dayMap = new Map<string, number>();
    currentMonthExpenses.forEach((e) => {
      dayMap.set(e.date, (dayMap.get(e.date) || 0) + e.amount);
    });
    const dailyTrend = Array.from(dayMap.keys()).sort().map((d) => ({
      date: formatShortDate(d),
      amount: dayMap.get(d) || 0,
    }));

    return {
      total,
      count,
      dailyAverage,
      averageTransaction,
      largest,
      lowest,
      categoryTotals,
      top5Categories,
      top10Transactions,
      dailyTrend,
    };
  }, [currentMonthExpenses]);

  // Comparisons: Month 1 vs Month 2, Month 2 vs Month 3, Month 1 vs Month 3
  const comparisons = useMemo(() => {
    const t1 = m1Expenses.reduce((s, e) => s + e.amount, 0);
    const t2 = m2Expenses.reduce((s, e) => s + e.amount, 0);
    const t3 = m3Expenses.reduce((s, e) => s + e.amount, 0);

    const calcDiff = (a: number, b: number) => {
      const diff = b - a;
      const pct = a > 0 ? ((diff / a) * 100).toFixed(1) : (b > 0 ? '100.0' : '0.0');
      const sign = diff > 0 ? '+' : '';
      return { diff, pct: `${sign}${pct}%`, sign };
    };

    return [
      {
        pair: 'Month 1 vs Month 2',
        fromName: settings.month1.name,
        toName: settings.month2.name,
        fromTotal: t1,
        toTotal: t2,
        ...calcDiff(t1, t2),
      },
      {
        pair: 'Month 2 vs Month 3',
        fromName: settings.month2.name,
        toName: settings.month3.name,
        fromTotal: t2,
        toTotal: t3,
        ...calcDiff(t2, t3),
      },
      {
        pair: 'Month 1 vs Month 3',
        fromName: settings.month1.name,
        toName: settings.month3.name,
        fromTotal: t1,
        toTotal: t3,
        ...calcDiff(t1, t3),
      },
    ];
  }, [m1Expenses, m2Expenses, m3Expenses, settings]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Monthly Expense Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Independent month-by-month accounting analysis and objective numerical comparisons
        </p>
      </div>

      {/* TOP SEGMENTED CONTROL: [ MONTH 1 ] [ MONTH 2 ] [ MONTH 3 ] */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center gap-2">
        {(['Month 1', 'Month 2', 'Month 3'] as const).map((mKey) => {
          const cfg = mKey === 'Month 1' ? settings.month1 : mKey === 'Month 2' ? settings.month2 : settings.month3;
          const isSelected = activeMonth === mKey;
          const monthTxCount = (mKey === 'Month 1' ? m1Expenses : mKey === 'Month 2' ? m2Expenses : m3Expenses).length;

          return (
            <button
              key={mKey}
              onClick={() => setActiveMonth(mKey)}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-500'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{cfg.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? 'bg-emerald-700/80 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {monthTxCount} txns
                </span>
              </div>
              <span className={`text-[11px] font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                {formatShortDate(cfg.startDate)} — {formatShortDate(cfg.endDate)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE MONTH STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Expense */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Expense</p>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
            {formatUZS(stats.total)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">{stats.count} recorded transactions</p>
        </div>

        {/* Daily Average */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Daily Average</p>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">
            {formatUZS(stats.dailyAverage)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">30-day accounting average</p>
        </div>

        {/* Average Transaction */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Transaction</p>
          <div className="text-xl sm:text-2xl font-bold text-teal-400 font-mono mt-1">
            {formatUZS(stats.averageTransaction)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Per transaction size</p>
        </div>

        {/* Range: Largest vs Lowest */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Largest / Lowest</p>
          <div className="text-sm font-semibold text-slate-200 font-mono mt-1">
            Max: <span className="text-white font-bold">{formatUZS(stats.largest)}</span>
          </div>
          <div className="text-xs font-medium text-slate-400 font-mono mt-0.5">
            Min: <span>{formatUZS(stats.lowest)}</span>
          </div>
        </div>

      </div>

      {/* MONTH EXPENSE TREND CHART */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              {currentMonthConfig.name} Expense Trend
            </h3>
            <p className="text-xs text-slate-400">Daily spending timeline for this specific month</p>
          </div>
          <Calendar className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="h-60 w-full">
          {stats.dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              No transactions recorded for {currentMonthConfig.name}.
            </div>
          )}
        </div>
      </div>

      {/* 2 COLUMNS: TOP 5 CATEGORIES & TOP 10 TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP 5 CATEGORIES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Top 5 Categories in {currentMonthConfig.name}
            </h3>
            <span className="text-xs text-slate-400 font-mono">Category Totals</span>
          </div>

          <div className="space-y-3">
            {stats.top5Categories.length > 0 ? (
              stats.top5Categories.map((c, i) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">
                      {i + 1}. {c.category}
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {formatUZS(c.amount)} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${c.percentage}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No categories recorded.</p>
            )}
          </div>
        </div>

        {/* TOP 10 TRANSACTIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Top 10 Transactions in {currentMonthConfig.name}
            </h3>
            <span className="text-xs text-slate-400 font-mono">By Amount</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {stats.top10Transactions.length > 0 ? (
              stats.top10Transactions.map((e, idx) => (
                <div
                  key={e.id}
                  onClick={() => onSelectExpense?.(e)}
                  className="p-2.5 rounded-xl bg-slate-850/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="truncate max-w-[65%]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 truncate">{e.description}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatShortDate(e.date)}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{e.category}</span>
                      <span>•</span>
                      <span>{e.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-white font-mono text-sm">{formatUZS(e.amount)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded.</p>
            )}
          </div>
        </div>

      </div>

      {/* MONTH-TO-MONTH NUMERICAL COMPARISONS (Strictly objective numerical differences) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Objective Month-to-Month Comparisons
            </h2>
            <p className="text-xs text-slate-400">
              Numerical difference and percentage change between accounting periods (no subjective labels)
            </p>
          </div>
          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparisons.map((c) => (
            <div key={c.pair} className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
                <span>{c.pair}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  {c.pct}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px] truncate">{c.fromName}</p>
                  <p className="font-mono font-semibold text-slate-200 truncate">{formatUZS(c.fromTotal)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px] truncate">{c.toName}</p>
                  <p className="font-mono font-semibold text-slate-200 truncate">{formatUZS(c.toTotal)}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Absolute Difference:</span>
                <span className="font-mono font-bold text-white">
                  {c.sign}{formatUZS(c.diff)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
