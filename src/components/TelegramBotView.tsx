import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  Check, 
  CheckCheck, 
  Sparkles, 
  Paperclip, 
  Mic, 
  Settings, 
  Copy, 
  ExternalLink,
  Loader2,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  Radio
} from 'lucide-react';
import { TelegramChatMessage, Transaction } from '../types';
import { sendTelegramMessage } from '../services/api';
import { 
  testTelegramBotToken, 
  sendTelegramNotification, 
  setTelegramBotWebhook, 
  TelegramBotConfig 
} from '../services/telegramService';
import { formatUZS } from '../utils/formatters';

interface TelegramBotViewProps {
  messages: TelegramChatMessage[];
  onSendMessage: (msg: TelegramChatMessage) => void;
  onAddTransactionFromBot: (tx: Omit<Transaction, 'id'>) => void;
  transactions: Transaction[];
  balance: number;
}

export const TelegramBotView: React.FC<TelegramBotViewProps> = ({
  messages,
  onSendMessage,
  onAddTransactionFromBot,
  transactions,
  balance,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Real Telegram bot states
  const [botConfig, setBotConfig] = useState<TelegramBotConfig>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_telegram_config');
      return saved ? JSON.parse(saved) : { botToken: '', chatId: '' };
    } catch {
      return { botToken: '', chatId: '' };
    }
  });

  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [sendingTestNotify, setSendingTestNotify] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleTestBotToken = async () => {
    if (!botConfig.botToken.trim()) {
      setTokenStatus({ text: 'Iltimos, Bot Token kiriting', type: 'error' });
      return;
    }
    setTestingToken(true);
    setTokenStatus(null);
    try {
      const res = await testTelegramBotToken(botConfig.botToken);
      if (res.ok && res.bot) {
        const updated = {
          ...botConfig,
          botUsername: res.bot.username,
          botFirstName: res.bot.first_name,
          isConnected: true,
          lastTestedAt: new Date().toISOString(),
        };
        setBotConfig(updated);
        localStorage.setItem('sarhisob_telegram_config', JSON.stringify(updated));
        setTokenStatus({
          text: `Muvaffaqiyatli ulandi! Bot: @${res.bot.username} (${res.bot.first_name})`,
          type: 'success',
        });
      } else {
        setTokenStatus({ text: res.description || 'Token noto\'g\'ri', type: 'error' });
      }
    } catch (err: any) {
      setTokenStatus({ text: err.message || 'Xatolik yuz berdi', type: 'error' });
    } finally {
      setTestingToken(false);
    }
  };

  const handleSendLiveNotification = async () => {
    if (!botConfig.botToken || !botConfig.chatId) {
      setNotifyStatus({ text: 'Bot Token va Chat ID to\'ldirilishi shart', type: 'error' });
      return;
    }
    setSendingTestNotify(true);
    setNotifyStatus(null);
    try {
      const text = `🔔 *Sarhisob AI Moliyaviy Xabar*\n\n💰 *Joriy balans:* ${formatUZS(balance)}\n📊 *Tranzaksiyalar soni:* ${transactions.length} ta\n\n✅ Tizim va bot muvaffaqiyatli integratsiya qilindi!`;
      const res = await sendTelegramNotification(botConfig.botToken, botConfig.chatId, text);
      if (res.ok) {
        setNotifyStatus({ text: 'Xabar Telegramga muvaffaqiyatli yetkazildi!', type: 'success' });
      } else {
        setNotifyStatus({ text: res.description || 'Telegram xatosi', type: 'error' });
      }
    } catch (err: any) {
      setNotifyStatus({ text: err.message || 'Xatolik', type: 'error' });
    } finally {
      setSendingTestNotify(false);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: TelegramChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSendMessage(userMsg);
    if (!customText) setInputText('');
    setIsLoading(true);

    try {
      const response = await sendTelegramMessage({
        message: textToSend.trim(),
        transactions,
        balance,
      });

      const botMsg: TelegramChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        keyboard: response.keyboard,
        detectedTransaction: response.detectedTransaction || undefined,
      };

      onSendMessage(botMsg);

      // If a transaction was detected, automatically add it to the state!
      if (response.detectedTransaction) {
        onAddTransactionFromBot({
          type: response.detectedTransaction.type,
          amount: response.detectedTransaction.amount,
          category: response.detectedTransaction.category,
          description: response.detectedTransaction.description,
          date: response.detectedTransaction.date || new Date().toISOString().split('T')[0],
          paymentMethod: 'Humo/Uzcard',
        });
      }
    } catch (err: any) {
      const errorMsg: TelegramChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: "Kechirasiz, xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onSendMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/telegram/webhook`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const quickSamples = [
    '/balans',
    '/hisobot',
    '/prognoz',
    '/tavsiya',
    'Tushlik 45000 so\'m',
    'Taksi 25000',
    'Bozorlik 380 ming',
    'Oylik maosh tushdi 8 000 000',
  ];

  return (
    <div className="space-y-6">
      {/* Top Telegram Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-900/40">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">@SarhisobMoliyaBot</h2>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded">
                Telegram Boti
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Telegram interfeysi orqali xarajatlarni kiritish, tahlil qilish va prognoz olish
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span>{showConfig ? 'Simulyatorga qaytish' : 'Haqiqiy Bot Sozlamalari'}</span>
          </button>
        </div>
      </div>

      {showConfig ? (
        /* Real Bot Connection Configuration */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-400" />
              <span>Haqiqiy Telegram Botni Ulash Bo‘yicha Yo‘riqnoma</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ushbu tizimni o‘z shaxsiy Telegram botingizga 3 daqiqada ulab ishlatishingiz mumkin:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-sky-400 block text-sm">1-qadam</span>
              <p className="text-slate-300">
                Telegramda <strong className="text-white">@BotFather</strong> ga kiring va <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400">/newbot</code> buyrug‘ini bering.
              </p>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-sky-400 block text-sm">2-qadam</span>
              <p className="text-slate-300">
                Botingizga nom bering va BotFather bergan <strong className="text-white">HTTP API Token</strong>ni nusxalang.
              </p>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-sky-400 block text-sm">3-qadam</span>
              <p className="text-slate-300">
                Quyidagi Webhook manzilini Telegram Bot API ga o‘rnating yoki tokenni kiritib saqlang.
              </p>
            </div>
          </div>

          {/* Bot Token input and connection test */}
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Haqiqiy Bot Token (Telegram Bot API)</span>
              </label>
              {botConfig.isConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>@{botConfig.botUsername || 'Bot'} faol</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={botConfig.botToken}
                onChange={(e) => {
                  const updated = { ...botConfig, botToken: e.target.value };
                  setBotConfig(updated);
                  localStorage.setItem('sarhisob_telegram_config', JSON.stringify(updated));
                }}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
                className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={handleTestBotToken}
                disabled={testingToken}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                {testingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{testingToken ? 'Tekshirilmoqda...' : 'Ulanishni tekshirish'}</span>
              </button>
            </div>

            {tokenStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  tokenStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {tokenStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{tokenStatus.text}</span>
              </div>
            )}

            {/* Telegram Notification Test */}
            <div className="pt-3 border-t border-slate-850 space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Sizning Telegram Chat ID (yoki shaxsiy ID):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={botConfig.chatId || ''}
                  onChange={(e) => {
                    const updated = { ...botConfig, chatId: e.target.value };
                    setBotConfig(updated);
                    localStorage.setItem('sarhisob_telegram_config', JSON.stringify(updated));
                  }}
                  placeholder="Masalan: 123456789"
                  className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500"
                />
                <button
                  onClick={handleSendLiveNotification}
                  disabled={sendingTestNotify}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  {sendingTestNotify ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Sinov xabari yuborish</span>
                </button>
              </div>

              {notifyStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    notifyStatus.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {notifyStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{notifyStatus.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Webhook URL display */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Sizning Webhook URL manzilingiz:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/api/telegram/webhook`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
              />
              <button
                onClick={copyWebhookUrl}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Nusxalandi' : 'Nusxa olish'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-sky-950/30 border border-sky-800/60 rounded-xl text-xs text-sky-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Tezkor sinov uchun:</strong>
              Siz hoziroq "Simulyatorga qaytish" tugmasini bosib, bot bilan to‘liq suhbatlashishingiz, xarajat kiritishingiz va sun'iy intellekt tavsiyalarini sinab ko'rishingiz mumkin!
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Telegram Chat Simulator */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px] relative">
          {/* Telegram Mock Header */}
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1">
                  Sarhisob AI
                  <span className="text-[10px] text-sky-400 bg-sky-950 px-1 py-0.2 rounded">bot</span>
                </h4>
                <p className="text-[11px] text-emerald-400 font-medium">onlayn · moliyaviy maslahatchi</p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400">Joriy hisob: </span>
              <strong className="text-xs text-emerald-400">{formatUZS(balance)}</strong>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-slate-850 text-slate-100 border border-slate-800 rounded-bl-none'
                    }`}
                  >
                    {/* Render message with line breaks and markdown styling */}
                    <div className="whitespace-pre-wrap space-y-1">
                      {msg.text.split('\n').map((line, lIdx) => (
                        <p key={lIdx}>{line}</p>
                      ))}
                    </div>

                    {/* Detected Transaction Badge inside bot message */}
                    {msg.detectedTransaction && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" />
                          Tizimga qo‘shildi:
                        </span>
                        <span className="font-bold text-white">
                          {formatUZS(msg.detectedTransaction.amount)} ({msg.detectedTransaction.category})
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-200" />}
                    </div>
                  </div>

                  {/* Inline Keyboard Buttons if present */}
                  {msg.keyboard && msg.keyboard.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.keyboard.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => handleSend(btn)}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-750 text-sky-400 border border-slate-700/70 rounded-lg transition-colors font-medium shadow-sm"
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-850 border border-slate-800 px-3.5 py-2 rounded-2xl rounded-bl-none w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Sarhisob AI javob yozmoqda...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Command Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 mr-1">
              Tezkor:
            </span>
            {quickSamples.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(cmd)}
                className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg whitespace-nowrap transition-colors border border-slate-700/50"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-slate-850 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Xabar yozing (masalan: Tushlik 45000 yoki /hisobot)..."
              className="flex-1 bg-slate-950 border border-slate-750 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm"
              title="Yuborish"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
