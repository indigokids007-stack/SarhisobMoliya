import { Transaction } from '../types';

/**
 * Helper to get clean time string from transaction
 */
export function getTransactionTimeString(tx: Transaction): string {
  if (tx.time && tx.time.trim()) return tx.time;
  if (tx.createdAt) {
    try {
      const d = new Date(tx.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } catch {}
  }
  return '12:00';
}

/**
 * Escapes fields for CSV according to RFC 4180
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports transactions to CSV file with UTF-8 BOM
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  filenamePrefix = 'sarhisob_hisobot'
): { success: boolean; filename: string; count: number } {
  if (!transactions || transactions.length === 0) {
    return { success: false, filename: '', count: 0 };
  }

  const headers = [
    '№',
    'Kuni (Sana)',
    'Vaqti (Soat)',
    'Turi',
    'Toifa',
    'Tavsif / Izoh',
    "Miqdor (so'm)",
    "To'lov usuli",
    'Tranzaksiya ID'
  ];

  let totalIncome = 0;
  let totalExpense = 0;

  const rows = transactions.map((tx, index) => {
    if (tx.type === 'income') totalIncome += tx.amount;
    else totalExpense += tx.amount;

    return [
      escapeCSVField(index + 1),
      escapeCSVField(tx.date),
      escapeCSVField(getTransactionTimeString(tx)),
      escapeCSVField(tx.type === 'income' ? 'Kirim (+)' : 'Chiqim (-)'),
      escapeCSVField(tx.category),
      escapeCSVField(tx.description),
      escapeCSVField(tx.amount),
      escapeCSVField(tx.paymentMethod || 'Humo/Uzcard'),
      escapeCSVField(tx.id),
    ].join(',');
  });

  // Summary rows
  const summaryHeader = [
    escapeCSVField('---'),
    escapeCSVField('---'),
    escapeCSVField('---'),
    escapeCSVField('---'),
    escapeCSVField('---'),
    escapeCSVField('---'),
    escapeCSVField('---'),
    escapeCSVField('---'),
    escapeCSVField('---'),
  ].join(',');

  const incomeSummaryRow = [
    escapeCSVField(''),
    escapeCSVField('JAMI KIRIM'),
    escapeCSVField(''),
    escapeCSVField('Kirim'),
    escapeCSVField('Barcha toifalar'),
    escapeCSVField('Jami tushumlar yig‘indisi'),
    escapeCSVField(totalIncome),
    escapeCSVField(''),
    escapeCSVField(''),
  ].join(',');

  const expenseSummaryRow = [
    escapeCSVField(''),
    escapeCSVField('JAMI CHIQIM'),
    escapeCSVField(''),
    escapeCSVField('Chiqim'),
    escapeCSVField('Barcha toifalar'),
    escapeCSVField('Jami xarajatlar yig‘indisi'),
    escapeCSVField(totalExpense),
    escapeCSVField(''),
    escapeCSVField(''),
  ].join(',');

  const netBalanceRow = [
    escapeCSVField(''),
    escapeCSVField('SOF FARQ (KIRIM - CHIQIM)'),
    escapeCSVField(''),
    escapeCSVField(totalIncome - totalExpense >= 0 ? 'Foyda' : 'Zarar'),
    escapeCSVField('Yakuniy saldo'),
    escapeCSVField('Kirimdan chiqim ayirilgan'),
    escapeCSVField(totalIncome - totalExpense),
    escapeCSVField(''),
    escapeCSVField(''),
  ].join(',');

  const csvContent =
    '\uFEFF' + // UTF-8 Byte Order Mark for Excel compatibility
    [
      headers.map(escapeCSVField).join(','),
      ...rows,
      summaryHeader,
      incomeSummaryRow,
      expenseSummaryRow,
      netBalanceRow,
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const nowStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${nowStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, filename, count: transactions.length };
}
