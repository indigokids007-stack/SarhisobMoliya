import React from 'react';
import { ShieldAlert, LogOut, ArrowRight, Lock } from 'lucide-react';
import { ADMIN_EMAIL, USER_EMAIL, AppUser } from '../types';
import { switchAuthorizedAccount } from '../lib/firebase';

interface AccessDeniedViewProps {
  attemptedEmail?: string | null;
  onLogout: () => void;
  onSwitchUser: (user: AppUser) => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  attemptedEmail,
  onLogout,
  onSwitchUser,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
        
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Access denied. This application is restricted to authorized users.
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your Google Account ({attemptedEmail || 'unknown'}) is not in the authorized access whitelist for the Daily Expense Manager database.
          </p>
        </div>

        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 text-xs text-left space-y-2">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Authorized Whitelist Accounts:
          </span>
          <div className="flex items-center justify-between text-slate-300 font-mono">
            <span>{ADMIN_EMAIL}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">ADMIN</span>
          </div>
          <div className="flex items-center justify-between text-slate-300 font-mono">
            <span>{USER_EMAIL}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">USER</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onSwitchUser(switchAuthorizedAccount(ADMIN_EMAIL))}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Continue as Administrator ({ADMIN_EMAIL})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSwitchUser(switchAuthorizedAccount(USER_EMAIL))}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Continue as User ({USER_EMAIL})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
          >
            Sign out of this session
          </button>
        </div>

      </div>
    </div>
  );
};
