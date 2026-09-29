import React from 'react';
import { 
  Home, 
  PlusCircle, 
  Calendar, 
  History, 
  ShieldAlert, 
  Tag, 
  FileText, 
  Settings, 
  CheckCircle, 
  Bot,
  MoreHorizontal
} from 'lucide-react';
import { ActiveNavTab, AppUser } from '../types';

interface NavigationProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  currentUser: AppUser | null;
  onOpenAddModal: () => void;
  isPeriodEnded: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenAddModal,
  isPeriodEnded,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'dashboard' as ActiveNavTab, label: 'Dashboard', icon: Home },
    { id: 'add-expense' as ActiveNavTab, label: 'Add Expense', icon: PlusCircle, isAction: true },
    { id: 'monthly' as ActiveNavTab, label: 'Monthly', icon: Calendar },
    { id: 'history' as ActiveNavTab, label: 'History', icon: History },
    { id: 'reports' as ActiveNavTab, label: 'Reports & Export', icon: FileText },
    ...(isAdmin ? [
      { id: 'audit-log' as ActiveNavTab, label: 'Audit Log', icon: ShieldAlert, badge: 'Admin' },
      { id: 'categories' as ActiveNavTab, label: 'Categories', icon: Tag, badge: 'Admin' },
      { id: 'settings' as ActiveNavTab, label: 'Settings', icon: Settings, badge: 'Admin' },
    ] : []),
    { id: 'setup-status' as ActiveNavTab, label: 'Setup Status', icon: CheckCircle },
    { id: 'telegram' as ActiveNavTab, label: 'Telegram Bot', icon: Bot },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isAction) {
                    onOpenAddModal();
                  } else {
                    onTabChange(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Add Expense CTA button inside sidebar */}
        <div className="mt-auto pt-4 border-t border-slate-800/80">
          <button
            onClick={onOpenAddModal}
            disabled={isPeriodEnded}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white shadow-lg transition active:scale-95 ${
              isPeriodEnded
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isPeriodEnded ? 'Period Ended' : 'Record Expense'}</span>
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            {isPeriodEnded ? 'New entries locked' : 'Direct sync to Google Sheets'}
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Home, Add, History, Reports, More) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2">
        <div className="flex items-center justify-around">
          
          {/* Home */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition ${
              activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          {/* Monthly */}
          <button
            onClick={() => onTabChange('monthly')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition ${
              activeTab === 'monthly' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Monthly</span>
          </button>

          {/* Add (Floating style) */}
          <button
            onClick={onOpenAddModal}
            disabled={isPeriodEnded}
            className={`flex flex-col items-center -mt-5 p-2 rounded-full text-white shadow-lg transition active:scale-95 ${
              isPeriodEnded ? 'bg-slate-700' : 'bg-emerald-600 shadow-emerald-900/40'
            }`}
            title="Add Expense"
          >
            <PlusCircle className="w-6 h-6" />
          </button>

          {/* History */}
          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition ${
              activeTab === 'history' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </button>

          {/* Reports / More */}
          <button
            onClick={() => onTabChange(isAdmin ? 'settings' : 'reports')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition ${
              activeTab === 'settings' || activeTab === 'reports' || activeTab === 'audit-log'
                ? 'text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>{isAdmin ? 'Admin' : 'Reports'}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
