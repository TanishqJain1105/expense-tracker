'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface TransactionResult {
  data?: { id: string };
  error?: string;
}

async function addTransaction(formData: FormData): Promise<TransactionResult> {
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

  if (!text) {
    return { error: 'Description is required' };
  }

  if (!amountRaw) {
    return { error: 'Amount is required' };
  }

  const parsed = parseFloat(amountRaw);

  if (Number.isNaN(parsed)) {
    return { error: 'Amount must be a number' };
  }

  // Amount is always stored positive; `type` carries the sign.
  const amount = Math.abs(parsed);

  if (amount === 0) {
    return { error: 'Amount must be greater than zero' };
  }

  if (type !== 'income' && type !== 'expense') {
    return { error: 'Type must be income or expense' };
  }

  if (paymentMethod !== 'cash' && paymentMethod !== 'online') {
    return { error: 'Payment method must be cash or online' };
  }

  const date = dateRaw ? new Date(dateRaw) : new Date();

  if (Number.isNaN(date.getTime())) {
    return { error: 'Invalid date' };
  }

  try {
    // Never trust IDs from the browser — confirm they belong to this user
    // before attaching them, otherwise someone could post another user's
    // category or wallet id.
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

    const created = await db.transaction.create({
      data: {
        text,
        amount,
        type,
        paymentMethod,
        note,
        date,
        categoryId,
        walletId,
        userId,
      },
      select: { id: true },
    });

    revalidatePath('/');

    return { data: created };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[addTransaction]', error);
    return { error: 'Transaction not added' };
  }
}

export default addTransaction;
