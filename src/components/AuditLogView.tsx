import React, { useState, useMemo } from 'react';
import { AuditLogEntry, AppUser } from '../types';
import { formatDateTime } from '../utils/formatters';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  RotateCcw,
  Settings,
  Tag
} from 'lucide-react';

interface AuditLogViewProps {
  auditLog: AuditLogEntry[];
  currentUser: AppUser | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  auditLog,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLog = useMemo(() => {
    let result = [...auditLog];

    if (actionFilter !== 'ALL') {
      result = result.filter((a) => a.action === actionFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((a) =>
        a.id.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        (a.expenseId && a.expenseId.toLowerCase().includes(q)) ||
        (a.reason && a.reason.toLowerCase().includes(q)) ||
        (a.newValue && a.newValue.toLowerCase().includes(q)) ||
        (a.oldValue && a.oldValue.toLowerCase().includes(q))
      );
    }

    return result;
  }, [auditLog, actionFilter, searchTerm]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CREATE</span>;
      case 'EDIT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">EDIT</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">DELETE</span>;
      case 'RESTORE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">RESTORE</span>;
      case 'SETTINGS_CHANGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">SETTINGS</span>;
      case 'CATEGORY_CHANGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">CATEGORY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{action}</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Permanent Audit Log
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Admin Governance
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable log of all financial creations, modifications, deletions, and configuration changes
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Audit Records: <strong className="text-white">{auditLog.length}</strong>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by action, user, expense ID, or reason..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="EDIT">EDIT</option>
          <option value="DELETE">DELETE</option>
          <option value="RESTORE">RESTORE</option>
          <option value="SETTINGS_CHANGE">SETTINGS_CHANGE</option>
          <option value="CATEGORY_CHANGE">CATEGORY_CHANGE</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Audit ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Expense ID</th>
                <th className="py-3 px-3">User Email</th>
                <th className="py-3 px-4">Details / Changes</th>
                <th className="py-3 px-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLog.length > 0 ? (
                filteredLog.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-slate-400">{a.id}</td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{formatDateTime(a.timestamp)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{getActionBadge(a.action)}</td>
                    <td className="py-3 px-3 text-emerald-400 font-semibold">{a.expenseId || '-'}</td>
                    <td className="py-3 px-3 text-slate-300">{a.userEmail}</td>
                    <td className="py-3 px-4 max-w-sm truncate text-slate-400">
                      {a.newValue || a.oldValue || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-300 italic">{a.reason || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs font-sans">
                    No audit records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
