'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { TransactionFilters } from '@/types/Transaction';
import { buildTransactionWhere } from '@/lib/buildTransactionWhere';
import { monthKey } from '@/lib/utils';

export interface MonthPoint {
  /** "2026-11" — formatted for display in the component, not here. */
  month: string;
  income: number;
  expense: number;
  net: number;
  /** The chart kit's row type is Record<string, unknown>; this satisfies it
      without widening to `any`. */
  [key: string]: string | number;
}

export interface Slice {
  label: string;
  value: number;
}

export interface Analytics {
  months: MonthPoint[];
  /** Breakdown by category of whichever type the filter selects. */
  byCategory: Slice[];
  /** What byCategory is a breakdown OF, for the chart's heading. */
  breakdownType: 'income' | 'expense';
  /** Change from the second-to-last month to the last, as a fraction. */
  deltas: { income?: number; expense?: number; net?: number };
  /** Trailing values for the KPI sparklines. */
  trends: { income: number[]; expense: number[]; net: number[] };
}

/** How many months of history the charts show. */
const WINDOW = 12;

const changeFraction = (
  previous: number | undefined,
  current: number | undefined
): number | undefined => {
  if (previous === undefined || current === undefined) return undefined;
  if (previous === 0) return undefined; // no baseline, so no percentage
  return (current - previous) / Math.abs(previous);
};

/**
 * Chart data for the dashboard, scoped to the logged-in user and to the
 * ACTIVE filter — same `buildTransactionWhere` as the list and the summary,
 * so the charts can never show rows the table would not.
 */
async function getAnalytics(
  filters: TransactionFilters = {}
): Promise<{ analytics?: Analytics; error?: string }> {
  const { userId } = auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  const where = buildTransactionWhere(userId, filters);

  // A breakdown of expenses is the useful default, but if the user has
  // filtered to income then showing expenses would contradict the filter.
  const breakdownType: 'income' | 'expense' =
    filters.type === 'income' ? 'income' : 'expense';

  try {
    const [rows, grouped, categories] = await Promise.all([
      // Only three columns, and only to bucket by month. Prisma has no
      // groupBy on a date expression, and writing raw SQL here would mean
      // duplicating the filter logic outside buildTransactionWhere — the
      // one place user scoping is enforced. Narrow select over correctness
      // risk.
      db.transaction.findMany({
        where,
        select: { date: true, type: true, amount: true },
        orderBy: { date: 'asc' },
      }),
      db.transaction.groupBy({
        by: ['categoryId'],
        where: { ...where, type: breakdownType },
        _sum: { amount: true },
      }),
      db.category.findMany({
        where: { userId },
        select: { id: true, name: true },
      }),
    ]);

    const buckets = new Map<string, MonthPoint>();

    for (const row of rows) {
      const key = monthKey(row.date);
      const point =
        buckets.get(key) ??
        ({ month: key, income: 0, expense: 0, net: 0 } satisfies MonthPoint);

      if (row.type === 'income') {
        point.income += row.amount;
      } else {
        point.expense += row.amount;
      }

      point.net = point.income - point.expense;
      buckets.set(key, point);
    }

    const months = Array.from(buckets.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-WINDOW);

    const names = new Map(categories.map((c) => [c.id, c.name]));

    const byCategory: Slice[] = grouped
      .map((g) => ({
        label: g.categoryId
          ? names.get(g.categoryId) ?? 'Unknown'
          : 'Uncategorised',
        value: g._sum.amount ?? 0,
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);

    const last = months.at(-1);
    const previous = months.length > 1 ? months.at(-2) : undefined;

    return {
      analytics: {
        months,
        byCategory,
        breakdownType,
        deltas: {
          income: changeFraction(previous?.income, last?.income),
          expense: changeFraction(previous?.expense, last?.expense),
          net: changeFraction(previous?.net, last?.net),
        },
        trends: {
          income: months.map((m) => m.income),
          expense: months.map((m) => m.expense),
          net: months.map((m) => m.net),
        },
      },
    };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[getAnalytics]', error);
    return { error: 'Database error' };
  }
}

export default getAnalytics;
