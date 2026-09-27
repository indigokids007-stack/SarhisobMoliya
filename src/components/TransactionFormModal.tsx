import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  Sparkles, 
  Check, 
  ArrowDownRight, 
  ArrowUpRight, 
  Loader2, 
  MessageSquareText,
  Package,
  Layers,
  Clock,
  Calendar,
  DollarSign,
  User as UserIcon,
  Tag
} from 'lucide-react';
import { Transaction, TransactionType, ADMIN_EMAIL } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { parseTransactionWithAI } from '../services/api';
import { formatUZS } from '../utils/formatters';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  currentUser: User | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  currentUser,
}) => {
  const [activeMode, setActiveMode] = useState<'manual' | 'ai'>('manual');
  const [aiText, setAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
    itemName?: string;
    quantity?: string;
  } | null>(null);

  // Manual form state: Tovar nomi, miqdori, summasi, vaqti
  const [type, setType] = useState<TransactionType>('expense');
  const [itemName, setItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1 dona');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Oziq-ovqat');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [paymentMethod, setPaymentMethod] = useState<'Humo/Uzcard' | 'Visa/Mastercard' | 'Naqd pul' | 'Bank hisob'>('Humo/Uzcard');

  if (!isOpen) return null;

  const quickSamples = [
    "Mol go'shti 5 kg 450 ming",
    "Un 1-nav 50 kg 380 000 so'm",
    "Dizel yoqilg'isi 40 litr 480 ming",
    "Tushlik kafeda 45 000 so'm",
    "Oylik maosh tushdi 8 500 000 so'm",
    "A4 qog'oz 10 pachka 350 ming",
  ];

  const handleAiParse = async (textToParse?: string) => {
    const text = textToParse || aiText;
    if (!text.trim()) {
      setAiError('Iltimos, tovar nomi, miqdori va summasi haqida yozing');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await parseTransactionWithAI(text);
      // Auto-extract item name & quantity from text if available
      const parts = text.split(' ');
      const candidateItem = parts.slice(0, 2).join(' ');
      setParsedPreview({
        ...result,
        itemName: candidateItem || result.description,
        quantity: '1 dona',
      });
    } catch (err: any) {
      setAiError(err.message || 'AI orqali tahlil qilishda xatolik yuz berdi');
    } finally {
      setIsAiLoading(false);
    }
  };

  const getUserCreator = () => {
    if (currentUser) {
      const isAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      return {
        uid: currentUser.uid,
        email: currentUser.email || 'user@sarhisob.uz',
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Foydalanuvchi',
        photoURL: currentUser.photoURL || undefined,
        role: (isAdmin ? 'admin' : 'user') as 'admin' | 'user',
      };
    }
    return {
      email: 'mehmon@sarhisob.uz',
      name: 'Mehmon foydalanuvchi',
      role: 'user' as const,
    };
  };

  const handleConfirmAiParsed = () => {
    if (!parsedPreview) return;
    const nowTime = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
    onAddTransaction({
      type: parsedPreview.type,
      itemName: parsedPreview.itemName || parsedPreview.description,
      quantity: parsedPreview.quantity || '1 dona',
      amount: parsedPreview.amount,
      category: parsedPreview.category,
      description: parsedPreview.description || aiText,
      date: parsedPreview.date || new Date().toISOString().split('T')[0],
      time: nowTime,
      paymentMethod: 'Humo/Uzcard',
      createdBy: getUserCreator(),
    });
    resetAndClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[\s,]/g, ''));
    if (!numAmount || numAmount <= 0) {
      alert('Iltimos, to‘g‘ri summa kiriting');
      return;
    }
    if (!itemName.trim()) {
      alert('Iltimos, tovar nomini kiriting');
      return;
    }

    onAddTransaction({
      type,
      itemName: itemName.trim(),
      quantity: quantity.trim() || '1 dona',
      amount: numAmount,
      category,
      description: description.trim() || itemName.trim(),
      date,
      time: time || '12:00',
      paymentMethod,
      createdBy: getUserCreator(),
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setAiText('');
    setParsedPreview(null);
    setAiError(null);
    setItemName('');
    setQuantity('1 dona');
    setAmount('');
    setDescription('');
    onClose();
  };

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const activeUser = getUserCreator();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <span>Yangi Tovar / Amaliyot Qo‘shish</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tovar nomi, miqdori, summasi, vaqti va kirituvchi qayd etiladi
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User tag banner */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-850 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Kim kiritmoqda:</span>
            <strong className="text-white flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeUser.name}</span>
            </strong>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
            {activeUser.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeMode === 'manual'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Qo‘lda kiritish (Tovar, Miqdor, Summa, Vaqt)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('ai')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeMode === 'ai'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Tezkor (Matndan)</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeMode === 'ai' ? (
            /* AI Natural Language Mode */
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Xarid yoki tushumni erkin tilda yozing (masalan: <em>"Mol go'shti 5 kg 450 ming berdim"</em>). Sun'iy intellekt tovar nomi, miqdori va summasini ajratadi.
              </p>

              <div>
                <textarea
                  rows={3}
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Masalan: Go'sht 10 kg 900 ming so'm yoki Un 2 qop 450 ming..."
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiText(sample);
                      handleAiParse(sample);
                    }}
                    className="text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {aiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                  {aiError}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleAiParse()}
                disabled={isAiLoading || !aiText.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-950"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI tahlil qilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Matndan tovar ma'lumotlarini ajratish</span>
                  </>
                )}
              </button>

              {parsedPreview && (
                <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-emerald-400 block">
                    ✓ Natija aniqlandi:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tovar nomi:</span>
                      <strong className="text-white">{parsedPreview.itemName || parsedPreview.description}</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Miqdori:</span>
                      <strong className="text-emerald-400">{parsedPreview.quantity || '1 dona'}</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Summasi:</span>
                      <strong className="text-white">{formatUZS(parsedPreview.amount)}</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Toifasi:</span>
                      <strong className="text-slate-300">{parsedPreview.category}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAiParsed}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>Tasdiqlash va Saqlash</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Classic Manual Form: Tovar nomi, Miqdori, Summasi, Vaqti */
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
                  <span>Chiqim (Tovar xaridi / Xarajat)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategory('Biznes va Savdo');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                    type === 'income'
                      ? 'bg-emerald-950/50 border-emerald-600/70 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>Kirim (Sotuv / Daromad)</span>
                </button>
              </div>

              {/* Tovar nomi & Miqdori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tovar nomi: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Masalan: Mol go'shti, Un 1-nav, Dizel..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Miqdori: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Masalan: 10 kg, 5 dona, 20 litr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Summasi & Toifasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Summasi (so‘mda): <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Masalan: 450000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Toifasi:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {currentCategories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date, Time & Payment method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sana (Kuni):
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
                    Vaqti:
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
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

              {/* Qo'shimcha Izoh */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Qo‘shimcha izoh (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masalan: 1-ombor uchun qabul qilindi, chek №402"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Tovarni saqlash va hisobotga kiritish</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
