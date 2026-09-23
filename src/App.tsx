/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { TransactionList } from './components/TransactionList';
import { AIFinancialAdvisor } from './components/AIFinancialAdvisor';
import { ExpenseForecast } from './components/ExpenseForecast';
import { SavingsGoals } from './components/SavingsGoals';
import { TelegramBotView } from './components/TelegramBotView';
import { TransactionFormModal } from './components/TransactionFormModal';

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
  INITIAL_TELEGRAM_MESSAGES 
} from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  // Starting base balance + all incomes - all expenses
  const startingBaseBalance = 6500000;
  const netFromTransactions = transactions.reduce((acc, tx) => {
    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
  }, 0);
  const currentBalance = startingBaseBalance + netFromTransactions;

  // Handlers
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
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
      localStorage.clear();
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
          <p>© 2026 Sarhisob AI — Sun'iy intellekt asosidagi shaxsiy moliyaviy menejer va Telegram boti.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetToDemo}
              className="text-slate-400 hover:text-slate-200 transition-colors underline"
            >
              Namunaviy ma'lumotlarni tiklash
            </button>
          </div>
        </div>
      </footer>

      {/* Transaction Add Modal */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}
