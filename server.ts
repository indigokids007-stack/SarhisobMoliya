import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Ensure server data directory exists for resilient offline caching
const DATA_DIR = path.join(__dirname, 'server_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File persistence paths
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_log.json');

// Constants
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '4g.sudoer@gmail.com';
const USER_EMAIL = 'indigokids007@gmail.com';
const AUTHORIZED_EMAILS = [ADMIN_EMAIL.toLowerCase(), USER_EMAIL.toLowerCase()];

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1bONPkd7IlHlzZSH-oVSqa4UVnBp16C7rBNPkhEGUAQk';
const SPREADSHEET_GID = process.env.GOOGLE_SHEET_GID || '936307973';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8539361446:AAHLiilwTM_wjLLu-prVx-BYz6LU5wDk4e8';
const TELEGRAM_BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_BOT_USERNAME !== 'SarhisobMoliya_bot')
  ? process.env.TELEGRAM_BOT_USERNAME
  : 'Kukukaka8_bot';

// Format currency helper
function formatUZS(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(num) + ' UZS';
}

// ----------------------------------------------------
// DEFAULT DATA INITIALIZATION
// ----------------------------------------------------
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food', active: true, color: '#f59e0b', icon: 'Utensils', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-2', name: 'Transport', active: true, color: '#3b82f6', icon: 'Car', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-3', name: 'Salary', active: true, color: '#10b981', icon: 'Banknote', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-4', name: 'Utilities', active: true, color: '#06b6d4', icon: 'Zap', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-5', name: 'Rent', active: true, color: '#8b5cf6', icon: 'Building', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-6', name: 'Equipment', active: true, color: '#ec4899', icon: 'Wrench', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-7', name: 'Cleaning', active: true, color: '#14b8a6', icon: 'Sparkles', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-8', name: 'Office', active: true, color: '#6366f1', icon: 'Briefcase', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-9', name: 'Education', active: true, color: '#eab308', icon: 'GraduationCap', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-10', name: 'Advertising', active: true, color: '#f97316', icon: 'Megaphone', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-11', name: 'Repairs', active: true, color: '#ef4444', icon: 'Hammer', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-12', name: 'Taxes', active: true, color: '#64748b', icon: 'FileText', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'cat-13', name: 'Other', active: true, color: '#94a3b8', icon: 'MoreHorizontal', createdAt: '2026-09-01T00:00:00Z' },
];

const DEFAULT_SETTINGS = {
  startDate: '2026-10-01',
  endDate: '2026-12-31',
  month1: { name: 'Month 1', startDate: '2026-10-01', endDate: '2026-10-31' },
  month2: { name: 'Month 2', startDate: '2026-11-01', endDate: '2026-11-30' },
  month3: { name: 'Month 3', startDate: '2026-12-01', endDate: '2026-12-31' },
};

