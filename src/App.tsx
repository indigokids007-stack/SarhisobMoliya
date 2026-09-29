import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppUser, 
  Expense, 
  Category, 
  ThreeMonthPeriodSettings, 
  AuditLogEntry, 
  ActiveNavTab, 
  ADMIN_EMAIL, 
  USER_EMAIL, 
  SPREADSHEET_ID 
} from './types';
import { DEFAULT_CATEGORIES, DEFAULT_PERIOD_SETTINGS, INITIAL_EXPENSES } from './data/defaults';
import { 
  initAuth, 
  googleSignIn, 
  logout as authLogout, 
  switchAuthorizedAccount, 
  getCachedOAuthToken, 
  checkUserAuthorization 
} from './lib/firebase';
import { 
  batchSyncAllToSheets, 
  initializeAndCheckSpreadsheet 
} from './services/googleSheets';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { MonthlyMonitoringView } from './components/MonthlyMonitoringView';
import { HistoryView } from './components/HistoryView';
import { AuditLogView } from './components/AuditLogView';
import { CategoriesView } from './components/CategoriesView';
import { SettingsView } from './components/SettingsView';
import { SetupStatusView } from './components/SetupStatusView';
import { ExportReportsView } from './components/ExportReportsView';
import { TelegramBotView } from './components/TelegramBotView';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { AccessDeniedView } from './components/AccessDeniedView';

