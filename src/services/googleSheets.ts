import { Transaction, RecurringBill, SavingsGoal } from '../types';
import { getTransactionTimeString } from '../utils/csvExport';

export interface GoogleSheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  lastSyncedAt?: string;
  rowsCount?: number;
}

/**
 * Creates a dedicated "Sarhisob Moliya" Google Sheet and populates it with headers and data.
 * Structure: Tovar nomi, Miqdori, Summasi, Vaqti, Kuni, Kim kiritdi (Users) va Jamlangan xulosa.
 */
export async function createAndPopulateSpreadsheet(
  accessToken: string,
  title: string,
  transactions: Transaction[],
  recurringBills: RecurringBill[],
  goals: SavingsGoal[],
  balance: number
): Promise<GoogleSheetMetadata> {
  // 1. Create spreadsheet with multiple sheets
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `Sarhisob Moliya & Tovar Hisoboti - ${new Date().toLocaleDateString('uz-UZ')}`,
      },
      sheets: [
        {
          properties: {
            title: 'Tovarlar va Amaliyotlar',
            gridProperties: { rowCount: 1000, columnCount: 11, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Jamlangan Xulosa va Users',
            gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errData = await createResponse.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Google Sheets yaratishda xatolik: ${createResponse.status}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Prepare transaction rows with Tovar nomi, Miqdori, Summasi, Vaqti, Kim kiritdi
  const transactionRows = [
    [
      '№',
      'Tovar nomi',
      'Miqdori',
      "Summasi (so'm)",
      'Vaqti (Soat)',
      'Kuni (Sana)',
      'Turi',
      'Toifa',
      'Kim kiritdi (Foydalanuvchi)',
      'Foydalanuvchi Emaili',
      'Tranzaksiya ID'
    ],
    ...transactions.map((t, index) => [
      index + 1,
      t.itemName || t.description,
      t.quantity || '1 dona',
      t.amount,
      getTransactionTimeString(t),
      t.date,
      t.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)',
      t.category,
      t.createdBy?.name || 'Mehmon foydalanuvchi',
      t.createdBy?.email || '-',
      t.id,
    ]),
  ];

  // 3. Write Transactions to 'Tovarlar va Amaliyotlar' (Columns A to K)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Tovarlar va Amaliyotlar'!A1:K${transactionRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: transactionRows,
      }),
    }
  );

  // 4. Calculate Aggregate Summary by Users
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Group by users
  const userStats: Record<string, { name: string; email: string; count: number; income: number; expense: number }> = {};
  transactions.forEach((tx) => {
    const email = tx.createdBy?.email || 'Noma\'lum';
    const name = tx.createdBy?.name || 'Mehmon';
    if (!userStats[email]) {
      userStats[email] = { name, email, count: 0, income: 0, expense: 0 };
    }
    userStats[email].count += 1;
    if (tx.type === 'income') userStats[email].income += tx.amount;
    else userStats[email].expense += tx.amount;
  });

  const summaryRows = [
    ["UMUMIY MOLIYAVIY JAMLANMA", '', ''],
    ["Ko'rsatkich", 'Qiymat', 'Izoh'],
    ['Joriy Balans', balance, "So'nggi sinxronlash: " + new Date().toLocaleString('uz-UZ')],
    ['Jami Kirim Summasi', totalIncome, 'Barcha tushumlar jamlanmasi'],
    ['Jami Chiqim Summasi', totalExpense, 'Barcha xarajatlar jamlanmasi'],
    ['Sof Saldo (Kirim - Chiqim)', totalIncome - totalExpense, 'Sof qoldiq'],
    ['Jami Amaliyotlar va Tovarlar soni', transactions.length, 'Daftardagi jami yozuvlar'],
    ['Doimiy Majburiyatlar soni', recurringBills.length, 'Oylik doimiy to\'lovlar'],
    ['Jamg\'arma Maqsadlari soni', goals.length, 'Faol maqsadlar'],
    ['', '', ''],
    ["FOYDALANUVCHILAR (USERS) BO'YICHA JAMLANMA HISOBOT", '', ''],
    ['Foydalanuvchi Nomi', 'Email', 'Kiritgan tovarlar soni', 'Kiritgan Kirim (so\'m)', 'Kiritgan Chiqim (so\'m)', 'Sof hissasi'],
    ...Object.values(userStats).map((u) => [
      u.name,
      u.email,
      u.count,
      u.income,
      u.expense,
      u.income - u.expense,
    ]),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Jamlangan Xulosa va Users'!A1:F${summaryRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: summaryRows,
      }),
    }
  );

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: sheetData.properties.title,
    lastSyncedAt: new Date().toISOString(),
    rowsCount: transactions.length,
  };
}

