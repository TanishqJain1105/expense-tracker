'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

async function deleteTransaction(transactionId: string): Promise<{
  message?: string;
  error?: string;
}> {
  const { userId } = auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  try {
    // deleteMany, not delete: `delete` requires a unique where clause, so
    // userId cannot be part of it. deleteMany accepts both, which means a
    // transaction owned by another user matches zero rows instead of being
    // deleted.
    const result = await db.transaction.deleteMany({
      where: { id: transactionId, userId },
    });

    if (result.count === 0) {
      return { error: 'Transaction not found' };
    }

    revalidatePath('/');

    return { message: 'Transaction deleted' };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[deleteTransaction]', error);
    return { error: 'Database error' };
  }
}

export default deleteTransaction;
