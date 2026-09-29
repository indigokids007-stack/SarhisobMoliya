import React, { useState } from 'react';
import { ThreeMonthPeriodSettings, AppUser, ADMIN_EMAIL, USER_EMAIL, SPREADSHEET_ID, TARGET_SHEET_GID } from '../types';
import { formatShortDate } from '../utils/formatters';
import { 
  Settings, 
  Calendar, 
  Users, 
  FileSpreadsheet, 
  Bot, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Lock
} from 'lucide-react';

interface SettingsViewProps {
  settings: ThreeMonthPeriodSettings;
  currentUser: AppUser | null;
  onUpdateSettings: (newSettings: ThreeMonthPeriodSettings) => Promise<void>;
  isPeriodEnded: boolean;
  remainingDays: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  isPeriodEnded,
  remainingDays,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const [formData, setFormData] = useState<ThreeMonthPeriodSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await onUpdateSettings(formData);
      setSuccessMsg('3-Month Accounting Period successfully updated and synced.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Accounting Period & System Settings
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Admin Controlled
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Configure the 3-month operational window, Google Sheets target, and user roles
        </p>
      </div>

      {/* Period Status Banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
        isPeriodEnded 
          ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' 
          : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
      }`}>
        <div className="flex items-center gap-2.5">
          {isPeriodEnded ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <Calendar className="w-5 h-5 text-emerald-400" />}
          <div>
            <p className="font-semibold text-sm text-white">
              {isPeriodEnded ? 'Accounting Period Ended' : 'Accounting Period Active'}
            </p>
            <p className="text-slate-300 text-xs mt-0.5">
              {isPeriodEnded 
                ? 'All existing records and audit trails remain accessible. To accept new expenses, configure a new period below.'
                : `${remainingDays} days remaining until ${formatShortDate(settings.endDate)}.`}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3-MONTH ACCOUNTING PERIOD CONFIGURATION (Admin only) */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">3-Month Accounting Period Definition</h2>
          </div>
          {!isAdmin && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5" /> Read-only
            </span>
          )}
        </div>

        {/* Global Start & End Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Period Start Date</label>
            <input
              type="date"
              required
              disabled={!isAdmin}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Period End Date</label>
            <input
              type="date"
              required
              disabled={!isAdmin}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Month 1, Month 2, Month 3 Granular Controls */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Monthly Segments Breakdown
          </h3>

          {/* Month 1 */}
          <div className="p-4 bg-slate-850/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Month 1 Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.month1.name}
                onChange={(e) => setFormData({
                  ...formData,
                  month1: { ...formData.month1, name: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Start Date</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.month1.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  month1: { ...formData.month1, startDate: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-300">End Date</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.month1.endDate}
                onChange={(e) => setFormData({
                  ...formData,
                  month1: { ...formData.month1, endDate: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Month 2 */}
          <div className="p-4 bg-slate-850/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Month 2 Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.month2.name}
                onChange={(e) => setFormData({
                  ...formData,
                  month2: { ...formData.month2, name: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Start Date</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.month2.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  month2: { ...formData.month2, startDate: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-300">End Date</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.month2.endDate}
                onChange={(e) => setFormData({
                  ...formData,
                  month2: { ...formData.month2, endDate: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Month 3 */}
          <div className="p-4 bg-slate-850/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Month 3 Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.month3.name}
                onChange={(e) => setFormData({
                  ...formData,
                  month3: { ...formData.month3, name: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Start Date</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.month3.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  month3: { ...formData.month3, startDate: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-300">End Date</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.month3.endDate}
                onChange={(e) => setFormData({
                  ...formData,
                  month3: { ...formData.month3, endDate: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Period Settings'}</span>
            </button>
          </div>
        )}
      </form>

      {/* ACCESS CONTROL & SYSTEM INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ACCESS CONTROL WHITELIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Authorized Google Accounts</h3>
          </div>
          <p className="text-xs text-slate-400">
            Strict whitelist enforced by both frontend and backend server routes.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-850 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-mono text-slate-200 block font-semibold">{ADMIN_EMAIL}</span>
                <span className="text-[11px] text-slate-400">Full administrative governance, delete/restore, period config</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                ADMIN
              </span>
            </div>

            <div className="p-3 bg-slate-850 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-mono text-slate-200 block font-semibold">{USER_EMAIL}</span>
                <span className="text-[11px] text-slate-400">Expense entry, monitoring, dashboard, search & history</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                USER
              </span>
            </div>
          </div>
        </div>

        {/* GOOGLE SHEETS & TELEGRAM INTEGRATION INFO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white">Google Spreadsheet Database</h3>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-850 rounded-xl space-y-1 font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Spreadsheet ID</span>
              <span className="text-emerald-400 font-bold break-all">{SPREADSHEET_ID}</span>
            </div>

            <div className="p-3 bg-slate-850 rounded-xl space-y-1 font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Tab GID</span>
              <span className="text-white font-bold">{TARGET_SHEET_GID}</span>
            </div>

            <div className="p-3 bg-slate-850 rounded-xl flex items-center justify-between">
              <span className="text-slate-300">Telegram Bot</span>
              <span className="text-emerald-400 font-bold font-mono">@Kukukaka8_bot</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
