export function formatUZS(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 UZS';
  }
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + ' UZS';
}

export function formatShortUZS(amount: number): string {
  if (!amount) return '0';
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + ' mln';
  }
  if (amount >= 1000) {
    return Math.round(amount / 1000) + ' ming';
  }
  return String(amount);
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDateUz(dateStr: string): string {
  return formatShortDate(dateStr);
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}