/**
 * Appends a single new transaction into an existing Google Sheet
 */
export async function appendTransactionToSheet(
  accessToken: string,
  spreadsheetId: string,
  transaction: Transaction,
  nextIndex = 1
): Promise<boolean> {
  const row = [
    nextIndex,
    transaction.itemName || transaction.description,
    transaction.quantity || '1 dona',
    transaction.amount,
    getTransactionTimeString(transaction),
    transaction.date,
    transaction.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)',
    transaction.category,
    transaction.createdBy?.name || 'Mehmon foydalanuvchi',
    transaction.createdBy?.email || '-',
    transaction.id,
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Tovarlar va Amaliyotlar'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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

  return response.ok;
}

/**
 * Syncs full data to an existing Google Sheet (re-writes sheets with Tovar, Users & Summary)
 */
export async function syncToExistingSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[],
  recurringBills: RecurringBill[],
  goals: SavingsGoal[],
  balance: number
): Promise<boolean> {
  // Clear and rewrite 'Tovarlar va Amaliyotlar' (Columns A through K)
  const transactionRows = [
    [
      '№',
      'Tovar nomi',
      'Miqdori',
      "Summasi (so'm)",
      'Vaqti (Soat)',
      'Kuni (Sana)',
      'Turi',
      'Toifa',
      'Kim kiritdi (Foydalanuvchi)',
      'Foydalanuvchi Emaili',
      'Tranzaksiya ID'
    ],
    ...transactions.map((t, index) => [
      index + 1,
      t.itemName || t.description,
      t.quantity || '1 dona',
      t.amount,
      getTransactionTimeString(t),
      t.date,
      t.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)',
      t.category,
      t.createdBy?.name || 'Mehmon foydalanuvchi',
      t.createdBy?.email || '-',
      t.id,
    ]),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Tovarlar va Amaliyotlar'!A1:K${Math.max(transactionRows.length + 20, 100)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const res1 = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Tovarlar va Amaliyotlar'!A1:K${transactionRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: transactionRows,
      }),
    }
  );

  // Update summary sheet as well
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const userStats: Record<string, { name: string; email: string; count: number; income: number; expense: number }> = {};
  transactions.forEach((tx) => {
    const email = tx.createdBy?.email || 'Noma\'lum';
    const name = tx.createdBy?.name || 'Mehmon';
    if (!userStats[email]) {
      userStats[email] = { name, email, count: 0, income: 0, expense: 0 };
    }
    userStats[email].count += 1;
    if (tx.type === 'income') userStats[email].income += tx.amount;
    else userStats[email].expense += tx.amount;
  });

  const summaryRows = [
    ["UMUMIY MOLIYAVIY JAMLANMA", '', ''],
    ["Ko'rsatkich", 'Qiymat', 'Izoh'],
    ['Joriy Balans', balance, "So'nggi sinxronlash: " + new Date().toLocaleString('uz-UZ')],
    ['Jami Kirim Summasi', totalIncome, 'Barcha tushumlar jamlanmasi'],
    ['Jami Chiqim Summasi', totalExpense, 'Barcha xarajatlar jamlanmasi'],
    ['Sof Saldo (Kirim - Chiqim)', totalIncome - totalExpense, 'Sof qoldiq'],
    ['Jami Amaliyotlar va Tovarlar soni', transactions.length, 'Daftardagi jami yozuvlar'],
    ['Doimiy Majburiyatlar soni', recurringBills.length, 'Oylik doimiy to\'lovlar'],
    ['Jamg\'arma Maqsadlari soni', goals.length, 'Faol maqsadlar'],
    ['', '', ''],
    ["FOYDALANUVCHILAR (USERS) BO'YICHA JAMLANMA HISOBOT", '', ''],
    ['Foydalanuvchi Nomi', 'Email', 'Kiritgan tovarlar soni', 'Kiritgan Kirim (so\'m)', 'Kiritgan Chiqim (so\'m)', 'Sof hissasi'],
    ...Object.values(userStats).map((u) => [
      u.name,
      u.email,
      u.count,
      u.income,
      u.expense,
      u.income - u.expense,
    ]),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Jamlangan Xulosa va Users'!A1:F${summaryRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: summaryRows,
      }),
    }
  );

  return res1.ok;
}
