'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { Wallet } from '@/types/Transaction';

async function getWallets(): Promise<{
  wallets?: Wallet[];
  error?: string;
}> {
  const { userId } = auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  try {
    const wallets = await db.wallet.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return { wallets };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[getWallets]', error);
    return { error: 'Database error' };
  }
}

export default getWallets;
