export { cn } from "cn"

/**
 * Money for display, in rupees with Indian digit grouping.
 *   1234567 -> ₹12,34,567     (last three digits, then pairs)
 *
 * Deliberately NOT toLocaleString()/Intl.NumberFormat: those resolve the
 * locale from the host, so Node and the browser disagree and React reports a
 * hydration mismatch. The grouping is computed by hand so both sides agree.
 */
export function formatCurrency(x: number): string {
  const [whole, decimals] = Math.abs(x).toFixed(2).split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
    : last3;
  const sign = x < 0 ? '-' : '';
  return decimals === '00'
    ? `${sign}₹${grouped}`
    : `${sign}₹${grouped}.${decimals}`;
}

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** "2026-11" — the bucket key for monthly aggregation. UTC, like the rows. */
export function monthKey(d: Date | string): string {
  const dt = new Date(d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "2026-11" -> "Nov 2026". Fixed table, no locale lookup. */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const index = Number(month) - 1;
  return `${MONTHS[index] ?? month} ${year}`;
}
