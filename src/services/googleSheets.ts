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
 * Every transaction strictly includes both Date (Kuni) and Time (Vaqti) columns.
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
        title: title || `Sarhisob Moliya Hisoboti - ${new Date().toLocaleDateString('uz-UZ')}`,
      },
      sheets: [
        {
          properties: {
            title: 'Tranzaksiyalar',
            gridProperties: { rowCount: 1000, columnCount: 8, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Umumiy Xulosa',
            gridProperties: { rowCount: 100, columnCount: 4, frozenRowCount: 1 },
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

  // 2. Prepare transaction rows with both Date AND Time clearly visible
  const transactionRows = [
    ['Kuni (Sana)', 'Vaqti (Soat)', 'Turi', 'Toifa', "Miqdor (so'm)", 'Izoh', "To'lov usuli", 'ID'],
    ...transactions.map((t) => [
      t.date,
      getTransactionTimeString(t),
      t.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)',
      t.category,
      t.amount,
      t.description || '',
      t.paymentMethod || 'Humo/Uzcard',
      t.id,
    ]),
  ];

  // 3. Write Transactions (Columns A to H)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tranzaksiyalar!A1:H${transactionRows.length}?valueInputOption=USER_ENTERED`,
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

  // 4. Summary rows
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const summaryRows = [
    ["Ko'rsatkich", 'Qiymat', 'Qo\'shimcha ma\'lumot'],
    ['Joriy Balans', balance, "So'nggi yangilanish vaqti: " + new Date().toLocaleString('uz-UZ')],
    ['Jami Daromad', totalIncome, 'Tranzaksiyalar bo\'yicha jami kirim'],
    ['Jami Xarajat', totalExpense, 'Tranzaksiyalar bo\'yicha jami chiqim'],
    ['Sof Jamg\'arma (Kirim - Chiqim)', totalIncome - totalExpense, 'Sof qoldiq'],
    ['Doimiy Majburiyatlar soni', recurringBills.length, 'Oylik to\'lovlar'],
    ['Jamg\'arma Maqsadlari soni', goals.length, 'Faol maqsadlar'],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Umumiy Xulosa'!A1:C${summaryRows.length}?valueInputOption=USER_ENTERED`,
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
 * Appends a single new transaction into an existing Google Sheet with Date AND Time
 */
export async function appendTransactionToSheet(
  accessToken: string,
  spreadsheetId: string,
  transaction: Transaction
): Promise<boolean> {
  const row = [
    transaction.date,
    getTransactionTimeString(transaction),
    transaction.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)',
    transaction.category,
    transaction.amount,
    transaction.description || '',
    transaction.paymentMethod || 'Humo/Uzcard',
    transaction.id,
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tranzaksiyalar!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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
 * Syncs full data to an existing Google Sheet (re-writes sheets with Date and Time columns)
 */
export async function syncToExistingSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[],
  recurringBills: RecurringBill[],
  goals: SavingsGoal[],
  balance: number
): Promise<boolean> {
  // Clear and rewrite Tranzaksiyalar (Columns A through H)
  const transactionRows = [
    ['Kuni (Sana)', 'Vaqti (Soat)', 'Turi', 'Toifa', "Miqdor (so'm)", 'Izoh', "To'lov usuli", 'ID'],
    ...transactions.map((t) => [
      t.date,
      getTransactionTimeString(t),
      t.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)',
      t.category,
      t.amount,
      t.description || '',
      t.paymentMethod || 'Humo/Uzcard',
      t.id,
    ]),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tranzaksiyalar!A1:H${Math.max(transactionRows.length + 20, 100)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const res1 = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tranzaksiyalar!A1:H${transactionRows.length}?valueInputOption=USER_ENTERED`,
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

  const summaryRows = [
    ["Ko'rsatkich", 'Qiymat', 'Qo\'shimcha ma\'lumot'],
    ['Joriy Balans', balance, "So'nggi yangilanish vaqti: " + new Date().toLocaleString('uz-UZ')],
    ['Jami Daromad', totalIncome, 'Tranzaksiyalar bo\'yicha jami kirim'],
    ['Jami Xarajat', totalExpense, 'Tranzaksiyalar bo\'yicha jami chiqim'],
    ['Sof Jamg\'arma (Kirim - Chiqim)', totalIncome - totalExpense, 'Sof qoldiq'],
    ['Doimiy Majburiyatlar soni', recurringBills.length, 'Oylik to\'lovlar'],
    ['Jamg\'arma Maqsadlari soni', goals.length, 'Faol maqsadlar'],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Umumiy Xulosa'!A1:C${summaryRows.length}?valueInputOption=USER_ENTERED`,
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
