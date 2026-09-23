import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Send, 
  PlusCircle, 
  Bot,
  Wallet
} from 'lucide-react';
import { ActiveTab } from '../types';
import { formatUZS } from '../utils/formatters';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  balance: number;
  onOpenAddModal: () => void;
  onOpenTelegram: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  balance,
  onOpenAddModal,
  onOpenTelegram,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Umumiy holat', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Kirim-Chiqimlar', icon: <Receipt className="w-4 h-4" /> },
    { id: 'ai-advisor', label: 'AI Maslahatchi & Tejash', icon: <Sparkles className="w-4 h-4 text-emerald-500" /> },
    { id: 'forecast', label: 'Xarajatlar Prognozi', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'goals', label: 'Maqsadlar & To‘lovlar', icon: <Target className="w-4 h-4" /> },
    { id: 'telegram', label: 'Telegram Bot', icon: <Send className="w-4 h-4 text-sky-500" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Sarhisob AI</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                  Smart Moliya
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI moliyaviy tahlil, tejash tavsiyalari va xarajatlar prognozi
              </p>
            </div>
          </div>

          {/* Quick Balance & Action buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Balance Badge */}
            <div className="hidden md:flex flex-col items-end px-3 py-1 bg-slate-800/70 rounded-lg border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium">Joriy balans</span>
              <span className={`text-sm font-semibold tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatUZS(balance)}
              </span>
            </div>

            {/* Telegram Bot quick launcher */}
            <button
              onClick={onOpenTelegram}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/70 rounded-lg transition-colors"
              title="Telegram bot simulyatorini ochish"
            >
              <Bot className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Telegram Bot</span>
            </button>

            {/* Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-md shadow-emerald-900/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Kirim / Chiqim</span>
            </button>
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
