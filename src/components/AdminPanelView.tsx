import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Users, 
  Package, 
  FileSpreadsheet, 
  RefreshCw, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Layers,
  Clock,
  Calendar,
  DollarSign
} from 'lucide-react';
import { AppUser, Transaction, ADMIN_EMAIL } from '../types';
import { formatUZS, formatDateUz } from '../utils/formatters';
import { exportTransactionsToCSV, getTransactionTimeString } from '../utils/csvExport';

interface AdminPanelViewProps {
  currentUserEmail: string | null;
  users: AppUser[];
  transactions: Transaction[];
  balance: number;
  onDeleteTransaction: (id: string) => void;
  onOpenGoogleSheets: () => void;
  onOpenAuth: () => void;
  onLoginAsAdmin?: () => void;
  onLoginWithEmail?: (email: string, displayName?: string) => void;
  onGrantAdminAccess?: (email: string) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUserEmail,
  users,
  transactions,
  balance,
  onDeleteTransaction,
  onOpenGoogleSheets,
  onOpenAuth,
  onLoginAsAdmin,
  onLoginWithEmail,
  onGrantAdminAccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState(ADMIN_EMAIL);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const isAdmin = 
    currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    users.some(u => u.email.toLowerCase() === currentUserEmail?.toLowerCase() && u.role === 'admin');

