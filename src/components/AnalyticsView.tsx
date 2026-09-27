import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Filter, 
  Calendar, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Download, 
  Sparkles,
  ChevronRight,
  Info,
  Bot,
  Send,
  CheckCircle2
} from 'lucide-react';
import { Transaction, AppUser } from '../types';
import { formatUZS, formatShortUZS, formatDateUz } from '../utils/formatters';
import { getTransactionTimeString, exportTransactionsToCSV } from '../utils/csvExport';
import { sendFinancialReportViaServer, DEFAULT_TELEGRAM_BOT_USERNAME } from '../services/telegramService';

interface AnalyticsViewProps {
  transactions: Transaction[];
  users: AppUser[];
  onOpenAddModal: () => void;
}

// Consistent and distinct color mapping for categories
const CATEGORY_COLORS: Record<string, string> = {
  'Oziq-ovqat': '#10b981', // emerald-500
  "Transport va Yoqilg'i": '#0ea5e9', // sky-500
  'Kommunal va Uy': '#f59e0b', // amber-500
  "Ta'lim": '#6366f1', // indigo-500
  "Sog'liq va Dorixona": '#f43f5e', // rose-500
  "Kafe va Restoran": '#f97316', // orange-500
  "Ko'ngilochar va Dam olish": '#a855f7', // purple-500
  'Kiyim-kechak': '#ec4899', // pink-500
  'Texnika va Aloqa': '#06b6d4', // cyan-500
  'Boshqa xarajatlar': '#64748b', // slate-500
  'Biznes va Savdo': '#3b82f6', // blue-500
  'Maosh': '#10b981',
  'Freelance': '#8b5cf6',
  'Investitsiya': '#eab308',
  "Hadya va Sovg'a": '#fb7185',
  'Boshqa daromad': '#94a3b8',
};

