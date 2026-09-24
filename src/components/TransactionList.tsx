import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  PlusCircle,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatUZS, formatDateUz } from '../utils/formatters';
import { exportTransactionsToCSV, getTransactionTimeString } from '../utils/csvExport';
import { 
  getDailyDeletionState, 
  recordDeletion, 
  DeletionLimitState, 
  MAX_DAILY_DELETIONS 
} from '../utils/deletionLimit';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Deletion limit state
  const [deletionState, setDeletionState] = useState<DeletionLimitState>(getDailyDeletionState);
  const [targetTxToDelete, setTargetTxToDelete] = useState<Transaction | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>("Adashib noto'g'ri kiritilgan");
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync deletion limit on mount or date change
  useEffect(() => {
    setDeletionState(getDailyDeletionState());
  }, []);

  // Extract unique categories
  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (selectedType !== 'all' && tx.type !== selectedType) return false;
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchAmt = tx.amount.toString().includes(q);
      if (!matchDesc && !matchCat && !matchAmt) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const filteredExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Export CSV Handler
  const handleExportCSV = () => {
    const listToExport = filtered.length > 0 ? filtered : transactions;
    if (listToExport.length === 0) {
      setActionAlert({
        message: "Eksport qilish uchun amaliyotlar mavjud emas",
        type: 'info',
      });
      return;
    }

    const result = exportTransactionsToCSV(listToExport, 'sarhisob_amaliyotlar');
    if (result.success) {
      setActionAlert({
        message: `${result.count} ta amaliyot CSV formatida yuklab olindi (${result.filename})`,
        type: 'success',
      });
    }
  };

  // Open deletion modal
  const handleInitiateDelete = (tx: Transaction) => {
    const currentState = getDailyDeletionState();
    setDeletionState(currentState);
    setTargetTxToDelete(tx);
    setDeleteReason("Adashib noto'g'ri kiritilgan");
  };

  // Confirm delete with 3/day limit check
  const handleConfirmDelete = () => {
    if (!targetTxToDelete) return;

    const result = recordDeletion(
      {
        id: targetTxToDelete.id,
        description: targetTxToDelete.description,
        amount: targetTxToDelete.amount,
        type: targetTxToDelete.type,
      },
      deleteReason
    );

    if (!result.success) {
      setActionAlert({
        message: result.error || "O'chirish limitiga yetildi!",
        type: 'error',
      });
      setTargetTxToDelete(null);
      return;
    }

    // Perform deletion
    onDeleteTransaction(targetTxToDelete.id);
    const updatedState = getDailyDeletionState();
    setDeletionState(updatedState);

    setActionAlert({
      message: `"${targetTxToDelete.description}" amaliyoti o'chirildi. Bugungi qolgan o'chirish limiti: ${result.remaining} ta`,
      type: 'success',
    });

    setTargetTxToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert toast notification */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all shadow-lg animate-in fade-in ${
            actionAlert.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : actionAlert.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              : 'bg-sky-950/80 border-sky-500/40 text-sky-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionAlert.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
            {actionAlert.type === 'error' && <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />}
            {actionAlert.type === 'info' && <Info className="w-5 h-5 shrink-0 text-sky-400" />}
            <span className="text-xs sm:text-sm font-medium">{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top action & filter bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white">Kirim va Chiqimlar Daftari</h2>
              {/* Daily deletion quota chip */}
              <div 
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  deletionState.remaining > 1
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : deletionState.remaining === 1
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                }`}
                title="Xavfsizlik maqsadida 1 kunda ko'pi bilan 3 ta adashib kiritilgan amaliyot o'chirilishi mumkin"
              >
                <span>O'chirish limiti:</span>
                <strong>{deletionState.remaining}/{MAX_DAILY_DELETIONS} ta</strong>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Barcha moliyaviy oqimlar tarixi, vaqti, toifalari va CSV eksporti
            </p>
          </div>

          {/* Action buttons: Export CSV + Add Transaction */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700 rounded-xl transition-all shadow-sm active:scale-95"
              title="Ro'yxatni CSV formatida yuklab olish"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Eksport (CSV)</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm shadow-emerald-950/40 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Yangi amaliyot</span>
            </button>
          </div>
        </div>

        {/* Search & Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidiruv (nomi, toifa, miqdor)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'expense'
                  ? 'bg-rose-950/70 text-rose-300 border border-rose-900/50'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Chiqimlar
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'income'
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-900/50'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Kirimlar
            </button>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Barcha toifalar</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div>
            Topildi: <strong className="text-white">{filtered.length}</strong> ta amaliyot
          </div>
          <div className="flex items-center gap-4">
            <span>
              Kirim: <strong className="text-emerald-400 font-semibold">{formatUZS(filteredIncome)}</strong>
            </span>
            <span>
              Chiqim: <strong className="text-rose-400 font-semibold">{formatUZS(filteredExpense)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">Mos keluvchi amaliyotlar topilmadi</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedCategory('all');
              }}
              className="mt-2 text-xs text-emerald-400 hover:underline"
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((tx) => {
              const txTime = getTransactionTimeString(tx);
              return (
                <div
                  key={tx.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl text-white shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-400'
                          : 'bg-slate-800 border border-slate-700/60 text-slate-300'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{tx.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="text-slate-300 font-medium">{tx.category}</span>
                        <span>·</span>
                        {/* Date (Kuni) */}
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDateUz(tx.date)}</span>
                        </span>
                        <span>·</span>
                        {/* Time (Vaqti) */}
                        <span className="flex items-center gap-1 font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{txTime}</span>
                        </span>
                        {tx.paymentMethod && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">{tx.paymentMethod}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span
                        className={`text-base font-bold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatUZS(tx.amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleInitiateDelete(tx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Adashib yozilgan amaliyotni o'chirish (Kunlik limit: 3 ta)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Daily Limit 3 enforcement) */}
      {targetTxToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setTargetTxToDelete(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Amaliyotni o'chirish</h3>
                <p className="text-xs text-slate-400">Adashib noto'g'ri yozilgan yozuvni bekor qilish</p>
              </div>
            </div>

            {/* Target Transaction Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amaliyot:</span>
                <span className="font-semibold text-white">{targetTxToDelete.description}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Miqdor:</span>
                <span className={`font-bold ${targetTxToDelete.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {targetTxToDelete.type === 'income' ? '+' : '-'}{formatUZS(targetTxToDelete.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Kuni va Vaqti:</span>
                <span className="font-mono text-slate-300">
                  {targetTxToDelete.date} ({getTransactionTimeString(targetTxToDelete)})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Toifasi:</span>
                <span className="text-slate-300">{targetTxToDelete.category}</span>
              </div>
            </div>

            {/* Daily limit rule warning */}
            {deletionState.remaining > 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Kunlik limit: 1 kunda 3 tadan oshmasligi kerak</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Ushbu amaliyot o'chirilsa, bugungi kvotangizdan 1 ta sarflanadi. 
                  Bugun yana <strong className="text-white">{deletionState.remaining - 1} ta</strong> amaliyot o'chirish imkoniyatingiz qoladi.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs space-y-1.5 text-rose-300">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Kunlik limit (3 ta) tugagan!</span>
                </div>
                <p className="leading-relaxed">
                  Buxgalteriya intizomi va xavfsizlik uchun bir kunda ko'pi bilan 3 ta yozuv o'chirilishi mumkin. Bugungi limit tugagan, ertaga yana o'chirishingiz mumkin.
                </p>
              </div>
            )}

            {/* Reason selector */}
            {deletionState.remaining > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  O'chirish sababi:
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Adashib noto'g'ri kiritilgan">Adashib noto'g'ri kiritilgan</option>
                  <option value="Noto'g'ri summa yozilgan">Noto'g'ri summa yozilgan</option>
                  <option value="Dublikat (ikki marta yozilgan) amaliyot">Dublikat (ikki marta yozilgan) amaliyot</option>
                  <option value="Noto'g'ri toifa yoki sana">Noto'g'ri toifa yoki sana</option>
                  <option value="Boshqa sabab">Boshqa sabab</option>
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTargetTxToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletionState.remaining <= 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-rose-950 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O'chirishni tasdiqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
