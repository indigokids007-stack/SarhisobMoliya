/**
 * Currency & Number formatters tailored for Uzbekistan Sum (UZS)
 */

export function formatUZS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0 so'm";
  }
  const formatted = new Intl.NumberFormat('uz-UZ').format(Math.round(amount));
  return `${formatted} so'm`;
}

export function formatShortUZS(amount: number): string {
  if (!amount || isNaN(amount)) return "0";
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1) + ' mlrd';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1) + ' mln';
  }
  if (Math.abs(amount) >= 1_000) {
    return (amount / 1_000).toFixed(0) + ' ming';
  }
  return formatUZS(amount);
}

export function formatDateUz(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const monthsUz = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'
    ];
    if (day && month && year) {
      return `${day}-${monthsUz[month - 1]}, ${year}`;
    }
    const d = new Date(dateString);
    return `${d.getDate()}-${monthsUz[d.getMonth()]}, ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}

export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(1, lastDay - now.getDate());
}
