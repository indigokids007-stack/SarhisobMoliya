import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  Smartphone, 
  RefreshCw, 
  Zap,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { DEFAULT_TELEGRAM_BOT_USERNAME, SPREADSHEET_ID, Expense } from '../types';
import { formatUZS } from '../utils/formatters';

interface TelegramBotViewProps {
  expenses: Expense[];
  onAddExpenseDirect: (exp: Partial<Expense>) => Promise<void>;
}

export const TelegramBotView: React.FC<TelegramBotViewProps> = ({
  expenses,
  onAddExpenseDirect,
}) => {
  const [chatIdInput, setChatIdInput] = useState('');
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Mini App Simulator Chat
  const [simStep, setSimStep] = useState<'idle' | 'amount' | 'category' | 'description' | 'payment' | 'confirm'>('idle');
  const [simAmount, setSimAmount] = useState('150000');
  const [simCategory, setSimCategory] = useState('Food');
  const [simDescription, setSimDescription] = useState('Office groceries & snacks');
  const [simPayment, setSimPayment] = useState('Cash');
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; buttons?: string[] }>>([
    {
      sender: 'bot',
      text: `👋 Assalomu alaykum! Daily Expense Manager botiga xush kelibsiz.

Google Sheets: \`${SPREADSHEET_ID}\`
Quyidagi tugmalar orqali xarajat kiritishingiz mumkin:`,
      buttons: ['➕ Add Expense', '📊 Dashboard', '📅 Monthly Monitoring', '📜 History'],
    },
  ]);

  const handleRegisterChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatIdInput.trim()) return;
    setIsRegistering(true);
    setRegisterStatus(null);
    try {
      const res = await fetch('/api/telegram/register-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatIdInput.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setRegisterStatus(`Chat ID ${chatIdInput} registered successfully. Real-time expense notifications active!`);
      } else {
        setRegisterStatus(data.error || 'Failed to register Chat ID');
      }
    } catch (err: any) {
      setRegisterStatus(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSimulateButtonClick = async (btn: string) => {
    if (btn === '➕ Add Expense') {
      setSimMessages((prev) => [
        ...prev,
        { sender: 'user', text: '➕ Add Expense' },
        { sender: 'bot', text: '💰 Enter expense amount in UZS:\n(e.g., 150000)' },
      ]);
      setSimStep('amount');
      return;
    }

    if (btn === '📊 Dashboard') {
      const total = expenses.filter(e => e.status === 'ACTIVE').reduce((s, e) => s + e.amount, 0);
      setSimMessages((prev) => [
        ...prev,
        { sender: 'user', text: '📊 Dashboard' },
        { sender: 'bot', text: `📊 Daily Expense Manager Dashboard:\n\n💰 3-Month Total: *${formatUZS(total)}*\n📦 Transactions: *${expenses.length}*\n🏛️ Sheets ID: ${SPREADSHEET_ID}` },
      ]);
      return;
    }

    if (btn === '📅 Monthly Monitoring') {
      setSimMessages((prev) => [
        ...prev,
        { sender: 'user', text: '📅 Monthly Monitoring' },
        { sender: 'bot', text: `📅 3-Month Breakdown:\n\n• Month 1: Active\n• Month 2: Scheduled\n• Month 3: Scheduled` },
      ]);
      return;
    }

    if (btn === '📜 History') {
      const last = expenses.slice(0, 3).map((e, i) => `${i + 1}. ${e.date} - ${e.category}: ${formatUZS(e.amount)} (${e.description})`).join('\n');
      setSimMessages((prev) => [
        ...prev,
        { sender: 'user', text: '📜 History' },
        { sender: 'bot', text: `📜 Recent Transactions:\n\n${last}` },
      ]);
      return;
    }
  };

  const handleSimulateSubmitAmount = () => {
    setSimMessages((prev) => [
      ...prev,
      { sender: 'user', text: simAmount },
      {
        sender: 'bot',
        text: `💰 Amount: *${formatUZS(Number(simAmount))}*\n\n👉 Choose expense category:`,
        buttons: ['Food', 'Transport', 'Utilities', 'Equipment', 'Other'],
      },
    ]);
    setSimStep('category');
  };

  const handleSimulateSelectCategory = (cat: string) => {
    setSimCategory(cat);
    setSimMessages((prev) => [
      ...prev,
      { sender: 'user', text: cat },
      { sender: 'bot', text: `📁 Category: *${cat}*\n\n📝 Enter expense description:` },
    ]);
    setSimStep('description');
  };

  const handleSimulateSubmitDescription = () => {
    setSimMessages((prev) => [
      ...prev,
      { sender: 'user', text: simDescription },
      {
        sender: 'bot',
        text: `📝 Description: *${simDescription}*\n\n💳 Choose payment method:`,
        buttons: ['Cash', 'Bank card', 'Bank transfer', 'Other'],
      },
    ]);
    setSimStep('payment');
  };

  const handleSimulateSelectPayment = (pm: string) => {
    setSimPayment(pm);
    setSimMessages((prev) => [
      ...prev,
      { sender: 'user', text: pm },
      {
        sender: 'bot',
        text: `🔍 Confirmation:\n\n📅 Date: ${new Date().toISOString().split('T')[0]}\n📁 Category: ${simCategory}\n💰 Amount: ${formatUZS(Number(simAmount))}\n📝 Description: ${simDescription}\n💳 Payment: ${pm}\n\nSave to Google Sheets?`,
        buttons: ['✅ Confirm', '❌ Cancel'],
      },
    ]);
    setSimStep('confirm');
  };

  const handleSimulateConfirm = async () => {
    await onAddExpenseDirect({
      amount: parseFloat(simAmount),
      category: simCategory,
      description: simDescription,
      paymentMethod: simPayment as any,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false }),
      createdBy: 'telegram@bot',
    });

    setSimMessages((prev) => [
      ...prev,
      { sender: 'user', text: '✅ Confirm' },
      {
        sender: 'bot',
        text: `✅ Expense successfully recorded!\n\n💰 Amount: ${formatUZS(Number(simAmount))}\n📁 Category: ${simCategory}\n🏛️ Saved to Google Sheets (${SPREADSHEET_ID}).`,
        buttons: ['➕ Add Expense', '📊 Dashboard', '📜 History'],
      },
    ]);
    setSimStep('idle');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Telegram Bot & Mini App Integration
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              @{DEFAULT_TELEGRAM_BOT_USERNAME}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Bidirectional expense recording flow and Mini App execution for mobile accounting
          </p>
        </div>

        <a
          href={`https://t.me/${DEFAULT_TELEGRAM_BOT_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-md transition active:scale-95"
        >
          <Bot className="w-4 h-4" />
          <span>Open @{DEFAULT_TELEGRAM_BOT_USERNAME}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Grid: Bot Card & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: INTEGRATION CONFIGURATION & CHAT ID REGISTRATION */}
        <div className="space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Bot Credentials & Configuration</h3>
            
            <div className="p-3 bg-slate-850 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bot Username:</span>
                <span className="font-mono font-bold text-sky-400">@{DEFAULT_TELEGRAM_BOT_USERNAME}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Environment Secret:</span>
                <span className="font-mono text-slate-300">TELEGRAM_BOT_TOKEN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database Connection:</span>
                <span className="font-mono text-emerald-400">Google Sheets API v4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Webhook Route:</span>
                <span className="font-mono text-slate-300">/api/telegram/webhook</span>
              </div>
            </div>

            {/* Subscribe Chat ID Form */}
            <form onSubmit={handleRegisterChat} className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">
                Receive Real-Time Expense Alerts (Enter your Telegram Chat ID):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  placeholder="e.g. 576037959 or @user"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50"
                >
                  {isRegistering ? 'Registering...' : 'Register'}
                </button>
              </div>
              {registerStatus && (
                <p className="text-[11px] text-emerald-400 mt-1 font-medium">{registerStatus}</p>
              )}
            </form>
          </div>

          {/* Bot Features List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Supported Bot Commands & Flows
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="p-2.5 bg-slate-850 rounded-xl">
                <code className="text-sky-400 font-bold">➕ Add Expense</code> — Interactive wizard: Amount → Category buttons → Description → Payment buttons → Confirm → Saved directly to Google Sheets!
              </div>
              <div className="p-2.5 bg-slate-850 rounded-xl">
                <code className="text-sky-400 font-bold">📊 Dashboard</code> — Live breakdown of Today's, Current Month's, and 3-Month total expenses.
              </div>
              <div className="p-2.5 bg-slate-850 rounded-xl">
                <code className="text-sky-400 font-bold">📅 Monthly Monitoring</code> — Quick comparison between Month 1, Month 2, and Month 3.
              </div>
              <div className="p-2.5 bg-slate-850 rounded-xl">
                <code className="text-sky-400 font-bold">📜 History</code> — View the latest transactions recorded.
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT: INTERACTIVE TELEGRAM CONVERSATION SIMULATOR */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-2xl">
          
          {/* Mock Telegram Header */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-white leading-tight">@{DEFAULT_TELEGRAM_BOT_USERNAME}</p>
                <p className="text-[10px] text-emerald-400">bot • official accounting agent</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 rounded bg-slate-800">
              Live Simulator
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {simMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-slate-850 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Inline Action Buttons */}
                {msg.buttons && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                    {msg.buttons.map((btn) => (
                      <button
                        key={btn}
                        onClick={() => {
                          if (simStep === 'category') handleSimulateSelectCategory(btn);
                          else if (simStep === 'payment') handleSimulateSelectPayment(btn);
                          else if (simStep === 'confirm') {
                            if (btn === '✅ Confirm') handleSimulateConfirm();
                            else {
                              setSimStep('idle');
                              setSimMessages(p => [...p, { sender: 'user', text: '❌ Cancel' }, { sender: 'bot', text: 'Cancelled.' }]);
                            }
                          } else {
                            handleSimulateButtonClick(btn);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition active:scale-95"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Simulator Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            {simStep === 'amount' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 150000)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={handleSimulateSubmitAmount}
                  className="px-3 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold"
                >
                  Send
                </button>
              </div>
            )}

            {simStep === 'description' && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={simDescription}
                  onChange={(e) => setSimDescription(e.target.value)}
                  placeholder="Enter description"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={handleSimulateSubmitDescription}
                  className="px-3 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold"
                >
                  Send
                </button>
              </div>
            )}

            {(simStep === 'idle' || simStep === 'category' || simStep === 'payment' || simStep === 'confirm') && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 py-1">
                <span>Select option from buttons above or click ➕ Add Expense</span>
                <button
                  onClick={() => handleSimulateButtonClick('➕ Add Expense')}
                  className="text-sky-400 font-semibold underline hover:text-white"
                >
                  ➕ Add Expense
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
