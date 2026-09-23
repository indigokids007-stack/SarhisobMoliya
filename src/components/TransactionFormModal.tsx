import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowDownRight, ArrowUpRight, Loader2, MessageSquareText } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { parseTransactionWithAI } from '../services/api';
import { formatUZS } from '../utils/formatters';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [activeMode, setActiveMode] = useState<'ai' | 'manual'>('ai');
  const [aiText, setAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
  } | null>(null);

  // Manual form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Oziq-ovqat');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Humo/Uzcard' | 'Visa/Mastercard' | 'Naqd pul' | 'Bank hisob'>('Humo/Uzcard');

  if (!isOpen) return null;

  const quickSamples = [
    "Bozorlik 420 ming go'sht va sabzavot",
    "Tushlikka 45 000 so'm berdim",
    "Yandex Go taksi 28 ming",
    "Oylik maosh tushdi 8 500 000 so'm",
    "Kommunal to'lov 350 ming so'm",
    "Karta orqali to'lov: Korzinka 185,000 UZS",
  ];

  const handleAiParse = async (textToParse?: string) => {
    const text = textToParse || aiText;
    if (!text.trim()) {
      setAiError('Iltimos, xarajat yoki daromad haqida matn yozing');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await parseTransactionWithAI(text);
      setParsedPreview(result);
    } catch (err: any) {
      setAiError(err.message || 'AI orqali tahlil qilishda xatolik yuz berdi');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleConfirmAiParsed = () => {
    if (!parsedPreview) return;
    onAddTransaction({
      type: parsedPreview.type,
      amount: parsedPreview.amount,
      category: parsedPreview.category,
      description: parsedPreview.description || aiText,
      date: parsedPreview.date || new Date().toISOString().split('T')[0],
      paymentMethod: 'Humo/Uzcard',
    });
    resetAndClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[\s,]/g, ''));
    if (!numAmount || numAmount <= 0) {
      alert('Iltimos, to‘g‘ri miqdor kiriting');
      return;
    }
    if (!description.trim()) {
      alert('Iltimos, izoh kiriting');
      return;
    }

    onAddTransaction({
      type,
      amount: numAmount,
      category,
      description: description.trim(),
      date,
      paymentMethod,
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setAiText('');
    setParsedPreview(null);
    setAiError(null);
    setAmount('');
    setDescription('');
    onClose();
  };

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Yangi amaliyot qo‘shish</h3>
            <p className="text-xs text-slate-400">Kirim yoki chiqimni tizimga kiriting</p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 p-2 gap-2 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveMode('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              activeMode === 'ai'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Tezkor kiritish (Matn / SMS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              activeMode === 'manual'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>Klassik forma</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeMode === 'ai' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" />
                  Xarajat yoki daromadni erkin yozing yoki bank SMS matnini qo‘ying:
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Masalan: Bozorlik 450 ming go'sht va kartoshka yoki Oylik maosh tushdi 8 000 000 so'm..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Quick sample chips */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                  Tezkor namunalar (bosing va sinab ko‘ring):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSamples.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiText(sample);
                        handleAiParse(sample);
                      }}
                      className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition-colors border border-slate-700/60"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300">
                  {aiError}
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleAiParse()}
                disabled={isAiLoading || !aiText.trim()}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI tahlil qilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AI orqali tahlil qilish</span>
                  </>
                )}
              </button>

              {/* Parsed Preview Card */}
              {parsedPreview && (
                <div className="mt-4 p-4 bg-slate-800/70 border border-emerald-500/40 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      AI aniqlagan ma'lumotlar:
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${parsedPreview.type === 'income' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                      {parsedPreview.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Miqdor:</span>
                      <span className="font-bold text-sm text-white">{formatUZS(parsedPreview.amount)}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Toifa:</span>
                      <span className="font-semibold text-slate-200">{parsedPreview.category}</span>
                    </div>
                    <div className="col-span-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Izoh:</span>
                      <span className="text-slate-200">{parsedPreview.description}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAiParsed}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Tasdiqlash va Saqlash</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Classic Manual Form */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setCategory('Oziq-ovqat');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                    type === 'expense'
                      ? 'bg-rose-950/50 border-rose-600/70 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  <span>Chiqim (Xarajat)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategory('Maosh');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                    type === 'income'
                      ? 'bg-emerald-950/50 border-emerald-600/70 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>Kirim (Daromad)</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Miqdor (so‘mda):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Masalan: 350000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Toifa:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {currentCategories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Izoh / Qayerga sarflandi:
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masalan: Chorsu bozoridan go'sht va non"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Date & Payment method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sana:
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    To‘lov usuli:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Humo/Uzcard">Humo / Uzcard</option>
                    <option value="Visa/Mastercard">Visa / Mastercard</option>
                    <option value="Naqd pul">Naqd pul</option>
                    <option value="Bank hisob">Bank hisob raqami</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-950/40"
              >
                Saqlash
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
