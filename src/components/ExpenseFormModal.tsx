import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Calendar, 
  Clock, 
  Tag, 
  FileText, 
  DollarSign, 
  CreditCard, 
  User, 
  MessageSquare, 
  Upload, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { 
  Expense, 
  Category, 
  PaymentMethod, 
  AppUser, 
  ThreeMonthPeriodSettings 
} from '../types';
import { getExpenseMonth } from '../data/defaults';
import { formatUZS } from '../utils/formatters';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expenseData: Partial<Expense>) => Promise<void>;
  categories: Category[];
  currentUser: AppUser | null;
  settings: ThreeMonthPeriodSettings;
  isPeriodEnded: boolean;
  initialExpense?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  currentUser,
  settings,
  isPeriodEnded,
  initialExpense,
}) => {
  const isEditing = Boolean(initialExpense);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => 
    new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [comment, setComment] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialExpense) {
      setDate(initialExpense.date);
      setTime(initialExpense.time || '12:00');
      setCategory(initialExpense.category);
      setDescription(initialExpense.description);
      setAmountStr(initialExpense.amount.toString());
      setPaymentMethod(initialExpense.paymentMethod || 'Cash');
      setResponsiblePerson(initialExpense.responsiblePerson || '');
      setComment(initialExpense.comment || '');
      setReceiptUrl(initialExpense.receiptUrl || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDescription('');
      setAmountStr('');
      setComment('');
      setReceiptUrl('');
      setResponsiblePerson(currentUser?.name || 'Staff');
      if (categories.length > 0) {
        setCategory(categories[0].name);
      }
    }
    setErrorMsg(null);
  }, [initialExpense, isOpen, currentUser, categories]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountStr.replace(/[\s,]/g, '')) || 0;
  const computedMonth = getExpenseMonth(date, settings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isEditing && isPeriodEnded) {
      setErrorMsg('Accounting period ended. New expenses are locked unless Administrator extends the period.');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please enter an expense description.');
      return;
    }

    if (!category) {
      setErrorMsg('Please select an expense category.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        date,
        time,
        month: computedMonth,
        category,
        description: description.trim(),
        amount: numericAmount,
        currency: 'UZS',
        paymentMethod,
        responsiblePerson: responsiblePerson.trim() || currentUser?.name || 'Staff',
        comment: comment.trim(),
        receiptUrl: receiptUrl.trim(),
        createdBy: currentUser?.email || 'operator',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isEditing ? 'Edit Expense Record' : 'Record New Expense'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Modify existing record (logged in Audit)' : 'Synchronized to Google Sheets and Telegram'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Lock Warning */}
        {!isEditing && isPeriodEnded && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Accounting period ended on {settings.endDate}. New entries are locked.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Expense Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Amount (Big Hero Input) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Amount (UZS) *</span>
              {numericAmount > 0 && (
                <span className="text-emerald-400 font-mono text-sm">{formatUZS(numericAmount)}</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                required
                disabled={!isEditing && isPeriodEnded}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="150000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <span className="absolute right-4 top-3.5 text-xs font-mono font-semibold text-slate-400">
                UZS
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Description / Item Name *
            </label>
            <input
              type="text"
              required
              disabled={!isEditing && isPeriodEnded}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Office supplies, Team lunch, Server hosting"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category *</label>
              <select
                value={category}
                disabled={!isEditing && isPeriodEnded}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {categories.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Payment Method *</label>
              <select
                value={paymentMethod}
                disabled={!isEditing && isPeriodEnded}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="Cash">Cash (Naqd pul)</option>
                <option value="Bank card">Bank card (Karta)</option>
                <option value="Bank transfer">Bank transfer (O'tkazma)</option>
                <option value="Other">Other (Boshqa)</option>
              </select>
            </div>
          </div>

          {/* Date, Time & Computed Month */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Date *</label>
              <input
                type="date"
                required
                disabled={!isEditing && isPeriodEnded}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Time</label>
              <input
                type="time"
                disabled={!isEditing && isPeriodEnded}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Assigned Month</label>
              <div className="w-full bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-400 font-mono">
                {computedMonth}
              </div>
            </div>
          </div>

          {/* Responsible Person & Comment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Responsible Person</label>
              <input
                type="text"
                disabled={!isEditing && isPeriodEnded}
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="e.g. Akbar Shodiyev"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Comment / Invoice #</label>
              <input
                type="text"
                disabled={!isEditing && isPeriodEnded}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Receipt #419, Urgent"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Optional Receipt Image/URL */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Optional Receipt / Attachment URL</label>
            <input
              type="url"
              disabled={!isEditing && isPeriodEnded}
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://drive.google.com/... or image link"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isEditing && isPeriodEnded)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
