import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Transaction, RecurringBill, SavingsGoal } from '../types';
import { 
  createAndPopulateSpreadsheet, 
  syncToExistingSheet, 
  GoogleSheetMetadata 
} from '../services/googleSheets';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  Sparkles,
  Lock,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { formatUZS } from '../utils/formatters';

interface GoogleSheetsSyncProps {
  currentUser: User | null;
  accessToken: string | null;
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  goals: SavingsGoal[];
  balance: number;
  onOpenLogin: () => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  currentUser,
  accessToken,
  transactions,
  recurringBills,
  goals,
  balance,
  onOpenLogin,
}) => {
  const [sheetMeta, setSheetMeta] = useState<GoogleSheetMetadata | null>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_google_sheet');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'sync' | null>(null);

  const requestActionWithConfirmation = (action: 'create' | 'sync') => {
    if (!currentUser || !accessToken) {
      onOpenLogin();
      return;
    }
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const handleExecuteConfirmedAction = async () => {
    if (!accessToken) return;
    setShowConfirmModal(false);
    setIsLoading(true);
    setStatusMessage({ text: 'Google Sheets bilan bog\'lanilmoqda...', type: 'info' });

    try {
      if (pendingAction === 'create' || !sheetMeta) {
        const title = `Sarhisob AI - Moliya Hisoboti (${new Date().toLocaleDateString('uz-UZ')})`;
        const meta = await createAndPopulateSpreadsheet(
          accessToken,
          title,
          transactions,
          recurringBills,
          goals,
          balance
        );
        setSheetMeta(meta);
        localStorage.setItem('sarhisob_google_sheet', JSON.stringify(meta));
        setStatusMessage({
          text: `Yangi Google Jadval muvaffaqiyatli yaratildi va ${transactions.length} ta yozuv yozildi!`,
          type: 'success',
        });
      } else if (pendingAction === 'sync' && sheetMeta) {
        const success = await syncToExistingSheet(
          accessToken,
          sheetMeta.spreadsheetId,
          transactions,
          recurringBills,
          goals,
          balance
        );
        if (success) {
          const updated = {
            ...sheetMeta,
            lastSyncedAt: new Date().toISOString(),
            rowsCount: transactions.length,
          };
          setSheetMeta(updated);
          localStorage.setItem('sarhisob_google_sheet', JSON.stringify(updated));
          setStatusMessage({
            text: `Jadval ma'lumotlari yangilandi (${transactions.length} ta tranzaksiya)!`,
            type: 'success',
          });
        } else {
          throw new Error('Sinxronizatsiyada xatolik yuz berdi');
        }
      }
    } catch (err: any) {
      console.error('Google Sheets Sync Error:', err);
      setStatusMessage({
        text: err?.message || 'Google Sheets bilan ishlashda xatolik yuz berdi. Iltimos, qayta tizimga kiring.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets Integratsiyasi</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100">
              Shaxsiy Google Jadvalingizga Avtomatik Sinxronizatsiya
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Barcha kirim-chiqimlar, oylik hisobotlar va tahlillarni real vaqt rejimida shaxsiy Google Drive hisobingizdagi jadvalga eksport qiling yoki bog'lang.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {!currentUser ? (
              <button
                onClick={onOpenLogin}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-950"
              >
                <Lock className="w-4 h-4" />
                <span>Google bilan ulanish</span>
              </button>
            ) : sheetMeta ? (
              <>
                <button
                  onClick={() => requestActionWithConfirmation('sync')}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Yangilanmoqda...' : 'Hozir yangilash'}</span>
                </button>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetMeta.spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Jadvalni ochish</span>
                </a>
              </>
            ) : (
              <button
                onClick={() => requestActionWithConfirmation('create')}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-950 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Yaratilmoqda...' : 'Google Sheets yaratish'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Auth State */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Google Hisob
            </span>
            {currentUser ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ulangan</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                Ulanmagan
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 truncate">
              {currentUser ? currentUser.displayName || currentUser.email : 'Mehmon foydalanuvchi'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {currentUser ? currentUser.email : 'Google orqali kiring'}
            </p>
          </div>
          {!currentUser ? (
            <button
              onClick={onOpenLogin}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center space-x-1 pt-1"
            >
              <span>Hisobga kirish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 pt-1">
              Token xotirada faol holatda saqlanmoqda
            </div>
          )}
        </div>

        {/* Card 2: Sheet Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ulangan Jadval
            </span>
            {sheetMeta ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                Aktiv
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                Mavjud emas
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 truncate">
              {sheetMeta ? sheetMeta.title : 'Jadval tanlanmagan'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {sheetMeta?.lastSyncedAt
                ? `Oxirgi sinxronlash: ${new Date(sheetMeta.lastSyncedAt).toLocaleTimeString('uz-UZ')}`
                : 'Hali sinxronlanmagan'}
            </p>
          </div>
          {sheetMeta && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetMeta.spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center space-x-1 pt-1"
            >
              <span>Jadvalni ko'rish</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Card 3: Export Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ma'lumotlar hajmi
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold">
              Tayyor
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">
              {transactions.length} ta tranzaksiya
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Jami balans: {formatUZS(balance)}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            2 ta sahifa: Tranzaksiyalar va Umumiy Xulosa
          </div>
        </div>
      </div>

      {/* Synchronized Data Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Google Sheets uchun tayyorlangan jadval namunalari
              </h3>
              <p className="text-xs text-slate-500">Ushbu ustunlar to'g'ridan-to'g'ri jadvalingizga yoziladi</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {transactions.slice(0, 5).length} / {transactions.length} ko'rsatilmoqda
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Turi</th>
                <th className="px-4 py-3">Toifa</th>
                <th className="px-4 py-3">Miqdor</th>
                <th className="px-4 py-3">Izoh</th>
                <th className="px-4 py-3 text-right">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">{t.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {t.type === 'income' ? 'Kirim' : 'Chiqim'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200">{t.category}</td>
                  <td className="px-4 py-3 font-semibold text-slate-100">
                    {formatUZS(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-xs">{t.description || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center space-x-1 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sinxronlashga tayyor</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory User Confirmation Modal for Destructive/Mutating Operations */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-semibold text-slate-100">
                Google Sheets operatsiyasini tasdiqlash
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {pendingAction === 'create'
                ? `Google Drive hisobingizda yangi "Sarhisob AI Moliya Hisoboti" nomli jadval yaratiladi va ${transactions.length} ta yozuv yoziladi. Davom etasizmi?`
                : `Mavjud Google Jadvalingizdagi "Tranzaksiyalar" sahifasi joriy ${transactions.length} ta yozuv bilan qayta yangilanadi. Davom etasizmi?`}
            </p>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Tranzaksiyalar soni:</span>
                <span className="font-semibold text-slate-200">{transactions.length} ta</span>
              </div>
              <div className="flex justify-between">
                <span>Joriy balans:</span>
                <span className="font-semibold text-emerald-400">{formatUZS(balance)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-md"
              >
                Tasdiqlash va Yozish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
