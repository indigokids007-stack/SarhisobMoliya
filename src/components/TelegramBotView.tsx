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
  Radio,
  Smartphone,
  MessageSquare,
  Share2,
  Vibrate,
  ShieldCheck,
  ChevronRight,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar
} from 'lucide-react';
import { TelegramChatMessage, Transaction } from '../types';
import { sendTelegramMessage } from '../services/api';
import { 
  testTelegramBotToken, 
  sendTelegramNotification, 
  TelegramBotConfig 
} from '../services/telegramService';
import { formatUZS, formatDateUz } from '../utils/formatters';
import { 
  isRunningInTelegram, 
  getTelegramUser, 
  triggerHaptic, 
  initTelegramWebApp 
} from '../lib/telegramWebApp';
import { getTransactionTimeString } from '../utils/csvExport';

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
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'miniapp' | 'settings'>('miniapp');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isWebhookCopied, setIsWebhookCopied] = useState(false);
  
  // Real Telegram bot states
  const [botConfig, setBotConfig] = useState<TelegramBotConfig>(() => {
    try {
      const saved = localStorage.getItem('sarhisob_telegram_config');
      return saved ? JSON.parse(saved) : { botToken: '', chatId: '', botUsername: 'SarhisobMoliyaBot' };
    } catch {
      return { botToken: '', chatId: '', botUsername: 'SarhisobMoliyaBot' };
    }
  });

  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [sendingTestNotify, setSendingTestNotify] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Telegram WebApp detection
  const isInsideTelegram = isRunningInTelegram();
  const telegramUser = getTelegramUser();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initTelegramWebApp();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeSubTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeSubTab]);

  const miniAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sarhisob-moliya.web.app';

  const copyMiniAppUrl = () => {
    navigator.clipboard.writeText(miniAppUrl);
    setIsCopied(true);
    triggerHaptic('success');
    setTimeout(() => setIsCopied(false), 2200);
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/telegram/webhook`;
    navigator.clipboard.writeText(url);
    setIsWebhookCopied(true);
    triggerHaptic('success');
    setTimeout(() => setIsWebhookCopied(false), 2200);
  };

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
        triggerHaptic('success');
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
      const text = `🔔 *Sarhisob AI Moliyaviy Xabar*\n\n💰 *Joriy balans:* ${formatUZS(balance)}\n📊 *Tranzaksiyalar soni:* ${transactions.length} ta\n📱 *Mini App URL:* ${miniAppUrl}\n\n✅ Tizim va bot muvaffaqiyatli integratsiya qilindi!`;
      const res = await sendTelegramNotification(botConfig.botToken, botConfig.chatId, text);
      if (res.ok) {
        setNotifyStatus({ text: 'Xabar Telegramga muvaffaqiyatli yetkazildi!', type: 'success' });
        triggerHaptic('success');
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

    triggerHaptic('light');

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
      triggerHaptic('medium');

      // If a transaction was detected, automatically add it to the state!
      if (response.detectedTransaction) {
        onAddTransactionFromBot({
          type: response.detectedTransaction.type,
          amount: response.detectedTransaction.amount,
          category: response.detectedTransaction.category,
          description: response.detectedTransaction.description,
          date: response.detectedTransaction.date || new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false }),
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
              <h2 className="text-base sm:text-lg font-bold text-white">
                @{botConfig.botUsername || 'SarhisobMoliyaBot'}
              </h2>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded">
                Telegram & Mini App
              </span>
              {isInsideTelegram && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>TMA Faol</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Telegram boti va Telegram Mini App (TMA) orqali to'liq moliyaviy boshqaruv
            </p>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveSubTab('miniapp');
              triggerHaptic('light');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'miniapp'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mini App (TMA)</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('chat');
              triggerHaptic('light');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'chat'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Bot Chati</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('settings');
              triggerHaptic('light');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'settings'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Sozlamalar</span>
          </button>
        </div>
      </div>

      {/* 1. Telegram Mini App (TMA) Tab */}
      {activeSubTab === 'miniapp' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Status banner */}
          <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Telegram Mini App (TMA) Tayyor</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Telegram Bot Ichida To'liq Ishlovchi Mini App
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Foydalanuvchilar brauzerga chiqmasdan, to'g'ridan-to'g'ri Telegram ichida bir bosish bilan o'z moliyaviy hisobotlarini ko'rishi, xarajat kiritishi va tahlillarni ochishi mumkin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={copyMiniAppUrl}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-sky-950 active:scale-95"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'URL Nusxalandi!' : 'Mini App URL dan nusxa olish'}</span>
                </button>

                <a
                  href={`https://t.me/${botConfig.botUsername || 'SarhisobMoliyaBot'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Telegramda ochish</span>
                </a>
              </div>
            </div>

            {/* Mini App URL Display Bar */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs font-semibold text-slate-400 shrink-0">Mini App URL:</span>
                <code className="text-xs font-mono text-emerald-400 truncate select-all">
                  {miniAppUrl}
                </code>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  alert('Telegram Haptic Feedback (Vibratsiya) sinovi muvaffaqiyatli ishga tushdi!');
                }}
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition-colors shrink-0"
              >
                <Vibrate className="w-3.5 h-3.5" />
                <span>Haptic (Tebranish) sinash</span>
              </button>
            </div>
          </div>

          {/* Setup Guide: 2 Easy Ways to set up in BotFather */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method 1: Menu Button (Recommended & Fast) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                  1
                </span>
                <h4 className="text-sm font-bold text-white">
                  1-usul: Menu Button (Pastki tugma) sifatida qo'shish
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bu usulda har safar bot ochilganda, chap pastki burchakda qulay <strong className="text-slate-200">"Sarhisob Ilova"</strong> tugmasi turadi.
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">1.</span>
                  <span className="text-slate-300">Telegramda <strong className="text-white">@BotFather</strong> ga kiring.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">2.</span>
                  <span className="text-slate-300"><code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400">/setmenubutton</code> buyrug'ini yuboring.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">3.</span>
                  <span className="text-slate-300">Botingizni tanlang va Web App URL sifatida quyidagi manzilni kiriting:</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-850 font-mono text-[11px] text-sky-300 break-all">
                  {miniAppUrl}
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">4.</span>
                  <span className="text-slate-300">Tugma matniga <strong className="text-white">"Sarhisob Moliya"</strong> deb yozing. Tayyor!</span>
                </div>
              </div>
            </div>

            {/* Method 2: Direct /newapp Mini App */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-400">
                  2
                </span>
                <h4 className="text-sm font-bold text-white">
                  2-usul: Telegram Web App (/newapp) ro'yxatdan o'tkazish
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bot orqali to'g'ridan-to'g'ri <code className="text-sky-300">t.me/BotUsername/app</code> havolasini olib guruhlarda va kanallarda ulashish imkoni.
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">1.</span>
                  <span className="text-slate-300"><strong className="text-white">@BotFather</strong> ga <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400">/newapp</code> yuboring.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">2.</span>
                  <span className="text-slate-300">Botingizni tanlang, Ilova nomini kiriting (<strong className="text-white">Sarhisob Moliya</strong>).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">3.</span>
                  <span className="text-slate-300">Tavsif va 640x360 rasm yuklang (yoki o'tkazib yuboring).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">4.</span>
                  <span className="text-slate-300">Web App URL so'raganda ushbu havolani yuboring:</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-850 font-mono text-[11px] text-sky-300 break-all">
                  {miniAppUrl}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Telegram Mini App Phone Preview Frame */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Telegram Mini App Sinov Simulyatori</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Foydalanuvchi ilovangizni Telegram ichida ochganda qanday ko'rinishi:
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
                Jonli ma'lumotlar bilan
              </span>
            </div>

            {/* Simulated Phone Shell */}
            <div className="max-w-sm mx-auto bg-slate-950 border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Telegram Top App Bar */}
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Yopish</span>
                <div className="text-center">
                  <span className="font-bold text-white block text-[13px]">Sarhisob Moliya</span>
                  <span className="text-[10px] text-slate-400">bot</span>
                </div>
                <span className="text-slate-400 font-bold">···</span>
              </div>

              {/* Mini App Content Inside Phone */}
              <div className="p-4 space-y-4 bg-slate-950 min-h-[380px]">
                {/* Balance Widget */}
                <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Umumiy Balans
                  </span>
                  <div className="text-xl font-black text-emerald-400">
                    {formatUZS(balance)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {transactions.length} ta amaliyot qayd qilingan
                  </span>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveSubTab('chat');
                      setInputText('/hisobot');
                    }}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors"
                  >
                    <span className="text-[10px] text-sky-400 block font-semibold">Tahlil</span>
                    <span className="text-xs font-bold text-white">Hisobot olish</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveSubTab('chat');
                      setInputText('/prognoz');
                    }}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors"
                  >
                    <span className="text-[10px] text-purple-400 block font-semibold">AI Prognoz</span>
                    <span className="text-xs font-bold text-white">Oylik bashorat</span>
                  </button>
                </div>

                {/* Recent mini transactions with date & time */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    So'nggi yozuvlar (Vaqti bilan):
                  </span>
                  <div className="space-y-1.5">
                    {transactions.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white block text-[11px]">{t.description}</span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {t.date} · {getTransactionTimeString(t)}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-[11px] ${
                            t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}{formatUZS(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Telegram Mini App Native MainButton simulation */}
              <div className="p-3 bg-slate-900 border-t border-slate-800">
                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    alert('Mini App orqali yangi amaliyot qo‘shish oynasi ochilmoqda!');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  + Yangi amaliyot qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Telegram Chat Simulator Tab */}
      {activeSubTab === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px] relative animate-in fade-in">
          {/* Telegram Mock Header */}
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 border-2 border-slate-850" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Sarhisob AI ({botConfig.botUsername || '@SarhisobMoliyaBot'})
                </h3>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  online · bot
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('miniapp')}
                className="text-xs font-semibold px-2.5 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-lg border border-sky-500/20 transition-colors flex items-center gap-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mini App</span>
              </button>
              <button
                onClick={() => setActiveSubTab('settings')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Sozlamalar"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
            <div className="text-center my-2">
              <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full">
                Bugun · Telegram Bot Integratsiyasi
              </span>
            </div>

            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-slate-850 text-slate-200 border border-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Detected Transaction Badge */}
                    {msg.detectedTransaction && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-emerald-400">
                        <span className="flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Muvaffaqiyatli saqlandi:</span>
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
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-750 text-sky-400 border border-slate-700/70 rounded-lg transition-colors font-medium shadow-sm active:scale-95"
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
                className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg whitespace-nowrap transition-colors border border-slate-700/50 active:scale-95"
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

      {/* 3. Settings & Bot API Config Tab */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-400" />
              <span>Haqiqiy Telegram Botni Ulash Sozlamalari</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bot tokeningizni kiriting va shaxsiy Telegram botingizga jonli bildirishnomalar yuboring:
            </p>
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
                Sizning Telegram Chat ID:
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
                {isWebhookCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isWebhookCopied ? 'Nusxalandi' : 'Nusxa olish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
