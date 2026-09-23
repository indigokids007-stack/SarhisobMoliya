import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Transaction, RecurringBill, SavingsGoal, AIForecastResult } from '../types';
import { getExpenseForecastWithAI } from '../services/api';
import { formatUZS, formatShortUZS, getDaysRemainingInMonth } from '../utils/formatters';

interface ExpenseForecastProps {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  goals: SavingsGoal[];
  balance: number;
}

export const ExpenseForecast: React.FC<ExpenseForecastProps> = ({
  transactions,
  recurringBills,
  goals,
  balance,
}) => {
  const [forecast, setForecast] = useState<AIForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<'30' | '60' | '90'>('30');
  const [savingScenarioPercent, setSavingScenarioPercent] = useState<number>(0);

  const fetchForecast = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getExpenseForecastWithAI({
        transactions,
        recurringBills,
        goals,
        currentBalance: balance,
      });
      setForecast(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Prognozni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [transactions.length, balance]);

  const daysRemaining = getDaysRemainingInMonth();

  // Scenario calculations
  const baseExpense = forecast?.projectedMonthlyExpense || 0;
  const adjustedExpense = baseExpense * (1 - savingScenarioPercent / 100);
  const scenarioMonthlySavings = baseExpense - adjustedExpense;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Kelgusi Xarajatlar AI Prognozi</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
              Prediktiv Model
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            O‘tmishdagi sarf odatlari va doimiy to‘lovlarga asoslangan kelgusi 30, 60 va 90 kunlik aniq hisob-kitoblar
          </p>
        </div>

        <button
          onClick={fetchForecast}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Prognoz hisoblanmoqda...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Qayta hisoblash</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !forecast ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Kelgusi oylik xarajatlar modellashtirilmoqda...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Barcha toifalar dinamikasi, inflyatsiya va doimiy to'lovlar hisobga olinmoqda.
          </p>
        </div>
      ) : forecast ? (
        <>
          {/* Top 3 Forecast KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Safe Daily Spend */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Kunlik Xavfsiz Limit</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {formatUZS(forecast.safeDailySpend)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Oy oxirigacha qolgan <strong className="text-slate-200">{daysRemaining} kun</strong> uchun tavsiya etilgan maksimal kunlik sarf.
              </p>
            </div>

            {/* Projected 30-Day Expense */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">30 Kunlik Kutilayotgan Chiqim</span>
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatUZS(forecast.projectedMonthlyExpense)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Kutilayotgan daromad: <strong className="text-emerald-400">{formatUZS(forecast.projectedMonthlyIncome)}</strong>
              </p>
            </div>

            {/* Risk Level & Cash Flow */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Kassa Xavfi Darajasi</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    forecast.riskLevel === 'Xavfsiz'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : forecast.riskLevel === "O'rta"
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {forecast.riskLevel}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-amber-400">
                +{formatShortUZS(forecast.netCashFlow)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Oy yakunida kutilayotgan sof ijobiy kassa oqimi.
              </p>
            </div>
          </div>

          {/* Horizon Selector (30 / 60 / 90 days) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Prognoz Gorizonti</h3>
                <p className="text-xs text-slate-400">Kelgusi davrlar bo‘yicha kutilayotgan dinamika</p>
              </div>

              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setSelectedHorizon('30')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedHorizon === '30' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30 Kun
                </button>
                <button
                  onClick={() => setSelectedHorizon('60')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedHorizon === '60' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  60 Kun (2 oy)
                </button>
                <button
                  onClick={() => setSelectedHorizon('90')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedHorizon === '90' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  90 Kun (Kvartal)
                </button>
              </div>
            </div>

            {/* Displaying selected horizon details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {selectedHorizon === '30'
                    ? 'Yaqin 30 kundagi kutilayotgan xarajatlar:'
                    : selectedHorizon === '60'
                    ? 'Keyingi 60 kundagi kutilayotgan jami xarajat:'
                    : 'Kelgusi 90 kundagi (kvartal) jami xarajat:'}
                </span>
                <span className="text-2xl font-bold text-rose-400">
                  {formatUZS(
                    selectedHorizon === '30'
                      ? forecast.forecast30Days.totalExpense
                      : selectedHorizon === '60'
                      ? forecast.forecast60Days.totalExpense
                      : forecast.forecast90Days.totalExpense
                  )}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  Kutilayotgan jami qoldiq balans:
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatUZS(
                    selectedHorizon === '30'
                      ? balance + forecast.netCashFlow
                      : selectedHorizon === '60'
                      ? forecast.forecast60Days.predictedBalance
                      : forecast.forecast90Days.predictedBalance
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Category-Level 30-Day Breakdown */}
          {forecast.forecast30Days?.categories && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-1">
                Kelgusi 30 Kun: Toifalar Kesimidagi Prognoz
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                AI har bir yo‘nalish bo‘yicha ehtimoliy o‘zgarish trendini ko‘rsatmoqda
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {forecast.forecast30Days.categories.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.category}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.trend.startsWith('+')
                            ? 'text-rose-400 bg-rose-950/60'
                            : item.trend.startsWith('-')
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : 'text-slate-400 bg-slate-800'
                        }`}
                      >
                        {item.trend}
                      </span>
                    </div>
                    <div className="text-base font-bold text-white">
                      {formatUZS(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive AI Scenario Simulator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Interaktiv Tejash Simulyatori</h3>
                <p className="text-xs text-slate-400">
                  Xarajatlarni kamaytirish kelgusi oylardagi mablag'ingizga qanday ta'sir qilishini ko‘ring
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Xarajatlarni qisqartirish darajasi:</span>
                <span className="text-emerald-400 font-bold">{savingScenarioPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={savingScenarioPercent}
                onChange={(e) => setSavingScenarioPercent(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0% (O'zgarishsiz)</span>
                <span>10% (Optimal)</span>
                <span>20% (Yuqori)</span>
                <span>30% (Maksimal)</span>
              </div>
            </div>

            {savingScenarioPercent > 0 && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <span className="text-xs text-slate-300 block">Oyiga qo‘shimcha tejaladigan summa:</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    +{formatUZS(scenarioMonthlySavings)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-300 block">Yillik jamg'arma samaradorligi:</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    +{formatUZS(scenarioMonthlySavings * 12)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Risk Factors & AI Scenario Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk factors */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Ehtimoliy Xavf Omili</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {forecast.riskFactors?.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Advice */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>AI Strategik Maslahati</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {forecast.scenarioAdvice}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
