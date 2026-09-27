/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { TransactionList } from './components/TransactionList';
import { UsersView } from './components/UsersView';
import { AdminPanelView } from './components/AdminPanelView';
import { AIFinancialAdvisor } from './components/AIFinancialAdvisor';
import { ExpenseForecast } from './components/ExpenseForecast';
import { SavingsGoals } from './components/SavingsGoals';
import { TelegramBotView } from './components/TelegramBotView';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { FinancialRiskAudit } from './components/FinancialRiskAudit';
import { TransactionFormModal } from './components/TransactionFormModal';
import { AuthModal } from './components/AuthModal';
import { VPSDeploymentModal } from './components/VPSDeploymentModal';

import { 
  Transaction, 
  RecurringBill, 
  SavingsGoal, 
  TelegramChatMessage, 
  ActiveTab,
  AppUser,
  ADMIN_EMAIL 
} from './types';

import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_RECURRING_BILLS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_TELEGRAM_MESSAGES,
  INITIAL_USERS,
  EXPENSE_CATEGORIES
} from './data/initialData';

import { initAuth, getCachedOAuthToken } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVPSModalOpen, setIsVPSModalOpen] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);

  // Authentication State with persistent storage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Persistent Users list
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

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

  // Save currentUser to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        'sarhisob_current_user',
        JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        })
      );
    } else {
      localStorage.removeItem('sarhisob_current_user');
    }
  }, [currentUser]);

  // Dedicated Admin Login Handler (Instant 1-Click Access)
  const handleLoginAsAdmin = () => {
    const adminUser = {
      uid: 'admin-indigo',
      email: ADMIN_EMAIL,
      displayName: 'IndigoKids (Bosh Administrator)',
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;
    setCurrentUser(adminUser);
    setAccessToken('admin-token');
    localStorage.setItem(
      'sarhisob_current_user',
      JSON.stringify({
        uid: 'admin-indigo',
        email: ADMIN_EMAIL,
        displayName: 'IndigoKids (Bosh Administrator)',
        role: 'admin',
      })
    );
  };

  const handleLoginWithEmail = (email: string, displayName?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const name = displayName || (isAdmin ? 'IndigoKids (Bosh Administrator)' : cleanEmail.split('@')[0]);
    const userObj = {
      uid: `user-${Date.now()}`,
      email: cleanEmail,
      displayName: name,
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;
    setCurrentUser(userObj);
    setAccessToken(isAdmin ? 'admin-token' : 'user-token');
    localStorage.setItem(
      'sarhisob_current_user',
      JSON.stringify({
        uid: userObj.uid,
        email: cleanEmail,
        displayName: name,
        role: isAdmin ? 'admin' : 'user',
      })
    );
  };

  const handleGrantAdminAccess = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === cleanEmail ? { ...u, role: 'admin' as const } : u
      )
    );
  };

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      if (user) {
        setCurrentUser(user);
        setAccessToken(getCachedOAuthToken());
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync logged in user with users state
  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase();
      const isAdmin = email === ADMIN_EMAIL.toLowerCase();

      setUsers((prev) => {
        const found = prev.find((u) => u.email.toLowerCase() === email);
        if (found) {
          return prev.map((u) =>
            u.email.toLowerCase() === email
              ? {
                  ...u,
                  displayName: currentUser.displayName || u.displayName,
                  photoURL: currentUser.photoURL || u.photoURL,
                  role: isAdmin ? 'admin' : u.role,
                  lastActiveAt: new Date().toLocaleString('uz-UZ'),
                }
              : u
          );
        }
        return [
          {
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: currentUser.displayName || currentUser.email!.split('@')[0],
            photoURL: currentUser.photoURL || undefined,
            role: isAdmin ? 'admin' : 'user',
            joinedAt: new Date().toISOString().split('T')[0],
            lastActiveAt: new Date().toLocaleString('uz-UZ'),
            totalTransactionsCount: 0,
            totalIncomeAmount: 0,
            totalExpenseAmount: 0,
          },
          ...prev,
        ];
      });
    }
  }, [currentUser]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('sarhisob_users', JSON.stringify(users));
  }, [users]);

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
    const creator = newTx.createdBy || (currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email || 'user@sarhisob.uz',
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Foydalanuvchi',
      photoURL: currentUser.photoURL || undefined,
      role: (currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user') as 'admin' | 'user',
    } : {
      email: 'mehmon@sarhisob.uz',
      name: 'Mehmon foydalanuvchi',
      role: 'user' as const,
    });

    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      itemName: newTx.itemName || newTx.description,
      quantity: newTx.quantity || '1 dona',
      createdAt: new Date().toISOString(),
      time: newTx.time || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false }),
      createdBy: creator,
    };
    setTransactions((prev) => [tx, ...prev]);

    // Update user stats
    if (creator.email) {
      setUsers((prev) => {
        const foundIndex = prev.findIndex((u) => u.email.toLowerCase() === creator.email.toLowerCase());
        if (foundIndex >= 0) {
          return prev.map((u, i) => i === foundIndex ? {
            ...u,
            totalTransactionsCount: (u.totalTransactionsCount || 0) + 1,
            totalIncomeAmount: tx.type === 'income' ? (u.totalIncomeAmount || 0) + tx.amount : u.totalIncomeAmount,
            totalExpenseAmount: tx.type === 'expense' ? (u.totalExpenseAmount || 0) + tx.amount : u.totalExpenseAmount,
            lastActiveAt: new Date().toLocaleString('uz-UZ'),
          } : u);
        }
        return [
          {
            uid: creator.uid || `user-${Date.now()}`,
            email: creator.email,
            displayName: creator.name,
            photoURL: creator.photoURL,
            role: creator.role || 'user',
            joinedAt: new Date().toISOString().split('T')[0],
            totalTransactionsCount: 1,
            totalIncomeAmount: tx.type === 'income' ? tx.amount : 0,
            totalExpenseAmount: tx.type === 'expense' ? tx.amount : 0,
            lastActiveAt: new Date().toLocaleString('uz-UZ'),
          },
          ...prev,
        ];
      });
    }
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
      setUsers(INITIAL_USERS);
      setRecurringBills(INITIAL_RECURRING_BILLS);
      setGoals(INITIAL_SAVINGS_GOALS);
      setTelegramMessages(INITIAL_TELEGRAM_MESSAGES);
      localStorage.removeItem('sarhisob_transactions');
      localStorage.removeItem('sarhisob_users');
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
        onOpenVPSModal={() => setIsVPSModalOpen(true)}
        criticalIssuesCount={criticalCount}
        onLoginAsAdmin={handleLoginAsAdmin}
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
            currentUserEmail={currentUser?.email || null}
            initialUserFilter={selectedUserFilter}
          />
        )}

        {activeTab === 'users' && (
          <UsersView
            users={users}
            transactions={transactions}
            currentUserEmail={currentUser?.email || null}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onSelectUserFilter={(email) => {
              setSelectedUserFilter(email);
              if (email) {
                setActiveTab('transactions');
              }
            }}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanelView
            currentUserEmail={currentUser?.email || null}
            users={users}
            transactions={transactions}
            balance={currentBalance}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenGoogleSheets={() => setActiveTab('sheets')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLoginAsAdmin={handleLoginAsAdmin}
            onLoginWithEmail={handleLoginWithEmail}
            onGrantAdminAccess={handleGrantAdminAccess}
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

      {/* Footer (Android APK removed) */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Sarhisob AI — Tovarlar nazorati, Google Sheets, Users tizimi va Telegram Mini App.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsVPSModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              VPS Deploy Sozlamalari
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
        currentUser={currentUser}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthChange={(user, token) => {
          setCurrentUser(user);
          setAccessToken(token || null);
        }}
        onLoginAsAdmin={handleLoginAsAdmin}
        onLoginWithEmail={handleLoginWithEmail}
      />

      <VPSDeploymentModal
        isOpen={isVPSModalOpen}
        onClose={() => setIsVPSModalOpen(false)}
      />
    </div>
  );
}
