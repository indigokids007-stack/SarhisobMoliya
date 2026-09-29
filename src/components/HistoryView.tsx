import React, { useState, useMemo } from 'react';
import { 
  Expense, 
  Category, 
  AppUser, 
  ThreeMonthPeriodSettings 
} from '../types';
import { formatUZS, formatShortDate, formatDateTime } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Lock, 
  CheckCircle,
  Eye,
  ArrowUpDown
} from 'lucide-react';

interface HistoryViewProps {
  expenses: Expense[];
  categories: Category[];
  currentUser: AppUser | null;
  settings: ThreeMonthPeriodSettings;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense, reason: string) => Promise<void>;
  onRestoreExpense: (expense: Expense) => Promise<void>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  expenses,
  categories,
  currentUser,
  settings,
  onEditExpense,
  onDeleteExpense,
  onRestoreExpense,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<'All' | 'Month 1' | 'Month 2' | 'Month 3'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DELETED'>('ALL');
  const [userFilter, setUserFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Soft Delete Modal state
  const [deleteModalExpense, setDeleteModalExpense] = useState<Expense | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail Modal state
  const [viewDetailExpense, setViewDetailExpense] = useState<Expense | null>(null);

  // Unique users list for filter
  const distinctUsers = useMemo(() => {
    const s = new Set<string>();
    expenses.forEach((e) => {
      if (e.createdBy) s.add(e.createdBy);
    });
    return Array.from(s);
  }, [expenses]);

  // Filtered & Sorted list
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((e) => e.status === statusFilter);
    }

    // Month filter
    if (monthFilter !== 'All') {
      result = result.filter((e) => e.month === monthFilter);
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    // User filter
    if (userFilter !== 'All') {
      result = result.filter((e) => e.createdBy === userFilter);
    }

    // Global Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((e) => 
        e.id.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.date.includes(q) ||
        e.amount.toString().includes(q) ||
        (e.responsiblePerson && e.responsiblePerson.toLowerCase().includes(q)) ||
        (e.createdBy && e.createdBy.toLowerCase().includes(q)) ||
        (e.comment && e.comment.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''));
      if (sortBy === 'date_asc') return (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [expenses, statusFilter, monthFilter, categoryFilter, userFilter, searchTerm, sortBy]);

  // Paginated list
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const handleConfirmDelete = async () => {
    if (!deleteModalExpense) return;
    setIsDeleting(true);
    try {
      await onDeleteExpense(deleteModalExpense, deletionReason.trim() || 'Deleted by administrator');
      setDeleteModalExpense(null);
      setDeletionReason('');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Permanent Expense History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable audit record of all transactions with search, filters, and admin governance
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
            Total records: <strong className="text-white">{expenses.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
            Active: <strong>{expenses.filter(e => e.status === 'ACTIVE').length}</strong>
          </span>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        
        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by amount, description, category, date, user, or expense ID..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="date_desc">Newest First (Date ↓)</option>
              <option value="date_asc">Oldest First (Date ↑)</option>
              <option value="amount_desc">Highest Amount (Amount ↓)</option>
              <option value="amount_asc">Lowest Amount (Amount ↑)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          
          {/* Month Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Month Period</label>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Months</option>
              <option value="Month 1">{settings.month1.name}</option>
              <option value="Month 2">{settings.month2.name}</option>
              <option value="Month 3">{settings.month3.name}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All (Active & Deleted)</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DELETED">Deleted Only</option>
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Created By</label>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Users</option>
              {distinctUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Expense ID</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((e) => {
                  const isDeleted = e.status === 'DELETED';
                  return (
                    <tr
                      key={e.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isDeleted ? 'bg-rose-950/10 text-slate-400' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-300 whitespace-nowrap">
                        {e.id}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{formatShortDate(e.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{e.time || '12:00'}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700">
                          {e.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className={`font-medium truncate ${isDeleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {e.description}
                        </div>
                        {e.comment && (
                          <div className="text-[11px] text-slate-400 truncate italic">
                            {e.comment}
                          </div>
                        )}
                        {isDeleted && e.deletionReason && (
                          <div className="text-[10px] text-rose-400 mt-0.5 font-medium">
                            Reason: {e.deletionReason}
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                        {e.paymentMethod}
                      </td>

                      {/* Created By User */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px] block" title={e.createdBy}>
                          {e.createdBy.split('@')[0]}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isDeleted ? 'line-through text-slate-500' : 'text-white'}>
                          {formatUZS(e.amount)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isDeleted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Deleted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Detail */}
                          <button
                            onClick={() => setViewDetailExpense(e)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Admin Edit Action */}
                          {isAdmin ? (
                            <button
                              onClick={() => onEditExpense(e)}
                              disabled={isDeleted}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition disabled:opacity-30 disabled:hover:text-slate-400"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-slate-600 cursor-not-allowed" title="Admin only edit">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Admin Soft Delete / Restore Action */}
                          {isAdmin ? (
                            isDeleted ? (
                              <button
                                onClick={() => onRestoreExpense(e)}
                                className="p-1.5 text-teal-400 hover:text-teal-300 rounded hover:bg-slate-800 transition"
                                title="Restore to ACTIVE"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setDeleteModalExpense(e)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                                title="Soft Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          ) : (
                            <span className="p-1.5 text-slate-600 cursor-not-allowed" title="Admin only delete">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    No expense records matching the selected search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredExpenses.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-white">{Math.min(currentPage * pageSize, filteredExpenses.length)}</strong> of{' '}
            <strong className="text-white">{filteredExpenses.length}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* SOFT DELETE CONFIRMATION MODAL */}
      {deleteModalExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Soft Delete Expense Record</h3>
                <p className="text-xs text-slate-400 font-mono">{deleteModalExpense.id}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Description:</span> <strong className="text-white">{deleteModalExpense.description}</strong></p>
              <p><span className="text-slate-400">Amount:</span> <strong className="text-emerald-400 font-mono">{formatUZS(deleteModalExpense.amount)}</strong></p>
              <p><span className="text-slate-400">Category:</span> <span className="text-slate-200">{deleteModalExpense.category}</span></p>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              ⚠️ As mandated by accounting rules, this record will <strong>NOT</strong> be permanently deleted. It will be marked as <code className="text-rose-400 font-bold">DELETED</code>, preserved in the permanent Audit Log, and removed from active totals.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Reason for deletion (mandatory for audit):
              </label>
              <input
                type="text"
                required
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="e.g. Duplicate entry, Cancelled transaction"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalExpense(null);
                  setDeletionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || !deletionReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 transition active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Soft Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewDetailExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Expense Details</h3>
                <p className="text-xs text-slate-400 font-mono">{viewDetailExpense.id}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                viewDetailExpense.status === 'DELETED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {viewDetailExpense.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-850 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount</span>
                <span className="font-mono text-base font-bold text-white">{formatUZS(viewDetailExpense.amount)}</span>
              </div>
              <div className="p-3 bg-slate-850 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                <span className="text-sm font-semibold text-slate-200">{viewDetailExpense.category}</span>
              </div>
              <div className="p-3 bg-slate-850 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date & Time</span>
                <span className="text-slate-200">{formatShortDate(viewDetailExpense.date)}, {viewDetailExpense.time}</span>
              </div>
              <div className="p-3 bg-slate-850 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Month Assigned</span>
                <span className="text-emerald-400 font-semibold">{viewDetailExpense.month}</span>
              </div>
              <div className="p-3 bg-slate-850 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Method</span>
                <span className="text-slate-200">{viewDetailExpense.paymentMethod}</span>
              </div>
              <div className="p-3 bg-slate-850 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Responsible Person</span>
                <span className="text-slate-200">{viewDetailExpense.responsiblePerson}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-850 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Description</span>
              <p className="text-slate-100 font-medium">{viewDetailExpense.description}</p>
              {viewDetailExpense.comment && (
                <p className="text-slate-400 pt-1 italic">Note: {viewDetailExpense.comment}</p>
              )}
            </div>

            <div className="p-3 bg-slate-850/60 rounded-xl text-[11px] text-slate-400 space-y-1 font-mono">
              <p>Created by: <span className="text-slate-200">{viewDetailExpense.createdBy}</span></p>
              <p>Created at: <span className="text-slate-200">{formatDateTime(viewDetailExpense.createdAt)}</span></p>
              {viewDetailExpense.deletedAt && (
                <p className="text-rose-400">Deleted at: {formatDateTime(viewDetailExpense.deletedAt)} by {viewDetailExpense.deletedBy}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewDetailExpense(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
