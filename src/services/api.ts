import { Transaction, RecurringBill, SavingsGoal, AIAnalysisResult, AIForecastResult } from '../types';

export async function parseTransactionWithAI(text: string): Promise<{
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
}> {
  const response = await fetch('/api/gemini/parse-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Tranzaksiyani tahlil qilib bo‘lmadi');
  }

  return response.json();
}

export async function analyzeFinancesWithAI(params: {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  goals: SavingsGoal[];
  currentBalance: number;
}): Promise<AIAnalysisResult> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Moliyaviy tahlilni yuklab bo‘lmadi');
  }

  return response.json();
}

export async function getExpenseForecastWithAI(params: {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  goals: SavingsGoal[];
  currentBalance: number;
}): Promise<AIForecastResult> {
  const response = await fetch('/api/gemini/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Prognozni hisoblab bo‘lmadi');
  }

  return response.json();
}

export async function sendTelegramMessage(params: {
  message: string;
  transactions: Transaction[];
  balance: number;
}): Promise<{
  reply: string;
  keyboard?: string[];
  detectedTransaction?: {
    type: 'expense' | 'income';
    amount: number;
    category: string;
    description: string;
    date: string;
  } | null;
}> {
  const response = await fetch('/api/telegram/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Telegram xabariga javob olib bo‘lmadi');
  }

  return response.json();
}