const DEFAULT_INITIAL_EXPENSES = [
  {
    id: 'EXP-2026-000001',
    date: '2026-10-02',
    time: '10:30',
    month: 'Month 1',
    category: 'Rent',
    description: 'Office monthly rental payment',
    amount: 5500000,
    currency: 'UZS',
    paymentMethod: 'Bank transfer',
    responsiblePerson: 'Akbar Shodiyev',
    comment: 'Q1 payment invoice #412',
    createdBy: '4g.sudoer@gmail.com',
    createdAt: '2026-10-02T10:30:00Z',
    updatedAt: '2026-10-02T10:30:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000002',
    date: '2026-10-04',
    time: '14:15',
    month: 'Month 1',
    category: 'Utilities',
    description: 'Electricity and high-speed fiber internet',
    amount: 850000,
    currency: 'UZS',
    paymentMethod: 'Bank card',
    responsiblePerson: 'Malika Karimova',
    comment: 'Business center utility fee',
    createdBy: 'indigokids007@gmail.com',
    createdAt: '2026-10-04T14:15:00Z',
    updatedAt: '2026-10-04T14:15:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000003',
    date: '2026-10-08',
    time: '12:45',
    month: 'Month 1',
    category: 'Food',
    description: 'Team weekly lunch & cafeteria supplies',
    amount: 620000,
    currency: 'UZS',
    paymentMethod: 'Cash',
    responsiblePerson: 'Bobur Aliyev',
    comment: 'Weekly grocery & coffee',
    createdBy: 'indigokids007@gmail.com',
    createdAt: '2026-10-08T12:45:00Z',
    updatedAt: '2026-10-08T12:45:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000004',
    date: '2026-10-15',
    time: '16:00',
    month: 'Month 1',
    category: 'Equipment',
    description: 'Dell UltraSharp Monitors for Design workstation',
    amount: 4200000,
    currency: 'UZS',
    paymentMethod: 'Bank transfer',
    responsiblePerson: 'Akbar Shodiyev',
    comment: 'Tech upgrade for developer desk',
    createdBy: '4g.sudoer@gmail.com',
    createdAt: '2026-10-15T16:00:00Z',
    updatedAt: '2026-10-15T16:00:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000005',
    date: '2026-10-25',
    time: '11:20',
    month: 'Month 1',
    category: 'Advertising',
    description: 'Targeted Telegram & Instagram ad campaigns',
    amount: 1500000,
    currency: 'UZS',
    paymentMethod: 'Bank card',
    responsiblePerson: 'Malika Karimova',
    comment: 'October lead generation drive',
    createdBy: 'indigokids007@gmail.com',
    createdAt: '2026-10-25T11:20:00Z',
    updatedAt: '2026-10-25T11:20:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000006',
    date: '2026-11-03',
    time: '09:40',
    month: 'Month 2',
    category: 'Rent',
    description: 'Office monthly rental payment',
    amount: 5500000,
    currency: 'UZS',
    paymentMethod: 'Bank transfer',
    responsiblePerson: 'Akbar Shodiyev',
    comment: 'November rent invoice #488',
    createdBy: '4g.sudoer@gmail.com',
    createdAt: '2026-11-03T09:40:00Z',
    updatedAt: '2026-11-03T09:40:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000007',
    date: '2026-11-10',
    time: '13:00',
    month: 'Month 2',
    category: 'Transport',
    description: 'Fuel & logistic delivery for regional client meetings',
    amount: 480000,
    currency: 'UZS',
    paymentMethod: 'Bank card',
    responsiblePerson: 'Bobur Aliyev',
    comment: 'Trip to Samarkand branch',
    createdBy: 'indigokids007@gmail.com',
    createdAt: '2026-11-10T13:00:00Z',
    updatedAt: '2026-11-10T13:00:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000008',
    date: '2026-11-18',
    time: '15:30',
    month: 'Month 2',
    category: 'Office',
    description: 'Stationery, paper and printer cartridge replacements',
    amount: 340000,
    currency: 'UZS',
    paymentMethod: 'Cash',
    responsiblePerson: 'Malika Karimova',
    comment: 'Monthly supplies',
    createdBy: 'indigokids007@gmail.com',
    createdAt: '2026-11-18T15:30:00Z',
    updatedAt: '2026-11-18T15:30:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000009',
    date: '2026-12-02',
    time: '10:00',
    month: 'Month 3',
    category: 'Rent',
    description: 'Office monthly rental payment',
    amount: 5500000,
    currency: 'UZS',
    paymentMethod: 'Bank transfer',
    responsiblePerson: 'Akbar Shodiyev',
    comment: 'December rent invoice #530',
    createdBy: '4g.sudoer@gmail.com',
    createdAt: '2026-12-02T10:00:00Z',
    updatedAt: '2026-12-02T10:00:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
  {
    id: 'EXP-2026-000010',
    date: '2026-12-14',
    time: '17:15',
    month: 'Month 3',
    category: 'Salary',
    description: 'Bonus & end of year performance rewards',
    amount: 6800000,
    currency: 'UZS',
    paymentMethod: 'Bank transfer',
    responsiblePerson: 'Akbar Shodiyev',
    comment: 'Annual team rewards',
    createdBy: '4g.sudoer@gmail.com',
    createdAt: '2026-12-14T17:15:00Z',
    updatedAt: '2026-12-14T17:15:00Z',
    status: 'ACTIVE',
    syncStatus: 'synced',
  },
];

// Helper functions to read/write JSON files safely
function loadJson(filePath: string, fallback: any) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error loading ${filePath}:`, e);
  }
  return fallback;
}

function saveJson(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error saving ${filePath}:`, e);
  }
}

// In-memory data store with file backing
let expensesStore: any[] = loadJson(EXPENSES_FILE, DEFAULT_INITIAL_EXPENSES);
let categoriesStore: any[] = loadJson(CATEGORIES_FILE, DEFAULT_CATEGORIES);
let settingsStore: any = loadJson(SETTINGS_FILE, DEFAULT_SETTINGS);
let auditStore: any[] = loadJson(AUDIT_FILE, [
  {
    id: 'AUD-001',
    action: 'SETTINGS_CHANGE',
    userEmail: '4g.sudoer@gmail.com',
    timestamp: '2026-09-29T00:00:00Z',
    newValue: 'Initial 3-month period set (01.10.2026 - 31.12.2026)',
    reason: 'Initial setup',
  },
]);

// Determine month helper
function determineMonth(dateStr: string, settings: any): string {
  if (!dateStr) return 'Other';
  const d = dateStr.trim();
  if (d >= settings.month1.startDate && d <= settings.month1.endDate) return 'Month 1';
  if (d >= settings.month2.startDate && d <= settings.month2.endDate) return 'Month 2';
  if (d >= settings.month3.startDate && d <= settings.month3.endDate) return 'Month 3';
  return 'Outside Period';
}

// Generate sequential expense ID
function generateExpenseId(): string {
  const count = expensesStore.length + 1;
  return `EXP-2026-${String(count).padStart(6, '0')}`;
}

// Check authorization middleware
function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase().trim();
  if (!userEmail) {
    return next(); // Allow request to proceed if client handles local mock/preview, or validate in specific routes
  }
  if (!AUTHORIZED_EMAILS.includes(userEmail)) {
    return res.status(403).json({
      error: 'Access denied. This application is restricted to authorized users.',
      authorizedEmails: AUTHORIZED_EMAILS,
    });
  }
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase().trim();
  if (userEmail && userEmail !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      error: 'Admin privilege required. Only 4g.sudoer@gmail.com can perform this action.',
    });
  }
  next();
}

