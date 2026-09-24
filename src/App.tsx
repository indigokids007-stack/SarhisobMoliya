/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { TransactionList } from './components/TransactionList';
import { AIFinancialAdvisor } from './components/AIFinancialAdvisor';
import { ExpenseForecast } from './components/ExpenseForecast';
import { SavingsGoals } from './components/SavingsGoals';
import { TelegramBotView } from './components/TelegramBotView';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { FinancialRiskAudit } from './components/FinancialRiskAudit';
import { TransactionFormModal } from './components/TransactionFormModal';
import { AuthModal } from './components/AuthModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { VPSDeploymentModal } from './components/VPSDeploymentModal';

import { 
  Transaction, 
  RecurringBill, 
  SavingsGoal, 
  TelegramChatMessage, 
  ActiveTab 
} from './types';

import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_RECURRING_BILLS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_TELEGRAM_MESSAGES,
  EXPENSE_CATEGORIES
} from './data/initialData';

import { initAuth, getCachedOAuthToken } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isVPSModalOpen, setIsVPSModalOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Persistent state in localStorage with defaults
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_bills');
      return saved ? JSON.parse(saved) : INITIAL_RECURRING_BILLS;
    } catch {
      return INITIAL_RECURRING_BILLS;
    }
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_goals');
      return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  });

  const [telegramMessages, setTelegramMessages] = useState<TelegramChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_tg_messages');
      return saved ? JSON.parse(saved) : INITIAL_TELEGRAM_MESSAGES;
    } catch {
      return INITIAL_TELEGRAM_MESSAGES;
    }
  });

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setAccessToken(getCachedOAuthToken());
      } else {
        setAccessToken(null);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('sarhisob_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sarhisob_bills', JSON.stringify(recurringBills));
  }, [recurringBills]);

  useEffect(() => {
    localStorage.setItem('sarhisob_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('sarhisob_tg_messages', JSON.stringify(telegramMessages));
  }, [telegramMessages]);

  // Compute overall current balance
  const startingBaseBalance = 6500000;
  const netFromTransactions = transactions.reduce((acc, tx) => {
    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
  }, 0);
  const currentBalance = startingBaseBalance + netFromTransactions;

  // Compute Category Budgets
  const categoryBudgets = EXPENSE_CATEGORIES.map((c) => ({
    category: c.name,
    limitAmount: c.monthlyBudget || 1000000,
  }));

  // Calculate critical issues count for red badge in header
  const categorySpend: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
    });

  let criticalCount = 0;
  if (currentBalance < 0) criticalCount += 1;
  const currentDay = new Date().getDate();
  recurringBills.forEach((b) => {
    if (!b.isPaidThisMonth && b.dueDay <= currentDay) criticalCount += 1;
  });
  categoryBudgets.forEach((b) => {
    if ((categorySpend[b.category] || 0) > b.limitAmount) criticalCount += 1;
  });

  // Handlers
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
      time: newTx.time || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddDepositToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return { ...g, currentAmount: g.currentAmount + amount };
        }
        return g;
      })
    );
  };

  const handleAddNewGoal = (newGoal: Omit<SavingsGoal, 'id'>) => {
    const goal: SavingsGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, goal]);
  };

  const handleToggleBillPaid = (billId: string) => {
    setRecurringBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          return { ...b, isPaidThisMonth: !b.isPaidThisMonth };
        }
        return b;
      })
    );
  };

  const handleAddNewBill = (newBill: Omit<RecurringBill, 'id'>) => {
    const bill: RecurringBill = {
      ...newBill,
      id: `bill-${Date.now()}`,
    };
    setRecurringBills((prev) => [...prev, bill]);
  };

  const handleSendTelegramMessage = (msg: TelegramChatMessage) => {
    setTelegramMessages((prev) => [...prev, msg]);
  };

  const handleResetToDemo = () => {
    if (confirm("Namunaviy ma'lumotlarni qayta tiklashni xohlaysizmi?")) {
      setTransactions(INITIAL_TRANSACTIONS);
      setRecurringBills(INITIAL_RECURRING_BILLS);
      setGoals(INITIAL_SAVINGS_GOALS);
      setTelegramMessages(INITIAL_TELEGRAM_MESSAGES);
      localStorage.removeItem('sarhisob_transactions');
      localStorage.removeItem('sarhisob_bills');
      localStorage.removeItem('sarhisob_goals');
      localStorage.removeItem('sarhisob_tg_messages');
      localStorage.removeItem('sarhisob_google_sheet');
      localStorage.removeItem('sarhisob_telegram_config');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        balance={currentBalance}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenTelegram={() => setActiveTab('telegram')}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAndroidApk={() => setIsApkModalOpen(true)}
        onOpenVPSModal={() => setIsVPSModalOpen(true)}
        criticalIssuesCount={criticalCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            transactions={transactions}
            recurringBills={recurringBills}
            goals={goals}
            balance={currentBalance}
            setActiveTab={setActiveTab}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenTelegram={() => setActiveTab('telegram')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'ai-advisor' && (
          <AIFinancialAdvisor
            transactions={transactions}
            recurringBills={recurringBills}
            goals={goals}
            balance={currentBalance}
          />
        )}

        {activeTab === 'forecast' && (
          <ExpenseForecast
            transactions={transactions}
            recurringBills={recurringBills}
            goals={goals}
            balance={currentBalance}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsGoals
            goals={goals}
            recurringBills={recurringBills}
            onAddDepositToGoal={handleAddDepositToGoal}
            onAddNewGoal={handleAddNewGoal}
            onToggleBillPaid={handleToggleBillPaid}
            onAddNewBill={handleAddNewBill}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsSync
            currentUser={currentUser}
            accessToken={accessToken}
            transactions={transactions}
            recurringBills={recurringBills}
            goals={goals}
            balance={currentBalance}
            onOpenLogin={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'risks' && (
          <FinancialRiskAudit
            transactions={transactions}
            recurringBills={recurringBills}
            balance={currentBalance}
            categoryBudgets={categoryBudgets}
            onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {activeTab === 'telegram' && (
          <TelegramBotView
            messages={telegramMessages}
            onSendMessage={handleSendTelegramMessage}
            onAddTransactionFromBot={handleAddTransaction}
            transactions={transactions}
            balance={currentBalance}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Sarhisob AI — Sun'iy intellekt asosidagi shaxsiy moliyaviy tizim, Google Sheets va Telegram boti.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsApkModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Android APK O'rnatish
            </button>
            <span className="text-slate-800">|</span>
            <button
              onClick={() => setIsVPSModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              VPS Deploy
            </button>
            <span className="text-slate-800">|</span>
            <button
              onClick={handleResetToDemo}
              className="text-slate-400 hover:text-slate-200 transition-colors underline"
            >
              Namunaviy ma'lumotlarni tiklash
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthChange={(user, token) => {
          setCurrentUser(user);
          setAccessToken(token || null);
        }}
      />

      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      <VPSDeploymentModal
        isOpen={isVPSModalOpen}
        onClose={() => setIsVPSModalOpen(false)}
      />
    </div>
  );
}
