import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  Coins
} from 'lucide-react';
import { Transaction, RecurringBill, SavingsGoal, AIAnalysisResult } from '../types';
import { analyzeFinancesWithAI } from '../services/api';
import { formatUZS, formatShortUZS } from '../utils/formatters';

interface AIFinancialAdvisorProps {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  goals: SavingsGoal[];
  balance: number;
}

export const AIFinancialAdvisor: React.FC<AIFinancialAdvisorProps> = ({
  transactions,
  recurringBills,
  goals,
  balance,
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeFinancesWithAI({
        transactions,
        recurringBills,
        goals,
        currentBalance: balance,
      });
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Tahlilni olishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [transactions.length, balance]);

  const totalPotentialSavings = analysis?.savingRecommendations?.reduce(
    (sum, item) => sum + item.potentialMonthlySavings,
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>AI Moliyaviy Maslahatchi & Tejash Tahlili</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
              Gemini 3.8
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kirim va chiqimlarni tahlil qilish orqali pul sizib ketayotgan joylarni aniqlash va tejash yo‘llari
          </p>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Tahlil qilinmoqda...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Qayta tahlil qilish</span>
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

      {isLoading && !analysis ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Sun'iy intellekt xarajatlaringizni o'rganmoqda...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Har bir tranzaksiya, toifa va oylik odatlaringiz tekshirilmoqda. Bir necha soniya kuting...
          </p>
        </div>
      ) : analysis ? (
        <>
          {/* Health Score & Savings Potential row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Health Score Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Moliyaviy Salomatlik Indeksi
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-extrabold text-emerald-400">
                    {analysis.healthScore}
                  </span>
                  <span className="text-slate-400 text-sm font-medium">/ 100 ball</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${analysis.healthScore}%` }}
                  />
                </div>
                <span>
                  {analysis.healthScore >= 80
                    ? "Holat a'lo darajada! Jamg'arma rejangiz mustahkam."
                    : analysis.healthScore >= 60
                    ? "Barqaror holat, biroq optimallashtirish imkoniyatlari mavjud."
                    : "Xarajatlar nazoratini kuchaytirish tavsiya etiladi."}
                </span>
              </div>
            </div>

            {/* Total Potential Savings Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Oylik Tejash Salohiyati
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-amber-400">
                    +{formatShortUZS(totalPotentialSavings)}
                  </span>
                  <span className="text-slate-400 text-xs">/ oyiga</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
                <span className="text-emerald-400 font-semibold block mb-0.5">
                  Yillik: +{formatShortUZS(totalPotentialSavings * 12)}
                </span>
                Tavsiya etilgan barcha choralarni qo‘llash orqali erishish mumkin.
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  AI Tahlil Xulosasi
                </span>
                <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {analysis.urgentAlerts && analysis.urgentAlerts.length > 0 && (
                <div className="mt-3 p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-[11px] text-rose-300">
                  {analysis.urgentAlerts[0]}
                </div>
              )}
            </div>
          </div>

          {/* 50/30/20 Rule Analysis Widget */}
          {analysis.budgetRule503020 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">50/30/20 Qoidasi Tahlili</h3>
                  <p className="text-xs text-slate-400">
                    Klassik me'yor: 50% Ehtiyojlar · 30% Xohishlar · 20% Jamg'arma
                  </p>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-900/60 font-semibold">
                  Sizning nisbatingiz: {analysis.budgetRule503020.needsPercent} / {analysis.budgetRule503020.wantsPercent} / {analysis.budgetRule503020.savingsPercent}
                </span>
              </div>

              {/* Multi-segment progress bar */}
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex mb-3">
                <div
                  style={{ width: `${analysis.budgetRule503020.needsPercent}%` }}
                  className="bg-blue-500 h-full transition-all duration-500"
                  title={`Ehtiyojlar: ${analysis.budgetRule503020.needsPercent}%`}
                />
                <div
                  style={{ width: `${analysis.budgetRule503020.wantsPercent}%` }}
                  className="bg-orange-500 h-full transition-all duration-500"
                  title={`Xohishlar: ${analysis.budgetRule503020.wantsPercent}%`}
                />
                <div
                  style={{ width: `${analysis.budgetRule503020.savingsPercent}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Jamg'arma: ${analysis.budgetRule503020.savingsPercent}%`}
                />
              </div>

              {/* Legend & comment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-300">
                    Ehtiyojlar: <strong className="text-white">{analysis.budgetRule503020.needsPercent}%</strong> (me'yor: 50%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-slate-300">
                    Xohishlar: <strong className="text-white">{analysis.budgetRule503020.wantsPercent}%</strong> (me'yor: 30%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-300">
                    Jamg'arma: <strong className="text-white">{analysis.budgetRule503020.savingsPercent}%</strong> (me'yor: 20%)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                💡 <strong className="text-slate-100">AI Xulosasi:</strong> {analysis.budgetRule503020.analysis}
              </div>
            </div>
          )}

          {/* Section: Pul Sizib Ketayotgan Nuqtalar (Money Leaks) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Pul Sizib Ketayotgan Nuqtalar (Ortiqcha Xarajatlar)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.moneyLeaks?.map((leak, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-rose-900/60 rounded-2xl p-5 space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{leak.title}</h4>
                      <span className="text-[11px] text-slate-400">{leak.category} toifasida</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        leak.impact === 'Yuqori'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800'
                      }`}
                    >
                      {leak.impact} yo'qotish
                    </span>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400">Oylik behuda ketayotgan mablag': </span>
                    <strong className="text-rose-400 font-bold">{formatUZS(leak.estimatedMonthlyLoss)}</strong>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                    <span className="text-emerald-400 font-semibold block mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Qanday to‘xtatish mumkin:
                    </span>
                    {leak.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Tejash Bo'yicha Tavsiyalar (Saving Recommendations) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Sun'iy Intellektdan Amaliy Tejash Tavsiyalari</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.savingRecommendations?.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-800/60 rounded-2xl p-5 flex flex-col justify-between transition-colors space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Tavsiya #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          rec.difficulty === 'Oson'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {rec.difficulty}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Kutilayotgan oylik tejov:</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      +{formatUZS(rec.potentialMonthlySavings)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