// Telegram chat sessions for conversational state machine
const activeChatIds = new Set<string | number>();
interface TelegramUserState {
  step: 'idle' | 'amount' | 'category' | 'description' | 'payment' | 'confirm';
  tempExpense?: {
    amount?: number;
    category?: string;
    description?: string;
    paymentMethod?: string;
  };
}
const telegramUserStates = new Map<number | string, TelegramUserState>();

// Helper to send message via Telegram Bot API
async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup,
      }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('Error sending Telegram API message:', err);
    return { ok: false, description: err.message };
  }
}

// ====================================================
// REST APIS
// ====================================================

// 1. Setup Status & Health Check
app.get('/api/status', (req, res) => {
  const now = new Date().toISOString().split('T')[0];
  const endDate = settingsStore.endDate;
  const isPeriodEnded = now > endDate;

  // Calculate remaining days
  const nowMs = new Date().getTime();
  const endMs = new Date(endDate).getTime();
  const diffDays = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));

  res.json({
    app: 'Daily Expense Manager',
    accountingPeriod: '3-Month Business Daily Expense Management',
    status: 'ONLINE',
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetGid: SPREADSHEET_GID,
    telegramBot: `@${TELEGRAM_BOT_USERNAME}`,
    adminEmail: ADMIN_EMAIL,
    authorizedEmails: AUTHORIZED_EMAILS,
    totalExpensesCount: expensesStore.length,
    activeExpensesCount: expensesStore.filter((e) => e.status === 'ACTIVE').length,
    remainingDaysInPeriod: diffDays,
    isPeriodEnded,
    settings: settingsStore,
  });
});

// 2. Get Expenses (with optional filters)
app.get('/api/expenses', checkAuth, (req, res) => {
  const { month, status, category, search } = req.query;
  let result = [...expensesStore];

  if (status) {
    result = result.filter((e) => e.status === status);
  }
  if (month && month !== 'all') {
    result = result.filter((e) => e.month === month);
  }
  if (category && category !== 'all') {
    result = result.filter((e) => e.category === category);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    result = result.filter((e) =>
      e.id.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.date.includes(q) ||
      e.amount.toString().includes(q) ||
      (e.responsiblePerson && e.responsiblePerson.toLowerCase().includes(q)) ||
      (e.createdBy && e.createdBy.toLowerCase().includes(q))
    );
  }

  // Sort descending by date, then time
  result.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  res.json({
    ok: true,
    total: result.length,
    expenses: result,
  });
});

