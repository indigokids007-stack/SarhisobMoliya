import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Mail, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  ExternalLink,
  PlusCircle,
  FileSpreadsheet,
  Package,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AppUser, Transaction, ADMIN_EMAIL } from '../types';
import { formatUZS } from '../utils/formatters';

interface UsersViewProps {
  users: AppUser[];
  transactions: Transaction[];
  currentUserEmail: string | null;
  onOpenAddModal: () => void;
  onSelectUserFilter: (userEmail: string | null) => void;
  onOpenAuth: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  transactions,
  currentUserEmail,
  onOpenAddModal,
  onSelectUserFilter,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  // Compute live user stats from transactions
  const enrichedUsers = users.map((user) => {
    const userTx = transactions.filter(
      (t) => t.createdBy?.email.toLowerCase() === user.email.toLowerCase()
    );
    const count = userTx.length;
    const totalIncome = userTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = userTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    return {
      ...user,
      totalTransactionsCount: count,
      totalIncomeAmount: totalIncome,
      totalExpenseAmount: totalExpense,
      isAdmin: user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    };
  });

  const filteredUsers = enrichedUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // Selected user's transactions
  const selectedUserTransactions = selectedUserEmail
    ? transactions.filter(
        (t) => t.createdBy?.email.toLowerCase() === selectedUserEmail.toLowerCase()
      )
    : [];

  const selectedUserDetails = enrichedUsers.find(
    (u) => u.email.toLowerCase() === selectedUserEmail?.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Foydalanuvchilar (Users) & Mas'ullar</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Kirim-Chiqim va Tovarlarni Kirituvchilar Ro'yxati
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Har bir xodim yoki foydalanuvchi o'z Google hisobi orqali tizimga kirib tovar, miqdor va summasini kiritadi. 
              Kim kiritgani, vaqti va umumiy hisoboti bu yerda va Google Sheets da jamlangan holda qayd etiladi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-950 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Yangi tovar kiritish</span>
            </button>
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-all"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Google hisobni almashtirish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin highlight alert */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-amber-300 block">
              Bosh Administrator: {ADMIN_EMAIL}
            </span>
            <span className="text-slate-300">
              Admin panel va barcha boshqaruv faqat ushbu email egalari uchun to'liq ochiq bo'ladi.
            </span>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[11px] border border-amber-500/30">
            SuperAdmin
          </span>
        </div>
      </div>

      {/* Search & Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Foydalanuvchini izlash (ism, email, rol)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Jami faol foydalanuvchilar: <strong className="text-white">{users.length}</strong> ta
        </div>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredUsers.map((u) => {
          const isCurrent = currentUserEmail?.toLowerCase() === u.email.toLowerCase();
          const isSelected = selectedUserEmail?.toLowerCase() === u.email.toLowerCase();

          return (
            <div
              key={u.uid}
              onClick={() => {
                if (isSelected) {
                  setSelectedUserEmail(null);
                  onSelectUserFilter(null);
                } else {
                  setSelectedUserEmail(u.email);
                  onSelectUserFilter(u.email);
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/60 ring-2 ring-indigo-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-900/70 border border-slate-700 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {u.displayName[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate max-w-[140px]">
                        {u.displayName}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                      {u.email}
                    </span>
                  </div>
                </div>

                {u.isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Foydalanuvchi
                  </span>
                )}
              </div>

              {isCurrent && (
                <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sizning hisobingiz</span>
                </div>
              )}

              {/* Stats by this user */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">Kiritgan tovarlar:</span>
                  <strong className="text-white font-mono text-sm">{u.totalTransactionsCount || 0} ta</strong>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">Chiqim / Xarajat:</span>
                  <strong className="text-rose-400 font-mono text-xs">{formatUZS(u.totalExpenseAmount || 0)}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Oxirgi faollik:</span>
                <span className="font-mono text-slate-300">{u.lastActiveAt || 'Bugun'}</span>
              </div>

              <button
                type="button"
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{isSelected ? 'Filtr bekor qilish' : 'Tovarlarini ko‘rish'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected User's Transactions Table if clicked */}
      {selectedUserDetails && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <span>{selectedUserDetails.displayName} kiritgan tovarlar va amaliyotlar</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Email: {selectedUserDetails.email} · Jami: {selectedUserTransactions.length} ta yozuv
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedUserEmail(null);
                onSelectUserFilter(null);
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-lg w-fit"
            >
              Filtrni tozalash
            </button>
          </div>

          {selectedUserTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Ushbu foydalanuvchi tomonidan hali tovar kiritilmagan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">Tovar nomi</th>
                    <th className="px-4 py-3">Miqdori</th>
                    <th className="px-4 py-3">Summasi</th>
                    <th className="px-4 py-3">Vaqti</th>
                    <th className="px-4 py-3">Sana</th>
                    <th className="px-4 py-3">Turi</th>
                    <th className="px-4 py-3">Toifa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedUserTransactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {tx.itemName || tx.description}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {tx.quantity || '1 dona'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-100">
                        <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.type === 'income' ? '+' : '-'}{formatUZS(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-amber-300">
                        {tx.time || '12:00'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{tx.date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {tx.type === 'income' ? 'Kirim' : 'Chiqim'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{tx.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
