import { Transaction } from '../types';

export const DEFAULT_TELEGRAM_BOT_TOKEN = '';
export const DEFAULT_TELEGRAM_BOT_USERNAME = 'Kukukaka8_bot';

export interface TelegramBotConfig {
  botToken: string;
  botUsername?: string;
  botFirstName?: string;
  chatId?: string;
  webhookUrl?: string;
  autoSendDailyReport?: boolean;
  autoNotifyAnomalies?: boolean;
  isConnected?: boolean;
  lastTestedAt?: string;
}

/**
 * Validates a Telegram Bot Token by calling server proxy
 */
export async function testTelegramBotToken(botToken?: string): Promise<{
  ok: boolean;
  bot?: { id: number; is_bot: boolean; first_name: string; username: string };
  description?: string;
}> {
  try {
    const res = await fetch('/api/telegram/bot-info');
    const data = await res.json();
    if (data.ok) {
      return { ok: true, bot: data.bot };
    }
    return { ok: false, description: data.error || 'Token noto\'g\'ri' };
  } catch (err: any) {
    return { ok: false, description: err.message || 'Telegram serveriga ulanishda xatolik' };
  }
}

/**
 * Sends a real message to a Telegram Chat ID via Bot
 */
export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; description?: string }> {
  const token = (botToken || DEFAULT_TELEGRAM_BOT_TOKEN).trim();
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    return { ok: data.ok, description: data.description };
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

/**
 * Sets Webhook for Telegram Bot
 */
export async function setTelegramBotWebhook(
  botToken: string,
  webhookUrl: string
): Promise<{ ok: boolean; description?: string }> {
  const token = (botToken || DEFAULT_TELEGRAM_BOT_TOKEN).trim();
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        allowed_updates: ['message', 'callback_query'],
      }),
    });
    const data = await res.json();
    return { ok: data.ok, description: data.description };
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

/**
 * Sends comprehensive Financial & Donut Analytics report to Telegram via server endpoint
 */
export async function sendFinancialReportViaServer(params: {
  chatId: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  topCategories?: { name: string; value: number; percentage: number }[];
  period?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/telegram/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return { ok: Boolean(data.ok), error: data.description || data.error };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Returns the currently stored Telegram Chat ID from local storage or Telegram WebApp
 */
export function getStoredTelegramChatId(): string {
  try {
    // 1. Check if running inside Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return String((window as any).Telegram.WebApp.initDataUnsafe.user.id);
    }
    // 2. Check local storage
    const saved = localStorage.getItem('sarhisob_telegram_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.chatId && String(parsed.chatId).trim()) {
        return String(parsed.chatId).trim();
      }
    }
  } catch {}
  return '';
}

/**
 * Registers Chat ID on the server
 */
export async function registerTelegramChatId(chatId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/telegram/register-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

/**
 * Automatically sends Telegram notification via @SarhisobMoliya_bot whenever any new transaction is added
 */
export async function notifyNewTransactionViaServer(params: {
  transaction: Transaction;
  newBalance: number;
  chatId?: string;
}): Promise<{ ok: boolean; deliveredToCount?: number; warning?: string; error?: string }> {
  try {
    const targetChatId = params.chatId || getStoredTelegramChatId();
    const res = await fetch('/api/telegram/notify-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction: params.transaction,
        newBalance: params.newBalance,
        chatId: targetChatId || undefined,
      }),
    });
    const data = await res.json();
    return {
      ok: Boolean(data.ok),
      deliveredToCount: data.deliveredToCount,
      warning: data.warning,
      error: data.error,
    };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}


