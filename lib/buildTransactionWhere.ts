import { Prisma } from '@prisma/client';
import { TransactionFilters } from '@/types/Transaction';

export const PAGE_SIZE = 20;

/**
 * Build the Prisma `where` clause for a filtered transaction query.
 *
 * `userId` is applied here and is NOT overridable by the caller's filters,
 * so every query built through this helper is scoped to one user. Both the
 * list query and the summary query go through it, which is what keeps the
 * totals and the rows in agreement.
 */
export function buildTransactionWhere(
  userId: string,
  filters: TransactionFilters
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.type === 'income' || filters.type === 'expense') {
    where.type = filters.type;
  }

  if (filters.paymentMethod === 'cash' || filters.paymentMethod === 'online') {
    where.paymentMethod = filters.paymentMethod;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.walletId) {
    where.walletId = filters.walletId;
  }

  if (filters.from || filters.to) {
    const date: Prisma.DateTimeFilter = {};

    if (filters.from) {
      const from = new Date(filters.from);
      if (!Number.isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        date.gte = from;
      }
    }

    if (filters.to) {
      const to = new Date(filters.to);
      if (!Number.isNaN(to.getTime())) {
        // Include the whole end day rather than stopping at midnight.
        to.setHours(23, 59, 59, 999);
        date.lte = to;
      }
    }

    if (date.gte || date.lte) {
      where.date = date;
    }
  }

  const q = filters.q?.trim();

  if (q) {
    where.OR = [
      { text: { contains: q, mode: 'insensitive' } },
      { note: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  return where;
}

/** Turn URL search params into typed filters. */
export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>
): TransactionFilters {
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const pageRaw = parseInt(one(searchParams.page) ?? '1', 10);

  return {
    type: one(searchParams.type),
    paymentMethod: one(searchParams.paymentMethod),
    categoryId: one(searchParams.categoryId),
    walletId: one(searchParams.walletId),
    from: one(searchParams.from),
    to: one(searchParams.to),
    q: one(searchParams.q),
    page: Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw,
  };
}
