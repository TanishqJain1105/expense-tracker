'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { Transaction, TransactionFilters } from '@/types/Transaction';
import { buildTransactionWhere, PAGE_SIZE } from '@/lib/buildTransactionWhere';

interface Result {
  transactions?: Transaction[];
  total?: number;
  page?: number;
  pageCount?: number;
  error?: string;
}

async function getTransactions(
  filters: TransactionFilters = {}
): Promise<Result> {
  const { userId } = auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const where = buildTransactionWhere(userId, filters);

  try {
    // Count and page run together — the count drives the pager, and both
    // use the same where clause so they can never disagree.
    const [total, rows] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({
        where,
        include: { category: true, wallet: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      transactions: rows as unknown as Transaction[],
      total,
      page,
      pageCount,
    };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[getTransactions]', error);
    return { error: 'Database error' };
  }
}

export default getTransactions;