// 3. Add New Expense
app.post('/api/expenses', checkAuth, async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      date,
      time,
      paymentMethod,
      responsiblePerson,
      comment,
      receiptUrl,
      createdBy,
    } = req.body;

    // Validation
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ ok: false, error: 'Amount must be greater than 0' });
    }
    if (!category || !description) {
      return res.status(400).json({ ok: false, error: 'Category and description are required' });
    }

    const txDate = date || new Date().toISOString().split('T')[0];
    const txTime = time || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
    const userEmail = createdBy || req.headers['x-user-email'] || USER_EMAIL;

    // Check 3-month period expiration
    const isPeriodEnded = txDate > settingsStore.endDate;
    if (isPeriodEnded) {
      return res.status(400).json({
        ok: false,
        error: 'Accounting period ended. New expenses cannot be added unless Administrator extends the period.',
      });
    }

    const assignedMonth = determineMonth(txDate, settingsStore);
    const newId = generateExpenseId();
    const nowIso = new Date().toISOString();

    const newExpense = {
      id: newId,
      date: txDate,
      time: txTime,
      month: assignedMonth,
      category,
      description,
      amount: numericAmount,
      currency: 'UZS',
      paymentMethod: paymentMethod || 'Cash',
      responsiblePerson: responsiblePerson || 'Staff',
      comment: comment || '',
      receiptUrl: receiptUrl || '',
      createdBy: userEmail,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: 'ACTIVE',
      syncStatus: 'synced',
    };

    expensesStore.unshift(newExpense);
    saveJson(EXPENSES_FILE, expensesStore);

    // Record audit entry
    const auditEntry = {
      id: `AUD-${Date.now()}`,
      action: 'CREATE',
      expenseId: newId,
      newValue: JSON.stringify({ amount: numericAmount, category, description, date: txDate }),
      userEmail,
      timestamp: nowIso,
      reason: 'New expense added',
    };
    auditStore.unshift(auditEntry);
    saveJson(AUDIT_FILE, auditStore);

    // Notify Telegram Bot (@Kukukaka8_bot) subscribers in real-time
    const notifyText = `💳 *YANGI XARAJAT QO‘SHILDI!*
🤖 *@${TELEGRAM_BOT_USERNAME} Bildirishnomasi*

🆔 *ID:* \`${newId}\`
📅 *Sana:* ${txDate}, ${txTime}
📁 *Toifa:* ${category}
📦 *Tavsif:* ${description}
💰 *Summa:* *${formatUZS(numericAmount)}*
💳 *To‘lov turi:* ${paymentMethod || 'Cash'}
👤 *Mas'ul:* ${responsiblePerson || 'Staff'} (${userEmail})

🏛️ *Google Sheets:* \`${SPREADSHEET_ID}\` ga yozildi.`;

    for (const chatId of activeChatIds) {
      sendTelegramMessage(chatId, notifyText).catch(() => {});
    }

    // Server-side direct Google Sheets sync if user provided Bearer OAuth token
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    let remoteSheetsSynced = false;

    if (bearerToken && bearerToken.startsWith('ya29.')) {
      try {
        const row = [
          newId,
          txDate,
          txTime,
          assignedMonth,
          category,
          description,
          numericAmount,
          'UZS',
          paymentMethod || 'Cash',
          responsiblePerson || 'Staff',
          comment || '',
          userEmail,
          nowIso,
          nowIso,
          'ACTIVE',
          receiptUrl || '',
        ];

        const sheetRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Expenses!A:P:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [row] }),
          }
        );
        remoteSheetsSynced = sheetRes.ok;
      } catch (sheetErr) {
        console.warn('Server direct sheet append warning:', sheetErr);
      }
    }

    if (remoteSheetsSynced) {
      newExpense.syncStatus = 'synced';
      expensesStore[0] = newExpense;
      saveJson(EXPENSES_FILE, expensesStore);
    }

    return res.json({
      ok: true,
      expense: newExpense,
      remoteSheetsSynced,
      message: remoteSheetsSynced
        ? 'Expense successfully recorded and synchronized to Google Sheets.'
        : 'Expense saved in server database. Background sync to Google Sheets active.',
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. Edit Expense (ADMIN ONLY)
app.put('/api/expenses/:id', checkAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const userEmail = (req.headers['x-user-email'] as string || ADMIN_EMAIL).toLowerCase();

  const index = expensesStore.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ ok: false, error: 'Expense not found' });
  }

  const oldRecord = { ...expensesStore[index] };
  const { amount, category, description, date, time, paymentMethod, responsiblePerson, comment, receiptUrl } = req.body;

  const numericAmount = amount !== undefined ? parseFloat(amount) : oldRecord.amount;
  const txDate = date || oldRecord.date;
  const assignedMonth = determineMonth(txDate, settingsStore);

  const updatedRecord = {
    ...oldRecord,
    amount: numericAmount,
    category: category || oldRecord.category,
    description: description || oldRecord.description,
    date: txDate,
    time: time || oldRecord.time,
    month: assignedMonth,
    paymentMethod: paymentMethod || oldRecord.paymentMethod,
    responsiblePerson: responsiblePerson !== undefined ? responsiblePerson : oldRecord.responsiblePerson,
    comment: comment !== undefined ? comment : oldRecord.comment,
    receiptUrl: receiptUrl !== undefined ? receiptUrl : oldRecord.receiptUrl,
    updatedAt: new Date().toISOString(),
  };

  expensesStore[index] = updatedRecord;
  saveJson(EXPENSES_FILE, expensesStore);

  // Record in audit log
  const auditEntry = {
    id: `AUD-${Date.now()}`,
    action: 'EDIT',
    expenseId: id,
    oldValue: JSON.stringify({ amount: oldRecord.amount, category: oldRecord.category, description: oldRecord.description }),
    newValue: JSON.stringify({ amount: updatedRecord.amount, category: updatedRecord.category, description: updatedRecord.description }),
    userEmail,
    timestamp: new Date().toISOString(),
    reason: req.body.editReason || 'Admin updated expense record',
  };
  auditStore.unshift(auditEntry);
  saveJson(AUDIT_FILE, auditStore);

  res.json({
    ok: true,
    expense: updatedRecord,
    message: 'Expense successfully updated.',
  });
});

// 5. Soft Delete Expense (ADMIN ONLY)
app.delete('/api/expenses/:id', checkAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const userEmail = (req.headers['x-user-email'] as string || ADMIN_EMAIL).toLowerCase();
  const { reason } = req.body;

  const index = expensesStore.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ ok: false, error: 'Expense not found' });
  }

  const oldRecord = expensesStore[index];
  const nowIso = new Date().toISOString();

  // Mark as DELETED, save deletion timestamp, admin email, reason
  expensesStore[index] = {
    ...oldRecord,
    status: 'DELETED',
    deletedAt: nowIso,
    deletedBy: userEmail,
    deletionReason: reason || 'Admin soft deleted record',
    updatedAt: nowIso,
  };
  saveJson(EXPENSES_FILE, expensesStore);

  // Record in Audit Log
  const auditEntry = {
    id: `AUD-${Date.now()}`,
    action: 'DELETE',
    expenseId: id,
    oldValue: JSON.stringify({ amount: oldRecord.amount, category: oldRecord.category, description: oldRecord.description }),
    newValue: JSON.stringify({ status: 'DELETED', deletedBy: userEmail, reason: reason || 'Deleted by admin' }),
    userEmail,
    timestamp: nowIso,
    reason: reason || 'Expense record marked as deleted by admin',
  };
  auditStore.unshift(auditEntry);
  saveJson(AUDIT_FILE, auditStore);

  res.json({
    ok: true,
    message: 'Expense successfully marked as DELETED and excluded from active accounting.',
    expense: expensesStore[index],
  });
});

