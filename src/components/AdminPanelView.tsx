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
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUserEmail,
  users,
  transactions,
  balance,
  onDeleteTransaction,
  onOpenGoogleSheets,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const isAdmin = currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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

  // If NOT admin, show restricted screen
  if (!isAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Administrator Ruxsati Talab Qilinadi</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Admin panelga faqat <strong className="text-amber-300 font-mono">{ADMIN_EMAIL}</strong> Google hisobi orqali kirish mumkin.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
            Hozirgi hisob: {currentUserEmail || "Mehmon (Kirmagan)"}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-950"
          >
            Google orqali {ADMIN_EMAIL} hisobiga kirish
          </button>
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