const PALETTE = [
  '#10b981', '#0ea5e9', '#f59e0b', '#6366f1', '#f43f5e',
  '#f97316', '#a855f7', '#ec4899', '#06b6d4', '#14b8a6',
  '#84cc16', '#eab308', '#64748b', '#3b82f6'
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  users,
  onOpenAddModal,
}) => {
  // State filters
  const [selectedType, setSelectedType] = useState<'expense' | 'income' | 'all'>('expense');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'this_month' | 'last_30_days' | 'last_7_days'>('all');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('all');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Filter transactions based on type, period, and user
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter((tx) => {
      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // User filter
      if (selectedUserEmail !== 'all' && tx.createdBy?.email.toLowerCase() !== selectedUserEmail.toLowerCase()) {
        return false;
      }

      // Date period filter
      if (selectedPeriod !== 'all') {
        const txDate = new Date(tx.date);
        if (selectedPeriod === 'this_month') {
          if (txDate.getFullYear() !== currentYear || txDate.getMonth() !== currentMonth) {
            return false;
          }
        } else if (selectedPeriod === 'last_30_days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (txDate < thirtyDaysAgo) return false;
        } else if (selectedPeriod === 'last_7_days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (txDate < sevenDaysAgo) return false;
        }
      }

      return true;
    });
  }, [transactions, selectedType, selectedPeriod, selectedUserEmail]);

  // Aggregate by Category
  const { chartData, totalSum, topCategory, avgTransactionAmount, totalCount } = useMemo(() => {
    const categoryMap: Record<string, { amount: number; count: number; items: string[] }> = {};
    let total = 0;
    let count = 0;

    filteredTransactions.forEach((tx) => {
      const cat = tx.category || 'Boshqa';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { amount: 0, count: 0, items: [] };
      }
      categoryMap[cat].amount += tx.amount;
      categoryMap[cat].count += 1;
      if (tx.itemName && !categoryMap[cat].items.includes(tx.itemName)) {
        categoryMap[cat].items.push(tx.itemName);
      }
      total += tx.amount;
      count += 1;
    });

    const entries = Object.entries(categoryMap).map(([name, stat], idx) => {
      const percentage = total > 0 ? Number(((stat.amount / total) * 100).toFixed(1)) : 0;
      const color = CATEGORY_COLORS[name] || PALETTE[idx % PALETTE.length];
      return {
        name,
        value: stat.amount,
        count: stat.count,
        percentage,
        color,
        items: stat.items.slice(0, 3).join(', '),
      };
    });

    // Sort descending by value
    entries.sort((a, b) => b.value - a.value);

    const top = entries.length > 0 ? entries[0] : null;
    const avg = count > 0 ? Math.round(total / count) : 0;

    return {
      chartData: entries,
      totalSum: total,
      topCategory: top,
      avgTransactionAmount: avg,
      totalCount: count,
    };
  }, [filteredTransactions]);

  // Displayed category in center of donut
  const displayCategory = useMemo(() => {
    if (hoveredCategory) {
      return chartData.find((c) => c.name === hoveredCategory) || null;
    }
    if (activeCategoryFilter) {
      return chartData.find((c) => c.name === activeCategoryFilter) || null;
    }
    return null;
  }, [hoveredCategory, activeCategoryFilter, chartData]);

  // Category drill-down transactions
  const drillDownTransactions = useMemo(() => {
    if (!activeCategoryFilter) {
      return filteredTransactions.slice(0, 10);
    }
    return filteredTransactions.filter((tx) => tx.category === activeCategoryFilter);
  }, [filteredTransactions, activeCategoryFilter]);

  const handleExportCSV = () => {
    const list = activeCategoryFilter
      ? filteredTransactions.filter((tx) => tx.category === activeCategoryFilter)
      : filteredTransactions;
    exportTransactionsToCSV(list, `sarhisob_tahlil_${selectedType}_${selectedPeriod}`);
  };

  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramToast, setTelegramToast] = useState<string | null>(null);

  const handleSendReportToTelegram = async () => {
    setSendingTelegram(true);
    setTelegramToast(null);

    let chatId = '';
    try {
      const saved = localStorage.getItem('sarhisob_telegram_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        chatId = parsed.chatId || '';
      }
    } catch {}

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const topCats = chartData.slice(0, 5).map((c) => ({
      name: c.name,
      value: c.value,
      percentage: c.percentage,
    }));

    if (!chatId) {
      window.open(`https://t.me/${DEFAULT_TELEGRAM_BOT_USERNAME}?start=hisobot`, '_blank');
      setTelegramToast(`@${DEFAULT_TELEGRAM_BOT_USERNAME} ochilmoqda... Botga /start yuboring!`);
      setTimeout(() => setTelegramToast(null), 4000);
      setSendingTelegram(false);
      return;
    }

    try {
      const res = await sendFinancialReportViaServer({
        chatId,
        balance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        topCategories: topCats,
        period: selectedPeriod === 'this_month' ? 'Shu oy' : 'Joriy tahlil',
      });

      if (res.ok) {
        setTelegramToast(`Donut tahlili natijalari @${DEFAULT_TELEGRAM_BOT_USERNAME} botiga yuborildi!`);
      } else {
        window.open(`https://t.me/${DEFAULT_TELEGRAM_BOT_USERNAME}?start=hisobot`, '_blank');
        setTelegramToast(`@${DEFAULT_TELEGRAM_BOT_USERNAME} ochilmoqda...`);
      }
    } catch {
      window.open(`https://t.me/${DEFAULT_TELEGRAM_BOT_USERNAME}?start=hisobot`, '_blank');
      setTelegramToast(`@${DEFAULT_TELEGRAM_BOT_USERNAME} ochilmoqda...`);
    } finally {
      setSendingTelegram(false);
      setTimeout(() => setTelegramToast(null), 4000);
    }
  };

  // Custom Tooltip component for Recharts Donut
  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-white text-sm">{data.name}</span>
          </div>
          <div className="text-emerald-400 font-mono font-bold text-base">
            {formatUZS(data.value)}
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px] pt-0.5 border-t border-slate-800">
            <span>Ulushi: <strong className="text-white">{data.percentage}%</strong></span>
            <span>·</span>
            <span>{data.count} ta amaliyot</span>
          </div>
          {data.items && (
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {data.items}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Vizual Tahlil & Recharts Donut</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Xarajatlar va Tovarlar Taqsimoti
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Xarajatlaringiz qaysi toifalarga eng ko'p ketayotganini donut diagramma orqali aniq ko'ring, foizlarini taqqoslang va oqilona tejamkorlik rejasini tuzing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSendReportToTelegram}
              disabled={sendingTelegram}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
              title="@SarhisobMoliya_bot ga hisobot yuborish"
            >
              <Bot className="w-4 h-4 text-sky-400" />
              <span>{sendingTelegram ? 'Yuborilmoqda...' : 'Botga Yuborish'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all"
              title="Filtrlangan ma'lumotlarni yuklab olish"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>CSV Yuklab olish</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-950 active:scale-95"
            >
              <Package className="w-4 h-4" />
              <span>+ Yangi Tovar</span>
            </button>
          </div>
        </div>

        {telegramToast && (
          <div className="mt-4 p-3 bg-sky-950/80 border border-sky-500/30 rounded-xl text-xs text-sky-300 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{telegramToast}</span>
            </div>
            <a
              href={`https://t.me/${DEFAULT_TELEGRAM_BOT_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-white underline hover:text-sky-200 ml-3 shrink-0"
            >
              @{DEFAULT_TELEGRAM_BOT_USERNAME} ni ochish →
            </a>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Type Segmented Control */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSelectedType('expense');
                setActiveCategoryFilter(null);
              }}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chiqimlar (Xarajatlar)
            </button>
            <button
              onClick={() => {
                setSelectedType('income');
                setActiveCategoryFilter(null);
              }}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daromadlar (Kirim)
            </button>
            <button
              onClick={() => {
                setSelectedType('all');
                setActiveCategoryFilter(null);
              }}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedType === 'all'
                  ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Barchasi
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Barcha davr</option>
                <option value="this_month" className="bg-slate-900 text-white">Shu oy</option>
                <option value="last_30_days" className="bg-slate-900 text-white">Oxirgi 30 kun</option>
                <option value="last_7_days" className="bg-slate-900 text-white">Oxirgi 7 kun</option>
              </select>
            </div>

            {/* User Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">Barcha xodimlar</option>
                {users.map((u) => (
                  <option key={u.email} value={u.email} className="bg-slate-900 text-white">
                    {u.displayName || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sum */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            {selectedType === 'income' ? 'Jami Daromad' : selectedType === 'expense' ? 'Jami Xarajat' : 'Jami Aylanma'}
          </span>
          <div className={`text-xl font-bold font-mono ${selectedType === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatUZS(totalSum)}
          </div>
          <span className="text-[10px] text-slate-500">
            Tanlangan davr va filterlar bo‘yicha
          </span>
        </div>

        {/* Top Category */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Eng Katta Toifa
          </span>
          <div className="text-xl font-bold text-white truncate flex items-center gap-2">
            {topCategory ? (
              <>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: topCategory.color }} />
                <span className="truncate">{topCategory.name}</span>
              </>
            ) : (
              <span className="text-slate-500 text-sm">Mavjud emas</span>
            )}
          </div>
          <span className="text-[10px] text-amber-300 font-mono">
            {topCategory ? `${formatShortUZS(topCategory.value)} (${topCategory.percentage}%)` : '-'}
          </span>
        </div>

        {/* Average Transaction */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            O'rtacha Chek / Xarid
          </span>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {formatUZS(avgTransactionAmount)}
          </div>
          <span className="text-[10px] text-slate-500">
            Bitta amaliyotning o'rtacha qiymati
          </span>
        </div>

        {/* Transaction Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Amaliyotlar & Toifalar
          </span>
          <div className="text-xl font-bold font-mono text-white flex items-center gap-1.5">
            <span>{totalCount} ta yozuv</span>
            <span className="text-xs text-slate-400 font-normal">/ {chartData.length} toifa</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Qayd etilgan tovarlar jamlanmasi
          </span>
        </div>
      </div>

      {/* Main Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart Card (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-400" />
                <span>Toifalar Bo‘yicha Donut Diagramma</span>
              </h3>
              <p className="text-xs text-slate-400">
                Toifani belgilash uchun diagramma qismlariga bosing
              </p>
            </div>

            {activeCategoryFilter && (
              <button
                onClick={() => setActiveCategoryFilter(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition-colors"
              >
                Filtrni tozalash
              </button>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-400 font-medium">Tanlangan parametrlar bo‘yicha xarajatlar topilmadi</p>
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all"
              >
                + Tovar yoki Xarajat Qo‘shish
              </button>
            </div>
          ) : (
            <div className="relative w-full h-[360px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={78}
                    outerRadius={128}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="#0f172a"
                    strokeWidth={3}
                    onMouseEnter={(entry: any) => setHoveredCategory(entry?.name ?? null)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={(entry: any) =>
                      setActiveCategoryFilter(entry?.name === activeCategoryFilter ? null : (entry?.name ?? null))
                    }
                    cursor="pointer"
                  >
                    {chartData.map((entry, index) => {
                      const isHighlighted =
                        (!hoveredCategory && !activeCategoryFilter) ||
                        hoveredCategory === entry.name ||
                        activeCategoryFilter === entry.name;

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={isHighlighted ? 1 : 0.35}
                          className="transition-all duration-300 outline-none"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Label inside Donut Hole */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                {displayCategory ? (
                  <div className="space-y-0.5 animate-fade-in max-w-[150px]">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                      {displayCategory.name}
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-white block leading-tight">
                      {formatShortUZS(displayCategory.value)}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 block">
                      {displayCategory.percentage}% ulush
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5 max-w-[150px]">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Jami Sarf
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-white block leading-tight">
                      {formatShortUZS(totalSum)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {totalCount} ta amaliyot
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Legend Chips */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto scrollbar-none">
            {chartData.map((item) => {
              const isSelected = activeCategoryFilter === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveCategoryFilter(isSelected ? null : item.name)}
                  onMouseEnter={() => setHoveredCategory(item.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all border ${
                    isSelected
                      ? 'bg-slate-800 border-white text-white font-bold scale-105'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate max-w-[120px]">{item.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{item.percentage}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Ranked Breakdown List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Toifalar Reytingi</h3>
                <p className="text-xs text-slate-400">Summasi va foiz salmog‘i bo‘yicha</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {chartData.length} toifa
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {chartData.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Ma'lumot mavjud emas</p>
              ) : (
                chartData.map((item, idx) => {
                  const isSelected = activeCategoryFilter === item.name;
                  return (
                    <div
                      key={item.name}
                      onClick={() => setActiveCategoryFilter(isSelected ? null : item.name)}
                      onMouseEnter={() => setHoveredCategory(item.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                          : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-slate-500 w-4 text-center">
                            #{idx + 1}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-white truncate max-w-[130px]">
                            {item.name}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold font-mono text-slate-200 block">
                            {formatUZS(item.value)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar & Percentage */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 w-11 text-right">
                          {item.percentage}%
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{item.count} ta amaliyot</span>
                        <span>O'rtacha: {formatShortUZS(Math.round(item.value / item.count))}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Toifani tanlash orqali uning tovarlarini ko'ring</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Comparison Bar Chart (Visual Comparison) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" />
              <span>Toifalar Xarajatlarini O‘zaro Taqqoslash</span>
            </h3>
            <p className="text-xs text-slate-400">
              Qaysi toifa eng ko'p mablag' talab qilayotganini chiziqli ustunlarda taqqoslang
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">Ma'lumot mavjud emas</p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(0, 8)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  interval={0}
                  tick={{ fill: '#94a3b8' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => formatShortUZS(val)}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <span className="font-bold text-white">{data.name}</span>
                          <div className="text-emerald-400 font-mono font-bold">
                            {formatUZS(data.value)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {data.percentage}% ulush · {data.count} ta amaliyot
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(entry: any) =>
                    setActiveCategoryFilter(entry?.name === activeCategoryFilter ? null : (entry?.name ?? null))
                  }
                >
                  {chartData.slice(0, 8).map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.color}
                      opacity={!activeCategoryFilter || activeCategoryFilter === entry.name ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Drill-Down Transactions List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              <span>
                {activeCategoryFilter ? `"${activeCategoryFilter}" Toifasidagi Tovarlar va Yozuvlar` : "So'nggi Tovarlar va Amaliyotlar"}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {activeCategoryFilter
                ? `Faqat tanlangan "${activeCategoryFilter}" toifasiga tegishli tranzaksiyalar ro'yxati`
                : "Barcha toifalar bo'yicha so'nggi kiritilgan amaliyotlar"}
            </p>
          </div>

          {activeCategoryFilter && (
            <button
              onClick={() => setActiveCategoryFilter(null)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline self-start sm:self-auto"
            >
              Barchasini ko'rsatish
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tovar nomi</th>
                <th className="px-4 py-3">Miqdori</th>
                <th className="px-4 py-3">Summasi</th>
                <th className="px-4 py-3">Toifa</th>
                <th className="px-4 py-3">Sana va Vaqt</th>
                <th className="px-4 py-3">Kim kiritdi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {drillDownTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Hech qanday tovar yoki amaliyot topilmadi
                  </td>
                </tr>
              ) : (
                drillDownTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      {tx.itemName || tx.description}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                      {tx.quantity || '1 dona'}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono">
                      <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'income' ? '+' : '-'}{formatUZS(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#64748b' }}
                        />
                        <span>{tx.category}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      <span>{tx.date}</span>
                      <span className="text-amber-300 ml-2">{getTransactionTimeString(tx)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <span className="truncate max-w-[130px] block">
                        {tx.createdBy?.name || 'Foydalanuvchi'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