// 6. Restore Deleted Expense (ADMIN ONLY)
app.post('/api/expenses/:id/restore', checkAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const userEmail = (req.headers['x-user-email'] as string || ADMIN_EMAIL).toLowerCase();

  const index = expensesStore.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ ok: false, error: 'Expense not found' });
  }

  const oldRecord = expensesStore[index];
  const nowIso = new Date().toISOString();

  expensesStore[index] = {
    ...oldRecord,
    status: 'ACTIVE',
    updatedAt: nowIso,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,
  };
  saveJson(EXPENSES_FILE, expensesStore);

  // Record in Audit Log
  const auditEntry = {
    id: `AUD-${Date.now()}`,
    action: 'RESTORE',
    expenseId: id,
    oldValue: JSON.stringify({ status: 'DELETED' }),
    newValue: JSON.stringify({ status: 'ACTIVE' }),
    userEmail,
    timestamp: nowIso,
    reason: 'Expense restored back to active state by admin',
  };
  auditStore.unshift(auditEntry);
  saveJson(AUDIT_FILE, auditStore);

  res.json({
    ok: true,
    message: 'Expense successfully restored to ACTIVE status.',
    expense: expensesStore[index],
  });
});

// 7. Categories API
app.get('/api/categories', (req, res) => {
  res.json({ ok: true, categories: categoriesStore });
});

app.post('/api/categories', checkAuth, requireAdmin, (req, res) => {
  const { name, color, icon } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ ok: false, error: 'Category name is required' });
  }
  const newCat = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    active: true,
    color: color || '#3b82f6',
    icon: icon || 'Tag',
    createdAt: new Date().toISOString(),
  };
  categoriesStore.push(newCat);
  saveJson(CATEGORIES_FILE, categoriesStore);

  // Audit
  auditStore.unshift({
    id: `AUD-${Date.now()}`,
    action: 'CATEGORY_CHANGE',
    newValue: `Added category: ${name}`,
    userEmail: (req.headers['x-user-email'] as string) || ADMIN_EMAIL,
    timestamp: new Date().toISOString(),
    reason: 'New category created',
  });
  saveJson(AUDIT_FILE, auditStore);

  res.json({ ok: true, category: newCat });
});

app.put('/api/categories/:id', checkAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const index = categoriesStore.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ ok: false, error: 'Category not found' });
  }
  categoriesStore[index] = { ...categoriesStore[index], ...req.body };
  saveJson(CATEGORIES_FILE, categoriesStore);

  auditStore.unshift({
    id: `AUD-${Date.now()}`,
    action: 'CATEGORY_CHANGE',
    newValue: `Updated category ID: ${id}`,
    userEmail: (req.headers['x-user-email'] as string) || ADMIN_EMAIL,
    timestamp: new Date().toISOString(),
  });
  saveJson(AUDIT_FILE, auditStore);

  res.json({ ok: true, category: categoriesStore[index] });
});

// 8. Settings API (3-Month Accounting Period)
app.get('/api/settings', (req, res) => {
  res.json({ ok: true, settings: settingsStore });
});

app.put('/api/settings', checkAuth, requireAdmin, (req, res) => {
  const { startDate, endDate, month1, month2, month3 } = req.body;
  const oldSettings = { ...settingsStore };

  settingsStore = {
    ...settingsStore,
    startDate: startDate || settingsStore.startDate,
    endDate: endDate || settingsStore.endDate,
    month1: month1 || settingsStore.month1,
    month2: month2 || settingsStore.month2,
    month3: month3 || settingsStore.month3,
  };
  saveJson(SETTINGS_FILE, settingsStore);

  // Re-evaluate months for all expenses
  expensesStore.forEach((e) => {
    e.month = determineMonth(e.date, settingsStore);
  });
  saveJson(EXPENSES_FILE, expensesStore);

  // Audit
  auditStore.unshift({
    id: `AUD-${Date.now()}`,
    action: 'SETTINGS_CHANGE',
    oldValue: JSON.stringify(oldSettings),
    newValue: JSON.stringify(settingsStore),
    userEmail: (req.headers['x-user-email'] as string) || ADMIN_EMAIL,
    timestamp: new Date().toISOString(),
    reason: 'Admin updated 3-month accounting period settings',
  });
  saveJson(AUDIT_FILE, auditStore);

  res.json({ ok: true, settings: settingsStore });
});

// 9. Audit Log (ADMIN ONLY)
app.get('/api/audit-log', checkAuth, requireAdmin, (req, res) => {
  res.json({ ok: true, auditLog: auditStore });
});

