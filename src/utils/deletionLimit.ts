/**
 * Daily Deletion Limit Service
 * Enforces a maximum of 3 deletions per calendar day for mistakenly recorded expenses/incomes.
 */

export interface DeletionLogEntry {
  id: string;
  transactionId: string;
  transactionDescription: string;
  transactionAmount: number;
  transactionType: 'income' | 'expense';
  deletedAt: string;
  reason: string;
}

export interface DeletionLimitState {
  date: string; // YYYY-MM-DD
  count: number;
  remaining: number;
  maxPerDay: number;
  history: DeletionLogEntry[];
}

export const MAX_DAILY_DELETIONS = 3;
const STORAGE_KEY = 'sarhisob_daily_deletions';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyDeletionState(): DeletionLimitState {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        const count = typeof parsed.count === 'number' ? parsed.count : 0;
        return {
          date: today,
          count,
          remaining: Math.max(0, MAX_DAILY_DELETIONS - count),
          maxPerDay: MAX_DAILY_DELETIONS,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
      }
    }
  } catch (e) {
    console.error('Error reading daily deletion state:', e);
  }

  // New day or first run: 3 remaining
  return {
    date: today,
    count: 0,
    remaining: MAX_DAILY_DELETIONS,
    maxPerDay: MAX_DAILY_DELETIONS,
    history: [],
  };
}

export function recordDeletion(
  tx: { id: string; description: string; amount: number; type: 'income' | 'expense' },
  reason?: string
): { success: boolean; error?: string; remaining: number } {
  const state = getDailyDeletionState();

  if (state.remaining <= 0) {
    return {
      success: false,
      error: `Bugungi kunlik o'chirish limiti (${MAX_DAILY_DELETIONS} ta) to'ldi! Xavfsizlik va buxgalteriya intizomini ta'minlash uchun 1 kunda ko'pi bilan ${MAX_DAILY_DELETIONS} ta xatolik o'chirilishi mumkin. Ertaga qayta urinib ko'ring.`,
      remaining: 0,
    };
  }

  const newCount = state.count + 1;
  const newLogEntry: DeletionLogEntry = {
    id: `del-${Date.now()}`,
    transactionId: tx.id,
    transactionDescription: tx.description,
    transactionAmount: tx.amount,
    transactionType: tx.type,
    deletedAt: new Date().toISOString(),
    reason: reason?.trim() || "Adashib noto'g'ri kiritilgan amaliyot",
  };

  const updatedState: DeletionLimitState = {
    date: state.date,
    count: newCount,
    remaining: Math.max(0, MAX_DAILY_DELETIONS - newCount),
    maxPerDay: MAX_DAILY_DELETIONS,
    history: [newLogEntry, ...state.history],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  } catch (e) {
    console.error('Error saving daily deletion state:', e);
  }

  return {
    success: true,
    remaining: updatedState.remaining,
  };
}
