import React from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ShieldCheck, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  LogOut, 
  ExternalLink,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AppUser, ADMIN_EMAIL, USER_EMAIL, SPREADSHEET_ID } from '../types';
import { switchAuthorizedAccount } from '../lib/firebase';

interface HeaderProps {
  currentUser: AppUser | null;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  onSwitchUser: (user: AppUser) => void;
  onSyncGoogleSheets: () => void;
  isSyncing: boolean;
  syncMessage: string | null;
  remainingDays: number;
  isPeriodEnded: boolean;
  onOpenSetupStatus: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onGoogleSignIn,
  onLogout,
  onSwitchUser,
  onSyncGoogleSheets,
  isSyncing,
  syncMessage,
  remainingDays,
  isPeriodEnded,
  onOpenSetupStatus,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & 3-Month Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white font-bold text-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-100">
                  Daily Expense Manager
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  3-Month Period
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Professional business expense tracking & Google Sheets database
              </p>
            </div>
          </div>

          {/* Center: Period Remaining Counter */}
          <div className="hidden md:flex items-center gap-2">
            {isPeriodEnded ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Accounting period ended</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span><strong className="text-white font-semibold">{remainingDays} days</strong> remaining in period</span>
              </div>
            )}

            {/* Google Sheets status pill */}
            <a
              href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-600/30 hover:bg-emerald-900/50 transition-colors"
              title="Open Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheets</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          </div>

          {/* Right: Sync & User Access Control */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Sync Button */}
            <button
              onClick={onSyncGoogleSheets}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition active:scale-95 disabled:opacity-60"
              title="Synchronize with Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Sheets'}</span>
            </button>

            {/* User Profile & Role Info */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                
                {/* Role Badge */}
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                      {currentUser.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                        isAdmin
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {currentUser.email}
                  </span>
                </div>

                {/* Quick Role Switcher Button for Testing/Evaluation */}
                <button
                  onClick={() => {
                    const nextEmail = isAdmin ? USER_EMAIL : ADMIN_EMAIL;
                    onSwitchUser(switchAuthorizedAccount(nextEmail));
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] font-medium transition"
                  title="Switch between Admin (4g.sudoer) and User (indigokids007)"
                >
                  <span className="text-slate-400">Switch: </span>
                  <span className="font-semibold text-emerald-400">{isAdmin ? 'To User' : 'To Admin'}</span>
                </button>

                {/* Sign Out Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Google Sign-In</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync notification toast bar */}
        {syncMessage && (
          <div className="py-1 px-3 bg-emerald-950/70 border-t border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button
              onClick={onOpenSetupStatus}
              className="text-[11px] underline font-medium hover:text-white"
            >
              View setup status →
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
