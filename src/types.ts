export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: 'Humo/Uzcard' | 'Visa/Mastercard' | 'Naqd pul' | 'Bank hisob';
  createdAt?: string;
}

export interface CategoryInfo {
  name: string;
  type: TransactionType;
  iconName: string;
  color: string;
  monthlyBudget?: number;
}

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
  dueDay: number; // 1-31
  category: string;
  frequency: 'Oylik' | 'Yillik' | 'Haftalik';
  isPaidThisMonth: boolean;
}

export interface MoneyLeak {
  title: string;
  category: string;
  estimatedMonthlyLoss: number;
  impact: 'Yuqori' | "O'rta" | 'Past';
  action: string;
}

export interface SavingRecommendation {
  title: string;
  potentialMonthlySavings: number;
  difficulty: 'Oson' | "O'rta" | 'Qiyin';
  description: string;
}

export interface BudgetRule503020 {
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  analysis: string;
}

export interface AIAnalysisResult {
  healthScore: number;
  summary: string;
  budgetRule503020: BudgetRule503020;
  moneyLeaks: MoneyLeak[];
  savingRecommendations: SavingRecommendation[];
  urgentAlerts: string[];
}

export interface ForecastCategory {
  category: string;
  amount: number;
  trend: string;
}

export interface AIForecastResult {
  safeDailySpend: number;
  projectedMonthlyExpense: number;
  projectedMonthlyIncome: number;
  netCashFlow: number;
  riskLevel: 'Xavfsiz' | "O'rta" | 'Yuqori';
  forecast30Days: {
    totalExpense: number;
    categories: ForecastCategory[];
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

export interface TelegramChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  keyboard?: string[];
  detectedTransaction?: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
  };
}

export type ActiveTab = 
  | 'overview' 
  | 'transactions' 
  | 'ai-advisor' 
  | 'forecast' 
  | 'goals' 
  | 'telegram'
  | 'sheets'
  | 'risks';