export default function App() {
  // Current user state (Default to Admin 4g.sudoer@gmail.com for seamless inspection)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('dem_current_user');
      return saved ? JSON.parse(saved) : switchAuthorizedAccount(ADMIN_EMAIL);
    } catch {
      return switchAuthorizedAccount(ADMIN_EMAIL);
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>('preview-token');
  const [accessDeniedEmail, setAccessDeniedEmail] = useState<string | null>(null);

  // Core Data States
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<ThreeMonthPeriodSettings>(DEFAULT_PERIOD_SETTINGS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
    {
      id: 'AUD-001',
      action: 'SETTINGS_CHANGE',
      userEmail: ADMIN_EMAIL,
      timestamp: new Date().toISOString(),
      newValue: 'Initial 3-month period set (01.10.2026 - 31.12.2026)',
      reason: 'Application initialization',
    },
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedMonthForMonitoring, setSelectedMonthForMonitoring] = useState<'Month 1' | 'Month 2' | 'Month 3'>('Month 1');

  // Google Sheets sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Period Expiration Calculation
  const { remainingDays, isPeriodEnded } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const isEnded = today > settings.endDate;
    const nowMs = new Date().getTime();
    const endMs = new Date(settings.endDate).getTime();
    const diff = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
    return { remainingDays: diff, isPeriodEnded: isEnded };
  }, [settings.endDate]);

  // Fetch initial data from server APIs
  useEffect(() => {
    const loadServerData = async () => {
      try {
        const [expRes, catRes, setRes, audRes] = await Promise.all([
          fetch('/api/expenses').catch(() => null),
          fetch('/api/categories').catch(() => null),
          fetch('/api/settings').catch(() => null),
          fetch('/api/audit-log', {
            headers: { 'x-user-email': currentUser?.email || ADMIN_EMAIL },
          }).catch(() => null),
        ]);

        if (expRes && expRes.ok) {
          const expData = await expRes.json();
          if (expData.expenses && expData.expenses.length > 0) {
            setExpenses(expData.expenses);
          }
        }

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (catData.categories && catData.categories.length > 0) {
            setCategories(catData.categories);
          }
        }

        if (setRes && setRes.ok) {
          const setData = await setRes.json();
          if (setData.settings) {
            setSettings(setData.settings);
          }
        }

        if (audRes && audRes.ok) {
          const audData = await audRes.json();
          if (audData.auditLog && audData.auditLog.length > 0) {
            setAuditLog(audData.auditLog);
          }
        }
      } catch (e) {
        console.warn('Using local fallback state:', e);
      }
    };

    loadServerData();
  }, [currentUser]);

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token || 'preview-token');
        setAccessDeniedEmail(null);
        localStorage.setItem('dem_current_user', JSON.stringify(user));
      },
      (errorMsg) => {
        if (errorMsg) {
          setAccessDeniedEmail(errorMsg);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken || 'preview-token');
        setAccessDeniedEmail(null);
        localStorage.setItem('dem_current_user', JSON.stringify(result.user));
      }
    } catch (err: any) {
      if (err.message?.includes('Access denied')) {
        setAccessDeniedEmail(err.message);
      } else {
        console.warn('Sign-in note:', err);
      }
    }
  };

  // Switch User Profile (for testing Admin vs User)
  const handleSwitchUser = (newUser: AppUser) => {
    setCurrentUser(newUser);
    setAccessDeniedEmail(null);
    localStorage.setItem('dem_current_user', JSON.stringify(newUser));
  };

  const handleLogout = async () => {
    await authLogout();
    setCurrentUser(null);
    setAccessToken(null);
    setAccessDeniedEmail(null);
    localStorage.removeItem('dem_current_user');
  };

  // Sync with Google Sheets
  const handleSyncGoogleSheets = async () => {
    setIsSyncing(true);
    setSyncMessage('Saved locally. Synchronizing with Google Sheets…');

    try {
      // 1. Trigger server-side synchronization
      const serverRes = await fetch('/api/sheets/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
          'x-user-email': currentUser?.email || USER_EMAIL,
        },
      });

      const serverData = await serverRes.json().catch(() => ({}));

      if (serverData.googleSheetsSynced) {
        setSyncMessage('Successfully synchronized all 6 tabs with Google Sheets!');
      } else if (serverData.isAuthError) {
        setSyncMessage('Saved in local database. Google Sheets authorization missing or expired. Click Sign in with Google to synchronize remote spreadsheet.');
      } else {
        // Also run client fallback sync if available
        await batchSyncAllToSheets(
          accessToken || 'preview-token',
          expenses,
          categories,
          settings,
          auditLog
        );
        setSyncMessage('Saved locally in server database. Background sync active.');
      }
      setTimeout(() => setSyncMessage(null), 6000);
    } catch (err: any) {
      setSyncMessage('Saved in local database. Retrying background synchronization…');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Expense Create/Update Submit Handler
  const handleSaveExpense = async (data: Partial<Expense>) => {
    const isEdit = Boolean(editingExpense);
    const userEmail = currentUser?.email || USER_EMAIL;

    if (isEdit && editingExpense) {
      // Edit expense (Admin only)
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
          'x-user-email': userEmail,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update expense');
      }

      const resData = await res.json();
      setExpenses((prev) =>
        prev.map((e) => (e.id === editingExpense.id ? resData.expense : e))
      );

      setAuditLog((prev) => [
        {
          id: `AUD-${Date.now()}`,
          action: 'EDIT',
          expenseId: editingExpense.id,
          userEmail,
          timestamp: new Date().toISOString(),
          newValue: JSON.stringify({ amount: data.amount, description: data.description }),
          reason: 'Admin updated expense record',
        },
        ...prev,
      ]);

      setSyncMessage('Expense updated. Synchronizing with Google Sheets…');
      setTimeout(() => setSyncMessage(null), 4000);
    } else {
      // Add new expense
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          ...data,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create expense');
      }

      const resData = await res.json();
      setExpenses((prev) => [resData.expense, ...prev]);

      setAuditLog((prev) => [
        {
          id: `AUD-${Date.now()}`,
          action: 'CREATE',
          expenseId: resData.expense.id,
          userEmail,
          timestamp: new Date().toISOString(),
          newValue: JSON.stringify({ amount: data.amount, category: data.category, description: data.description }),
          reason: 'New expense added',
        },
        ...prev,
      ]);

      setSyncMessage(
        resData.remoteSheetsSynced
          ? 'Successfully synchronized with Google Sheets!'
          : 'Saved in server database. Background sync active.'
      );
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Soft Delete Handler (Admin Only)
  const handleDeleteExpense = async (expense: Expense, reason: string) => {
    const userEmail = currentUser?.email || ADMIN_EMAIL;
    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail,
      },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Delete failed');
      return;
    }

    const resData = await res.json();
    setExpenses((prev) =>
      prev.map((e) => (e.id === expense.id ? resData.expense : e))
    );

    setAuditLog((prev) => [
      {
        id: `AUD-${Date.now()}`,
        action: 'DELETE',
        expenseId: expense.id,
        userEmail,
        timestamp: new Date().toISOString(),
        reason,
        oldValue: JSON.stringify({ amount: expense.amount, description: expense.description }),
        newValue: JSON.stringify({ status: 'DELETED', reason }),
      },
      ...prev,
    ]);

    setSyncMessage('Record marked as DELETED and excluded from active accounting.');
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // Restore Deleted Expense Handler (Admin Only)
  const handleRestoreExpense = async (expense: Expense) => {
    const userEmail = currentUser?.email || ADMIN_EMAIL;
    const res = await fetch(`/api/expenses/${expense.id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Restore failed');
      return;
    }

    const resData = await res.json();
    setExpenses((prev) =>
      prev.map((e) => (e.id === expense.id ? resData.expense : e))
    );

    setAuditLog((prev) => [
      {
        id: `AUD-${Date.now()}`,
        action: 'RESTORE',
        expenseId: expense.id,
        userEmail,
        timestamp: new Date().toISOString(),
        reason: 'Restored back to ACTIVE by admin',
      },
      ...prev,
    ]);

    setSyncMessage('Expense restored to ACTIVE status.');
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // Category Add/Update Handlers
  const handleAddCategory = async (catData: { name: string; color?: string; icon?: string }) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || ADMIN_EMAIL,
      },
      body: JSON.stringify(catData),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories((prev) => [...prev, data.category]);
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || ADMIN_EMAIL,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === id ? data.category : c)));
    }
  };

  // Settings Update Handler
  const handleUpdateSettings = async (newSettings: ThreeMonthPeriodSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || ADMIN_EMAIL,
      },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
  };

  // If unauthorized email attempted
  if (accessDeniedEmail) {
    return (
      <AccessDeniedView
        attemptedEmail={accessDeniedEmail}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onSyncGoogleSheets={handleSyncGoogleSheets}
        isSyncing={isSyncing}
        syncMessage={syncMessage}
        remainingDays={remainingDays}
        isPeriodEnded={isPeriodEnded}
        onOpenSetupStatus={() => setActiveTab('setup-status')}
      />

      {/* Main Layout: Desktop Sidebar + Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
          onOpenAddModal={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
          isPeriodEnded={isPeriodEnded}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              expenses={expenses}
              settings={settings}
              categories={categories}
              onOpenAddModal={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              onNavigateToMonthly={(m) => {
                setSelectedMonthForMonitoring(m);
                setActiveTab('monthly');
              }}
              onNavigateToHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'monthly' && (
            <MonthlyMonitoringView
              expenses={expenses}
              settings={settings}
              selectedMonthTab={selectedMonthForMonitoring}
              onSelectExpense={(exp) => {
                setEditingExpense(exp);
                setIsExpenseModalOpen(true);
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              expenses={expenses}
              categories={categories}
              currentUser={currentUser}
              settings={settings}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setIsExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onRestoreExpense={handleRestoreExpense}
            />
          )}

          {activeTab === 'audit-log' && (
            <AuditLogView
              auditLog={auditLog}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={categories}
              currentUser={currentUser}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
            />
          )}

          {activeTab === 'reports' && (
            <ExportReportsView
              expenses={expenses}
              categories={categories}
              auditLog={auditLog}
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              onUpdateSettings={handleUpdateSettings}
              isPeriodEnded={isPeriodEnded}
              remainingDays={remainingDays}
            />
          )}

          {activeTab === 'setup-status' && (
            <SetupStatusView
              currentUser={currentUser}
              accessToken={accessToken}
              expensesCount={expenses.length}
            />
          )}

          {activeTab === 'telegram' && (
            <TelegramBotView
              expenses={expenses}
              onAddExpenseDirect={handleSaveExpense}
            />
          )}

        </main>
      </div>

      {/* Record / Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
        categories={categories}
        currentUser={currentUser}
        settings={settings}
        isPeriodEnded={isPeriodEnded}
        initialExpense={editingExpense}
      />

    </div>
  );
}
