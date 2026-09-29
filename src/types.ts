export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid?: string;
  email: string;
  role: UserRole;
  name?: string;
  displayName?: string;
  photoURL?: string;
  active?: boolean;
  joinedAt?: string;
  totalTransactionsCount?: number;
  totalExpenseAmount?: number;
  totalIncomeAmount?: number;
  lastActiveAt?: string;
}

export const ADMIN_EMAIL = '4g.sudoer@gmail.com';
export const USER_EMAIL = 'indigokids007@gmail.com';

export const AUTHORIZED_EMAILS = [
  '4g.sudoer@gmail.com',
  'indigokids007@gmail.com',
] as const;

export const SPREADSHEET_ID = '1bONPkd7IlHlzZSH-oVSqa4UVnBp16C7rBNPkhEGUAQk';
export const TARGET_SHEET_GID = '936307973';
export const DEFAULT_TELEGRAM_BOT_USERNAME = 'Kukukaka8_bot';

export type ExpenseStatus = 'ACTIVE' | 'DELETED';

export type PaymentMethod = 
  | 'Cash' 
  | 'Bank card' 
  | 'Bank transfer' 
  | 'Other'
  | 'Humo/Uzcard'
  | 'Visa/Mastercard'
  | 'Naqd pul'
  | 'Bank hisob';

export interface TransactionUser {
  uid?: string;
  email: string;
  name: string;
  photoURL?: string;
  role?: string;
}

export interface Expense {
  id: string; // EXP-2026-XXXXXX
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  month?: string; // e.g. "Month 1", "Month 2", "Month 3"
  category: string;
  description: string;
  amount: number; // in UZS
  currency?: 'UZS';
  paymentMethod?: PaymentMethod;
  responsiblePerson?: string;
  comment?: string;
  receiptUrl?: string;
  createdBy?: any; // string or TransactionUser
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
  status?: ExpenseStatus;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  // Legacy aliases
  type?: 'expense' | 'income';
  itemName?: string;
  quantity?: string;
}

// Backward compatibility alias
export type Transaction = Expense;
export type TransactionType = 'income' | 'expense';

export interface Category {
  id?: string;
  name: string;
  active?: boolean;
  color?: string;
  icon?: string;
  iconName?: string;
  createdAt?: string;
  type?: TransactionType;
  monthlyBudget?: number;
}

export type CategoryInfo = Category;

export interface MonthPeriod {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ThreeMonthPeriodSettings {
  startDate: string; // e.g. "2026-10-01"
  endDate: string; // e.g. "2026-12-31"
  month1: MonthPeriod;
  month2: MonthPeriod;
  month3: MonthPeriod;
}

export type AuditAction = 
  | 'CREATE' 
  | 'EDIT' 
  | 'DELETE' 
  | 'RESTORE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CATEGORY_CHANGE' 
  | 'SETTINGS_CHANGE';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  expenseId?: string;
  oldValue?: string;
  newValue?: string;
  userEmail: string;
  timestamp: string;
  reason?: string;
  deviceInfo?: string;
}

export interface MonthlySummary {
  month: string;
  totalExpense: number;
  transactionCount: number;
  averageTransaction: number;
  dailyAverage: number;
}

export interface DashboardStats {
  today: {
    total: number;
    count: number;
    largest: number;
    average: number;
  };
  currentMonth: {
    total: number;
    count: number;
    dailyAverage: number;
    averageTransaction: number;
    topCategory: string;
    remainingDays: number;
  };
  threeMonth: {
    total: number;
    count: number;
    monthlyComparison: { month: string; total: number; count: number }[];
    categoryComparison: { category: string; amount: number; percentage: number }[];
    averageMonthly: number;
    averageDaily: number;
  };
  remainingDaysInPeriod: number;
  isPeriodEnded: boolean;
}

export type ActiveNavTab = 
  | 'dashboard'
  | 'add-expense'
  | 'monthly'
  | 'history'
  | 'audit-log'
  | 'categories'
  | 'reports'
  | 'settings'
  | 'setup-status'
  | 'telegram'
  | 'overview'
  | 'analytics'
  | 'transactions'
  | 'users'
  | 'admin'
  | 'ai-advisor'
  | 'forecast'
  | 'goals'
  | 'sheets'
  | 'risks';

export type ActiveTab = ActiveNavTab;

// Legacy auxiliary interfaces for other optional subcomponents
export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  color: string;
  icon: string;
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  category: string;
  frequency: 'Oylik' | 'Yillik' | 'Haftalik';
  isPaidThisMonth: boolean;
}

export interface AIForecastResult {
  safeDailySpend: number;
  projectedMonthlyExpense: number;
  projectedMonthlyIncome: number;
  netCashFlow: number;
  riskLevel: 'Xavfsiz' | "O'rta" | 'Yuqori';
  forecast30Days: {
    totalExpense: number;
    categories: any[];
  };
  forecast60Days: {
    totalExpense: number;
    predictedBalance: number;
  };
  forecast90Days: {
    totalExpense: number;
    predictedBalance: number;
  };
  riskFactors: string[];
  scenarioAdvice: string;
}

export interface AIAnalysisResult {
  healthScore: number;
  summary: string;
  budgetRule503020: any;
  moneyLeaks: any[];
  savingRecommendations: any[];
  urgentAlerts: string[];
}

export interface TelegramChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  keyboard?: string[];
  detectedTransaction?: any;
}
