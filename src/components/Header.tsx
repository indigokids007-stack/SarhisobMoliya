import React from 'react';
import { User } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Receipt, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Send, 
  PlusCircle, 
  Bot,
  Wallet,
  FileSpreadsheet,
  AlertOctagon,
  Smartphone,
  Server,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../types';
import { formatUZS } from '../utils/formatters';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  balance: number;
  onOpenAddModal: () => void;
  onOpenTelegram: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAndroidApk: () => void;
  onOpenVPSModal: () => void;
  criticalIssuesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  balance,
  onOpenAddModal,
  onOpenTelegram,
  currentUser,
  onOpenAuth,
  onOpenAndroidApk,
  onOpenVPSModal,
  criticalIssuesCount = 0,
}) => {
  const navItems: { 
    id: ActiveTab; 
    label: string; 
    icon: React.ReactNode; 
    badge?: React.ReactNode 
  }[] = [
    { id: 'overview', label: 'Umumiy holat', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Kirim-Chiqimlar', icon: <Receipt className="w-4 h-4" /> },
    { id: 'ai-advisor', label: 'AI Maslahatchi & Tejash', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
    { id: 'forecast', label: 'Xarajatlar Prognozi', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'goals', label: 'Maqsadlar & To‘lovlar', icon: <Target className="w-4 h-4" /> },
    { id: 'sheets', label: 'Google Sheets', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> },
    { 
      id: 'risks', 
      label: 'Xatolar & Xatarlar', 
      icon: <AlertOctagon className="w-4 h-4 text-rose-500" />,
      badge: criticalIssuesCount > 0 ? (
        <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black bg-rose-600 text-white rounded-full animate-pulse">
          {criticalIssuesCount}
        </span>
      ) : null
    },
    { id: 'telegram', label: 'Telegram & Mini App', icon: <Send className="w-4 h-4 text-sky-400" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">Sarhisob AI</span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                  Pro Moliya
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI moliyaviy tahlilchi · Telegram Mini App · Google Sheets · Android APK
              </p>
            </div>
          </div>

          {/* Quick Balance & Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Balance Badge */}
            <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-800/70 rounded-lg border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium">Joriy balans</span>
              <span className={`text-sm font-bold font-mono tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatUZS(balance)}
              </span>
            </div>

            {/* Android APK Button */}
            <button
              onClick={onOpenAndroidApk}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-xl transition-all shadow-sm"
              title="Android APK va PWA o'rnatish markazi"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Android APK</span>
            </button>

            {/* VPS Deployment Button */}
            <button
              onClick={onOpenVPSModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-blue-300 bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/60 rounded-xl transition-all shadow-sm"
              title="VPS Serverga joylash yo'riqnomasi"
            >
              <Server className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">VPS Server</span>
            </button>

            {/* Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-900/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim / Chiqim</span>
            </button>

            {/* User Profile / Login Button */}
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1 pl-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all"
                title="Profil va Google hisob"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-7 h-7 rounded-full ring-1 ring-emerald-500"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200 hidden md:inline max-w-[90px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'Profil'}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              >
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span>Kirish</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none text-xs sm:text-sm">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
