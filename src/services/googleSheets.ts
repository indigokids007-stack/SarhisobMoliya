import { Expense, Category, AuditLogEntry, MonthlySummary, ThreeMonthPeriodSettings, SPREADSHEET_ID } from '../types';

export interface SheetsConnectionStatus {
  connected: boolean;
  spreadsheetId: string;
  tabsFound: string[];
  missingTabs: string[];
  totalExpensesCount: number;
  lastCheckedAt: string;
  error?: string;
}

const REQUIRED_TABS = [
  'Expenses',
  'Categories',
  'Monthly Summary',
  'History',
  'Users',
  'Settings',
] as const;

export const EXPENSES_COLUMNS = [
  'expense_id',
  'date',
  'time',
  'month',
  'category',
  'description',
  'amount',
  'currency',
  'payment_method',
  'responsible_person',
  'comment',
  'created_by',
  'created_at',
  'updated_at',
  'status',
  'receipt_url',
];

export const CATEGORIES_COLUMNS = [
  'category_id',
  'category_name',
  'active',
  'created_at',
];

export const SUMMARY_COLUMNS = [
  'month',
  'total_expense',
  'transaction_count',
  'average_transaction',
  'daily_average',
];

export const HISTORY_COLUMNS = [
  'history_id',
  'expense_id',
  'action',
  'old_value',
  'new_value',
  'user_email',
  'timestamp',
  'reason',
];

export const USERS_COLUMNS = [
  'email',
  'role',
  'active',
];

export const SETTINGS_COLUMNS = [
  'setting',
  'value',
];

/**
 * Validates connection and initializes missing tabs on Google Sheets
 */
export async function initializeAndCheckSpreadsheet(accessToken: string): Promise<SheetsConnectionStatus> {
  if (!accessToken || accessToken === 'preview-token') {
    return {
      connected: true,
      spreadsheetId: SPREADSHEET_ID,
      tabsFound: [...REQUIRED_TABS],
      missingTabs: [],
      totalExpensesCount: 10,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  try {
    // 1. Fetch spreadsheet metadata
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!metaRes.ok) {
      const err = await metaRes.json().catch(() => ({}));
      return {
        connected: false,
        spreadsheetId: SPREADSHEET_ID,
        tabsFound: [],
        missingTabs: [...REQUIRED_TABS],
        totalExpensesCount: 0,
        lastCheckedAt: new Date().toISOString(),
        error: err.error?.message || `HTTP ${metaRes.status}: Google Sheets API ga ulanib bo'lmadi`,
      };
    }

    const metaData = await metaRes.json();
    const existingTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties?.title);
    const missing = REQUIRED_TABS.filter((t) => !existingTitles.includes(t));

    // 2. If there are missing tabs, create them
    if (missing.length > 0) {
      const requests = missing.map((title) => ({
        addSheet: {
          properties: { title },
        },
      }));

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      // Write initial headers for each newly created tab
      const headerUpdates = [];
      if (missing.includes('Expenses')) headerUpdates.push({ range: 'Expenses!A1:P1', values: [EXPENSES_COLUMNS] });
      if (missing.includes('Categories')) headerUpdates.push({ range: 'Categories!A1:D1', values: [CATEGORIES_COLUMNS] });
      if (missing.includes('Monthly Summary')) headerUpdates.push({ range: 'Monthly Summary!A1:E1', values: [SUMMARY_COLUMNS] });
      if (missing.includes('History')) headerUpdates.push({ range: 'History!A1:H1', values: [HISTORY_COLUMNS] });
      if (missing.includes('Users')) headerUpdates.push({ range: 'Users!A1:C1', values: [USERS_COLUMNS] });
      if (missing.includes('Settings')) headerUpdates.push({ range: 'Settings!A1:B1', values: [SETTINGS_COLUMNS] });

      if (headerUpdates.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valueInputOption: 'RAW',
            data: headerUpdates,
          }),
        });
      }
    }

    // Check count of rows in Expenses
    const expRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Expenses!A2:A`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let count = 0;
    if (expRes.ok) {
      const expData = await expRes.json();
      count = expData.values?.length || 0;
    }

    return {
      connected: true,
      spreadsheetId: SPREADSHEET_ID,
      tabsFound: [...REQUIRED_TABS],
      missingTabs: [],
      totalExpensesCount: count,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      connected: false,
      spreadsheetId: SPREADSHEET_ID,
      tabsFound: [],
      missingTabs: [...REQUIRED_TABS],
      totalExpensesCount: 0,
      lastCheckedAt: new Date().toISOString(),
      error: err.message,
    };
  }
}

/**
 * Read all expenses from Google Sheets Expenses tab
 */
export async function fetchExpensesFromSheets(accessToken: string): Promise<Expense[]> {
  if (!accessToken || accessToken === 'preview-token') {
    return [];
  }

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Expenses!A2:P`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const rows = data.values || [];

    return rows.map((row: string[]): Expense => ({
      id: row[0] || `EXP-${Date.now()}`,
      date: row[1] || new Date().toISOString().split('T')[0],
      time: row[2] || '12:00',
      month: row[3] || 'Month 1',
      category: row[4] || 'Other',
      description: row[5] || '',
      amount: parseFloat(row[6] || '0') || 0,
      currency: 'UZS',
      paymentMethod: (row[8] as any) || 'Cash',
      responsiblePerson: row[9] || '',
      comment: row[10] || '',
      createdBy: row[11] || '',
      createdAt: row[12] || new Date().toISOString(),
      updatedAt: row[13] || new Date().toISOString(),
      status: (row[14] as any) === 'DELETED' ? 'DELETED' : 'ACTIVE',
      receiptUrl: row[15] || '',
      syncStatus: 'synced',
    }));
  } catch (err) {
    console.warn('Failed to fetch from sheets directly:', err);
    return [];
  }
}

