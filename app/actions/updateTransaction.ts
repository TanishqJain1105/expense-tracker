'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface UpdateResult {
  message?: string;
  error?: string;
}

async function updateTransaction(
  transactionId: string,
  formData: FormData
): Promise<UpdateResult> {
  const { userId } = auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  const text = formData.get('text')?.toString().trim();
  const amountRaw = formData.get('amount')?.toString();
  const type = formData.get('type')?.toString() ?? 'expense';
  const paymentMethod =
    formData.get('paymentMethod')?.toString() ?? 'cash';
  const note = formData.get('note')?.toString().trim() || null;
  const dateRaw = formData.get('date')?.toString();
  const categoryId = formData.get('categoryId')?.toString() || null;
  const walletId = formData.get('walletId')?.toString() || null;

  if (!text) return { error: 'Description is required' };
  if (!amountRaw) return { error: 'Amount is required' };

  const parsed = parseFloat(amountRaw);
  if (Number.isNaN(parsed)) return { error: 'Amount must be a number' };

  const amount = Math.abs(parsed);
  if (amount === 0) return { error: 'Amount must be greater than zero' };

  if (type !== 'income' && type !== 'expense') {
    return { error: 'Type must be income or expense' };
  }

  if (paymentMethod !== 'cash' && paymentMethod !== 'online') {
    return { error: 'Payment method must be cash or online' };
  }

  const date = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(date.getTime())) return { error: 'Invalid date' };

  try {
    if (categoryId) {
      const owned = await db.category.findFirst({
        where: { id: categoryId, userId },
        select: { id: true },
      });
      if (!owned) return { error: 'Category not found' };
    }

    if (walletId) {
      const owned = await db.wallet.findFirst({
        where: { id: walletId, userId },
        select: { id: true },
      });
      if (!owned) return { error: 'Wallet not found' };
    }

    // updateMany lets userId sit in the where clause, so a transaction
    // belonging to someone else simply matches nothing.
    const result = await db.transaction.updateMany({
      where: { id: transactionId, userId },
      data: {
        text,
        amount,
        type,
        paymentMethod,
        note,
        date,
        categoryId,
        walletId,
      },
    });

    if (result.count === 0) {
      return { error: 'Transaction not found' };
    }

    revalidatePath('/');

    return { message: 'Transaction updated' };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[updateTransaction]', error);
    return { error: 'Database error' };
  }
}

export default updateTransaction;