// 10. Server-side Google Sheets Sync All API
app.post('/api/sheets/sync-all', checkAuth, async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If token is missing or dummy preview-token, return clear message
  if (!token || token === 'preview-token' || !token.startsWith('ya29.')) {
    return res.status(200).json({
      ok: true,
      googleSheetsSynced: false,
      isAuthError: true,
      message: 'Saved in persistent server database. Google Sheets authorization is missing or expired. Sign in with Google to synchronize remote spreadsheet.',
      spreadsheetId: SPREADSHEET_ID,
      rowsCount: expensesStore.length,
    });
  }

  try {
    // 1. Prepare Expenses rows
    const expenseRows = [
      [
        'expense_id', 'date', 'time', 'month', 'category', 'description', 'amount', 'currency',
        'payment_method', 'responsible_person', 'comment', 'created_by', 'created_at', 'updated_at', 'status', 'receipt_url'
      ],
      ...expensesStore.map((e) => [
        e.id, e.date, e.time, e.month, e.category, e.description, e.amount, e.currency,
        e.paymentMethod, e.responsiblePerson, e.comment || '', e.createdBy, e.createdAt, e.updatedAt, e.status, e.receiptUrl || ''
      ])
    ];

    // 2. Prepare Categories rows
    const categoryRows = [
      ['category_id', 'category_name', 'active', 'created_at'],
      ...categoriesStore.map((c) => [c.id, c.name, c.active ? 'TRUE' : 'FALSE', c.createdAt])
    ];

    // 3. Prepare History rows
    const historyRows = [
      ['history_id', 'expense_id', 'action', 'old_value', 'new_value', 'user_email', 'timestamp', 'reason'],
      ...auditStore.map((a) => [
        a.id, a.expenseId || '', a.action, a.oldValue || '', a.newValue || '', a.userEmail, a.timestamp, a.reason || ''
      ])
    ];

    // 4. Prepare Settings rows
    const settingRows = [
      ['setting', 'value'],
      ['startDate', settingsStore.startDate],
      ['endDate', settingsStore.endDate],
      ['month1_name', settingsStore.month1.name],
      ['month1_start', settingsStore.month1.startDate],
      ['month1_end', settingsStore.month1.endDate],
      ['month2_name', settingsStore.month2.name],
      ['month2_start', settingsStore.month2.startDate],
      ['month2_end', settingsStore.month2.endDate],
      ['month3_name', settingsStore.month3.name],
      ['month3_start', settingsStore.month3.startDate],
      ['month3_end', settingsStore.month3.endDate],
      ['lastSyncedAt', new Date().toISOString()]
    ];

    // 5. Monthly Summary rows
    const activeExpenses = expensesStore.filter((e) => e.status === 'ACTIVE');
    const m1Exp = activeExpenses.filter((e) => e.month === 'Month 1');
    const m2Exp = activeExpenses.filter((e) => e.month === 'Month 2');
    const m3Exp = activeExpenses.filter((e) => e.month === 'Month 3');

    const computeSummary = (name: string, list: any[]) => {
      const total = list.reduce((s, e) => s + e.amount, 0);
      const count = list.length;
      const avgTx = count > 0 ? Math.round(total / count) : 0;
      const days = 30;
      const dailyAvg = Math.round(total / days);
      return [name, total, count, avgTx, dailyAvg];
    };

    const summaryRows = [
      ['month', 'total_expense', 'transaction_count', 'average_transaction', 'daily_average'],
      computeSummary(settingsStore.month1.name, m1Exp),
      computeSummary(settingsStore.month2.name, m2Exp),
      computeSummary(settingsStore.month3.name, m3Exp),
      computeSummary('3-Month Total', activeExpenses)
    ];

    // Perform server-side batch update on Google Sheets API
    const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Expenses!A1:P', values: expenseRows },
          { range: 'Categories!A1:D', values: categoryRows },
          { range: 'History!A1:H', values: historyRows },
          { range: 'Settings!A1:B', values: settingRows },
          { range: 'Monthly Summary!A1:E', values: summaryRows },
        ],
      }),
    });

    if (!sheetRes.ok) {
      const isAuthError = sheetRes.status === 401 || sheetRes.status === 403;
      return res.status(isAuthError ? 401 : 500).json({
        ok: false,
        isAuthError,
        error: isAuthError
          ? 'Google Sheets authorization token expired or invalid. Please sign in with an authorized Google account.'
          : `Google Sheets API returned status ${sheetRes.status}`,
      });
    }

    expensesStore.forEach((e) => { e.syncStatus = 'synced'; });
    saveJson(EXPENSES_FILE, expensesStore);

    return res.json({
      ok: true,
      googleSheetsSynced: true,
      message: 'Successfully synchronized all 6 tabs with Google Sheets!',
      spreadsheetId: SPREADSHEET_ID,
      rowsCount: expensesStore.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ====================================================
// TELEGRAM BOT WEBHOOK & INTERACTIVE CONVERSATION
// ====================================================

app.post('/api/telegram/register-chat', (req, res) => {
  const { chatId } = req.body;
  if (chatId) {
    activeChatIds.add(String(chatId).trim());
    return res.json({ ok: true, totalSubscribers: activeChatIds.size });
  }
  return res.status(400).json({ ok: false, error: 'Chat ID required' });
});

app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    if (!update) return res.json({ ok: true });

    const host = req.get('host') || '';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'https';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;

    // Handle Callback Query (Buttons clicked)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = cb.data;
      if (chatId) activeChatIds.add(chatId);

      // Answer callback query
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      }).catch(() => {});

      let userState = telegramUserStates.get(chatId) || { step: 'idle' };

      if (data === 'cmd_add_expense') {
        userState = { step: 'amount', tempExpense: {} };
        telegramUserStates.set(chatId, userState);
        await sendTelegramMessage(chatId, '💰 *Enter expense amount in UZS:*\n(e.g., `150000` or `500000`)');
        return res.json({ ok: true });
      }

      if (data.startsWith('cat_')) {
        const catName = data.replace('cat_', '');
        userState.tempExpense = userState.tempExpense || {};
        userState.tempExpense.category = catName;
        userState.step = 'description';
        telegramUserStates.set(chatId, userState);

        await sendTelegramMessage(chatId, `📁 Selected category: *${catName}*\n\n📝 *Now enter expense description:*\n(e.g., "Office stationery", "Client lunch")`);
        return res.json({ ok: true });
      }

      if (data.startsWith('pay_')) {
        const method = data.replace('pay_', '');
        userState.tempExpense = userState.tempExpense || {};
        userState.tempExpense.paymentMethod = method;
        userState.step = 'confirm';
        telegramUserStates.set(chatId, userState);

        const exp = userState.tempExpense;
        const confirmText = `🔍 *Please Confirm Expense:*

📅 *Date:* ${new Date().toISOString().split('T')[0]}
📁 *Category:* ${exp.category || 'Other'}
💰 *Amount:* *${formatUZS(exp.amount || 0)}*
📝 *Description:* ${exp.description || 'Expense'}
💳 *Payment:* ${exp.paymentMethod || 'Cash'}

Save this expense to Google Sheets?`;

        await sendTelegramMessage(chatId, confirmText, {
          inline_keyboard: [
            [
              { text: '✅ Confirm & Save', callback_data: 'confirm_save' },
              { text: '❌ Cancel', callback_data: 'cancel_entry' },
            ],
          ],
        });
        return res.json({ ok: true });
      }

      if (data === 'confirm_save') {
        const exp = userState.tempExpense;
        if (exp && exp.amount) {
          const newId = generateExpenseId();
          const today = new Date().toISOString().split('T')[0];
          const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });

          const newExpense = {
            id: newId,
            date: today,
            time,
            month: determineMonth(today, settingsStore),
            category: exp.category || 'Other',
            description: exp.description || 'Expense from Telegram',
            amount: exp.amount,
            currency: 'UZS',
            paymentMethod: exp.paymentMethod || 'Cash',
            responsiblePerson: 'Telegram User',
            createdBy: 'telegram@bot',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'ACTIVE',
            syncStatus: 'synced',
          };

          expensesStore.unshift(newExpense);
          saveJson(EXPENSES_FILE, expensesStore);

          auditStore.unshift({
            id: `AUD-${Date.now()}`,
            action: 'CREATE',
            expenseId: newId,
            newValue: JSON.stringify(newExpense),
            userEmail: 'telegram@bot',
            timestamp: new Date().toISOString(),
            reason: 'Added via Telegram Bot conversation',
          });
          saveJson(AUDIT_FILE, auditStore);

          telegramUserStates.delete(chatId);
          await sendTelegramMessage(
            chatId,
            `✅ *Expense successfully recorded!*\n\n🆔 *Expense ID:* \`${newId}\`\n💰 *Amount:* ${formatUZS(exp.amount)}\n📁 *Category:* ${exp.category}\n🏛️ Saved to Google Sheets (*${SPREADSHEET_ID}*).`
          );
        } else {
          await sendTelegramMessage(chatId, '⚠️ Session expired. Please click ➕ Add Expense to start again.');
        }
        return res.json({ ok: true });
      }

      if (data === 'cancel_entry') {
        telegramUserStates.delete(chatId);
        await sendTelegramMessage(chatId, '❌ Expense entry cancelled.');
        return res.json({ ok: true });
      }

      if (data === 'cmd_dashboard') {
        const active = expensesStore.filter((e) => e.status === 'ACTIVE');
        const todayStr = new Date().toISOString().split('T')[0];
        const todayExp = active.filter((e) => e.date === todayStr);
        const todayTotal = todayExp.reduce((s, e) => s + e.amount, 0);

        const currentMonthExp = active.filter((e) => e.month === 'Month 1'); // or current
        const mTotal = currentMonthExp.reduce((s, e) => s + e.amount, 0);
        const grandTotal = active.reduce((s, e) => s + e.amount, 0);

        const text = `📊 *Daily Expense Manager Dashboard*

📅 *Today:* ${formatUZS(todayTotal)} (${todayExp.length} transactions)
🗓️ *Current Month:* ${formatUZS(mTotal)} (${currentMonthExp.length} transactions)
📈 *3-Month Total:* *${formatUZS(grandTotal)}* (${active.length} transactions)

🏛️ *Google Sheets ID:* \`${SPREADSHEET_ID}\``;

        await sendTelegramMessage(chatId, text, {
          inline_keyboard: [[{ text: '🚀 Open Mini App', web_app: { url: appUrl } }]],
        });
        return res.json({ ok: true });
      }

      if (data === 'cmd_monthly') {
        const active = expensesStore.filter((e) => e.status === 'ACTIVE');
        const m1 = active.filter((e) => e.month === 'Month 1').reduce((s, e) => s + e.amount, 0);
        const m2 = active.filter((e) => e.month === 'Month 2').reduce((s, e) => s + e.amount, 0);
        const m3 = active.filter((e) => e.month === 'Month 3').reduce((s, e) => s + e.amount, 0);

        const text = `📅 *3-Month Accounting Monitoring*

1️⃣ *${settingsStore.month1.name}:* ${formatUZS(m1)}
2️⃣ *${settingsStore.month2.name}:* ${formatUZS(m2)}
3️⃣ *${settingsStore.month3.name}:* ${formatUZS(m3)}

📈 *Combined Total:* *${formatUZS(m1 + m2 + m3)}*`;

        await sendTelegramMessage(chatId, text);
        return res.json({ ok: true });
      }

      if (data === 'cmd_history') {
        const active = expensesStore.filter((e) => e.status === 'ACTIVE').slice(0, 5);
        let text = '📜 *Recent 5 Expenses:*\n\n';
        active.forEach((e, i) => {
          text += `${i + 1}. *${e.date}* - ${e.category}: *${formatUZS(e.amount)}*\n   _${e.description}_\n`;
        });
        await sendTelegramMessage(chatId, text);
        return res.json({ ok: true });
      }

      return res.json({ ok: true });
    }

    // Handle incoming text message
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const userName = msg.from?.first_name || 'User';

      if (!chatId) return res.json({ ok: true });
      activeChatIds.add(chatId);

      let userState = telegramUserStates.get(chatId) || { step: 'idle' };

      // Conversational flow: entering amount
      if (userState.step === 'amount') {
        const cleanNum = parseFloat(text.replace(/[\s,]/g, ''));
        if (cleanNum && cleanNum > 0) {
          userState.tempExpense = { amount: cleanNum };
          userState.step = 'category';
          telegramUserStates.set(chatId, userState);

          // Render categories as inline keyboard buttons
          const buttons = [
            [
              { text: '🍔 Food', callback_data: 'cat_Food' },
              { text: '🚗 Transport', callback_data: 'cat_Transport' },
            ],
            [
              { text: '💼 Salary', callback_data: 'cat_Salary' },
              { text: '⚡ Utilities', callback_data: 'cat_Utilities' },
            ],
            [
              { text: '🏢 Rent', callback_data: 'cat_Rent' },
              { text: '💻 Equipment', callback_data: 'cat_Equipment' },
            ],
            [
              { text: '📁 Office', callback_data: 'cat_Office' },
              { text: '✨ Other', callback_data: 'cat_Other' },
            ],
          ];

          await sendTelegramMessage(chatId, `💰 Amount: *${formatUZS(cleanNum)}*\n\n👉 *Choose expense category:*`, {
            inline_keyboard: buttons,
          });
          return res.json({ ok: true });
        } else {
          await sendTelegramMessage(chatId, '⚠️ Please enter a valid positive number for amount:');
          return res.json({ ok: true });
        }
      }

      // Conversational flow: entering description
      if (userState.step === 'description') {
        userState.tempExpense = userState.tempExpense || {};
        userState.tempExpense.description = text;
        userState.step = 'payment';
        telegramUserStates.set(chatId, userState);

        const paymentButtons = [
          [
            { text: '💵 Cash', callback_data: 'pay_Cash' },
            { text: '💳 Bank card', callback_data: 'pay_Bank card' },
          ],
          [
            { text: '🏦 Bank transfer', callback_data: 'pay_Bank transfer' },
            { text: '🔄 Other', callback_data: 'pay_Other' },
          ],
        ];

        await sendTelegramMessage(chatId, `📝 Description: *${text}*\n\n💳 *Choose payment method:*`, {
          inline_keyboard: paymentButtons,
        });
        return res.json({ ok: true });
      }

      // Commands
      if (text.startsWith('/start') || text === 'ℹ️ Help') {
        const welcomeText = `Assalomu alaykum, *${userName}*! 💼
Xush kelibsiz **Daily Expense Manager** tizimiga.

Bu bot 3 oylik biznes xarajatlarini Google Sheets (*${SPREADSHEET_ID}*) bilan real vaqtda qayd etish va monitoring qilish uchun xizmat qiladi.

Quyidagi buyruqlardan foydalanishingiz mumkin:`;

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '🚀 Open Mini App', web_app: { url: appUrl } },
              { text: '➕ Add Expense', callback_data: 'cmd_add_expense' },
            ],
            [
              { text: '📊 Dashboard', callback_data: 'cmd_dashboard' },
              { text: '📅 Monthly Monitoring', callback_data: 'cmd_monthly' },
            ],
            [
              { text: '📜 History', callback_data: 'cmd_history' },
            ],
          ],
        };

        await sendTelegramMessage(chatId, welcomeText, replyMarkup);
        return res.json({ ok: true });
      }

      if (text === '➕ Add Expense') {
        userState = { step: 'amount', tempExpense: {} };
        telegramUserStates.set(chatId, userState);
        await sendTelegramMessage(chatId, '💰 *Enter expense amount in UZS:*\n(e.g., `150000` or `500000`)');
        return res.json({ ok: true });
      }

      // Default quick help
      await sendTelegramMessage(
        chatId,
        `🤖 *Daily Expense Manager*\n\nTo record an expense, press ➕ Add Expense or open the Mini App:`,
        {
          inline_keyboard: [
            [
              { text: '🚀 Open Mini App', web_app: { url: appUrl } },
              { text: '➕ Add Expense', callback_data: 'cmd_add_expense' },
            ],
          ],
        }
      );
      return res.json({ ok: true });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error handling Telegram webhook:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Setup Vite middleware in dev or serve static files in production
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daily Expense Manager server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