/**
 * Appends a new expense to Google Sheets
 */
export async function appendExpenseToSheets(accessToken: string, expense: Expense): Promise<boolean> {
  if (!accessToken || accessToken === 'preview-token') {
    return true; // saved locally
  }

  try {
    const row = [
      expense.id,
      expense.date,
      expense.time,
      expense.month,
      expense.category,
      expense.description,
      expense.amount,
      expense.currency,
      expense.paymentMethod,
      expense.responsiblePerson,
      expense.comment || '',
      expense.createdBy,
      expense.createdAt,
      expense.updatedAt,
      expense.status,
      expense.receiptUrl || '',
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Expenses!A:P:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    // Also record in History tab
    const historyRow = [
      `HIST-${Date.now()}`,
      expense.id,
      'CREATE',
      '',
      JSON.stringify({ amount: expense.amount, category: expense.category, description: expense.description }),
      expense.createdBy,
      new Date().toISOString(),
      'New expense added',
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/History!A:H:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [historyRow],
        }),
      }
    ).catch(() => {});

    return res.ok;
  } catch (err) {
    console.error('Error appending to Google Sheets:', err);
    return false;
  }
}

/**
 * Synchronize full batch to Google Sheets
 */
export async function batchSyncAllToSheets(
  accessToken: string,
  expenses: Expense[],
  categories: Category[],
  settings: ThreeMonthPeriodSettings,
  auditLog: AuditLogEntry[]
): Promise<boolean> {
  if (!accessToken || accessToken === 'preview-token') {
    return true;
  }

  try {
    // 1. Prepare Expenses rows
    const expenseRows = [
      EXPENSES_COLUMNS,
      ...expenses.map((e) => [
        e.id,
        e.date,
        e.time,
        e.month,
        e.category,
        e.description,
        e.amount,
        e.currency,
        e.paymentMethod,
        e.responsiblePerson,
        e.comment || '',
        e.createdBy,
        e.createdAt,
        e.updatedAt,
        e.status,
        e.receiptUrl || '',
      ]),
    ];

    // 2. Prepare Categories rows
    const categoryRows = [
      CATEGORIES_COLUMNS,
      ...categories.map((c) => [c.id, c.name, c.active ? 'TRUE' : 'FALSE', c.createdAt]),
    ];

    // 3. Prepare History rows
    const historyRows = [
      HISTORY_COLUMNS,
      ...auditLog.map((a) => [
        a.id,
        a.expenseId || '',
        a.action,
        a.oldValue || '',
        a.newValue || '',
        a.userEmail,
        a.timestamp,
        a.reason || '',
      ]),
    ];

    // 4. Prepare Settings rows
    const settingRows = [
      SETTINGS_COLUMNS,
      ['startDate', settings.startDate],
      ['endDate', settings.endDate],
      ['month1_name', settings.month1.name],
      ['month1_start', settings.month1.startDate],
      ['month1_end', settings.month1.endDate],
      ['month2_name', settings.month2.name],
      ['month2_start', settings.month2.startDate],
      ['month2_end', settings.month2.endDate],
      ['month3_name', settings.month3.name],
      ['month3_start', settings.month3.startDate],
      ['month3_end', settings.month3.endDate],
      ['lastSyncedAt', new Date().toISOString()],
    ];

    // 5. Monthly Summary rows
    const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');
    const m1Exp = activeExpenses.filter((e) => e.month === 'Month 1');
    const m2Exp = activeExpenses.filter((e) => e.month === 'Month 2');
    const m3Exp = activeExpenses.filter((e) => e.month === 'Month 3');

    const computeSummary = (name: string, list: Expense[]) => {
      const total = list.reduce((s, e) => s + e.amount, 0);
      const count = list.length;
      const avgTx = count > 0 ? Math.round(total / count) : 0;
      const days = 30; // standard month span
      const dailyAvg = Math.round(total / days);
      return [name, total, count, avgTx, dailyAvg];
    };

    const summaryRows = [
      SUMMARY_COLUMNS,
      computeSummary(settings.month1.name, m1Exp),
      computeSummary(settings.month2.name, m2Exp),
      computeSummary(settings.month3.name, m3Exp),
      computeSummary('3-Month Total', activeExpenses),
    ];

    const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

    return batchRes.ok;
  } catch (err) {
    console.error('Batch sync error:', err);
    return false;
  }
}

// Backward-compatible types and methods
export interface GoogleSheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  lastSyncedAt?: string;
  rowsCount?: number;
}

export async function createAndPopulateSpreadsheet(
  accessToken: string,
  title: string,
  transactions: any[],
  recurringBills: any[],
  goals: any[],
  balance: number
): Promise<GoogleSheetMetadata> {
  return {
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    title: title || 'Daily Expense Manager',
    lastSyncedAt: new Date().toISOString(),
    rowsCount: transactions.length,
  };
}

export async function syncToExistingSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: any[],
  recurringBills: any[],
  goals: any[],
  balance: number
): Promise<boolean> {
  return true;
}
