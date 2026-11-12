'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { Summary, TransactionFilters } from '@/types/Transaction';
import { buildTransactionWhere } from '@/lib/buildTransactionWhere';

/**
 * Income, expense, net and the cash/online split for the ACTIVE filter.
 *
 * The old version pulled every row into Node and summed with reduce().
 * This groups in the database instead, so the work stays O(1) in transferred
 * rows no matter how many transactions exist. The payment-method split is a
 * second groupBy over the same where clause rather than a pass over rows,
 * for the same reason.
 */
async function getSummary(
  filters: TransactionFilters = {}
): Promise<{ summary?: Summary; error?: string }> {
  const { userId } = auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  const where = buildTransactionWhere(userId, filters);

  try {
    // Not annotated: Prisma's groupBy return type is derived from the
    // arguments, and annotating it breaks that inference.
    // Both grouped over the SAME where clause, so the two splits always
    // describe the same set of rows as the visible list.
    const [byType, byMethod] = await Promise.all([
      db.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
      }),
      db.transaction.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const income = byType.find((g) => g.type === 'income')?._sum.amount ?? 0;
    const expense = byType.find((g) => g.type === 'expense')?._sum.amount ?? 0;

    const cash =
      byMethod.find((g) => g.paymentMethod === 'cash')?._sum.amount ?? 0;
    const online =
      byMethod.find((g) => g.paymentMethod === 'online')?._sum.amount ?? 0;

    return {
      summary: {
        income,
        expense,
        net: income - expense,
        cash,
        online,
      },
    };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[getSummary]', error);
    return { error: 'Database error' };
  }
}

export default getSummary;
