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
 * Validates a Telegram Bot Token by calling getMe API
 */
export async function testTelegramBotToken(botToken: string): Promise<{
  ok: boolean;
  bot?: { id: number; is_bot: boolean; first_name: string; username: string };
  description?: string;
}> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getMe`);
    const data = await res.json();
    if (data.ok) {
      return { ok: true, bot: data.result };
    }
    return { ok: false, description: data.description || 'Token noto\'g\'ri' };
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
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
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
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/setWebhook`, {
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