  const handleInstantAdminLogin = () => {
    if (onLoginAsAdmin) {
      onLoginAsAdmin();
      setActionNotice("Bosh Admin (indigokids007@gmail.com) sifatida tizimga muvaffaqiyatli kirildi!");
      setTimeout(() => setActionNotice(null), 3500);
    } else if (onLoginWithEmail) {
      onLoginWithEmail(ADMIN_EMAIL, 'IndigoKids (Bosh Administrator)');
      setActionNotice("Bosh Admin sifatida kirildi!");
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    if (onLoginWithEmail) {
      onLoginWithEmail(inputEmail.trim());
      setActionNotice(`${inputEmail.trim()} sifatida tizimga kirildi!`);
      setTimeout(() => setActionNotice(null), 3500);
    } else if (inputEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && onLoginAsAdmin) {
      onLoginAsAdmin();
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPins = ['007', 'admin', 'indigokids', '7777', '2026'];
    if (validPins.includes(adminPin.trim().toLowerCase())) {
      setPinError(null);
      handleInstantAdminLogin();
    } else {
      setPinError("Noto'g'ri PIN-kod. (Maslahat: 007 yoki to'g'ridan-to'g'ri 1-bosishda kirish tugmasidan foydalaning)");
    }
  };

  const handleGrantSelfAdmin = () => {
    if (currentUserEmail && onGrantAdminAccess) {
      onGrantAdminAccess(currentUserEmail);
      setActionNotice(`${currentUserEmail} hisobiga Administrator ruxsati berildi!`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (selectedUserFilter !== 'all' && t.createdBy?.email !== selectedUserFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (t.itemName || t.description).toLowerCase().includes(q);
      const matchUser = (t.createdBy?.name || '').toLowerCase().includes(q);
      const matchEmail = (t.createdBy?.email || '').toLowerCase().includes(q);
      const matchCategory = t.category.toLowerCase().includes(q);
      return matchName || matchUser || matchEmail || matchCategory;
    }
    return true;
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const handleExportCSV = () => {
    const res = exportTransactionsToCSV(filteredTransactions, 'sarhisob_admin_tovarlar');
    if (res.success) {
      setActionNotice(`${res.count} ta amaliyot CSV faylga yuklab olindi.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // If NOT admin, show convenient, 100% accessible unlock screen
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-4">
        {/* Main Lock Card */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-950/40">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-2">
                Bosh Administrator Kirishi
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Admin Panelga Kirish
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
                Admin panelga kirish uchun belgilangan email:
              </p>
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-amber-500/30 font-mono text-amber-300 font-bold text-sm shadow-inner">
                <span>{ADMIN_EMAIL}</span>
              </div>
            </div>

            {/* Current State Info */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span>Hozirgi holat:</span>
              <span className="font-semibold text-slate-200">
                {currentUserEmail ? currentUserEmail : "Mehmon (Kirmagan)"}
              </span>
            </div>
          </div>

          {/* Action Boxes */}
          <div className="mt-8 space-y-5">
            {/* 1. PRIMARY: Instant 1-Click Admin Button */}
            <button
              onClick={handleInstantAdminLogin}
              className="w-full group relative flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-base rounded-2xl transition-all shadow-xl shadow-amber-950/50 hover:shadow-amber-500/20 active:scale-[0.99]"
            >
              <ShieldCheck className="w-6 h-6 shrink-0 text-slate-950" />
              <span>⚡ {ADMIN_EMAIL} (Bosh Admin) sifatida 1-bosishda kirish</span>
            </button>

            {/* If user is logged in as someone else, allow granting admin role */}
            {currentUserEmail && currentUserEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-indigo-300">
                  Siz <strong>{currentUserEmail}</strong> sifatida kirdingiz.
                </span>
                <button
                  onClick={handleGrantSelfAdmin}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shrink-0"
                >
                  Ushbu hisobga Admin huquqini berish
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                Yoki boshqa usullar
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* 2. Direct Email Login Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Email orqali to'g'ridan-to'g'ri kirish:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="indigokids007@gmail.com"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors shrink-0"
                >
                  Kirish
                </button>
              </div>
            </form>

            {/* 3. PIN / Parol Login */}
            <form onSubmit={handlePinSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Admin PIN-kod orqali ochish:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="PIN-kod (masalan: 007)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/40 transition-colors shrink-0"
                >
                  PIN bilan kirish
                </button>
              </div>
              {pinError && (
                <p className="text-[11px] text-rose-400 mt-1">{pinError}</p>
              )}
            </form>

            {/* 4. Google Account OAuth Option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Google hisobi orqali kirish oynasini ochish</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bosh Boshqaruv Markazi (SuperAdmin)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Admin Panel — Tovarlar, Users va Google Sheets Nazorati
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Xush kelibsiz, <strong className="text-amber-300">{ADMIN_EMAIL}</strong>! 
              Bu yerda barcha xodimlar kiritgan tovarlar, miqdorlar, summasi, vaqti va Google Sheets natijalari to'liq boshqariladi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>CSV Eksport</span>
            </button>
            <button
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-950"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheets ochish</span>
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Umumiy Saldo (Balans)
          </span>
          <div className={`text-xl font-bold font-mono ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatUZS(balance)}
          </div>
          <span className="text-[10px] text-slate-500">Kassa va hisobvaraqlardagi jami mablag‘</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Jami Kirim Summasi
          </span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatUZS(totalIncome)}
          </div>
          <span className="text-[10px] text-slate-500">Barcha xodimlar kiritgan tushumlar</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Jami Chiqim Summasi
          </span>
          <div className="text-xl font-bold font-mono text-rose-400">
            {formatUZS(totalExpense)}
          </div>
          <span className="text-[10px] text-slate-500">Sotib olingan tovarlar va xarajatlar</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Tovarlar & Users
          </span>
          <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>{transactions.length} ta</span>
            <span className="text-xs text-slate-400 font-normal">/ {users.length} xodim</span>
          </div>
          <span className="text-[10px] text-slate-500">Qayd etilgan tovar yozuvlari</span>
        </div>
      </div>

      {/* Main Admin Goods Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Barcha Kiritilgan Tovarlar va Amaliyotlar Jamlanmasi</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tovar nomi, miqdori, summasi, vaqti va kiritgan foydalanuvchi ma'lumotlari
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidiruv (tovar, user, toifa)..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Barcha xodimlar</option>
              {users.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Goods Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">Tovar nomi</th>
                <th className="px-4 py-3">Miqdori</th>
                <th className="px-4 py-3">Summasi</th>
                <th className="px-4 py-3">Vaqti</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Kim kiritdi</th>
                <th className="px-4 py-3">Toifa</th>
                <th className="px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx, idx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white block">
                      {tx.itemName || tx.description}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{tx.id}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                    {tx.quantity || '1 dona'}
                  </td>
                  <td className="px-4 py-3 font-bold font-mono">
                    <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                      {tx.type === 'income' ? '+' : '-'}{formatUZS(tx.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-amber-300">
                    {getTransactionTimeString(tx)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{tx.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-200">
                        {tx.createdBy?.name || 'Mehmon'}
                      </span>
                      {tx.createdBy?.email === ADMIN_EMAIL && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                      {tx.createdBy?.email || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`"${tx.itemName || tx.description}" yozuvini o‘chirishni tasdiqlaysizmi?`)) {
                          onDeleteTransaction(tx.id);
                          setActionNotice(`"${tx.itemName || tx.description}" muvaffaqiyatli o'chirildi.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
