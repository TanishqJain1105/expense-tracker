'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { Category } from '@/types/Transaction';

async function getCategories(): Promise<{
  categories?: Category[];
  error?: string;
}> {
  const { userId } = auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  try {
    const categories = await db.category.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return { categories };
  } catch (error) {
    // Logged, not shown: the UI falls back to an empty state so a
    // database problem never reaches the page as raw error text.
    console.error('[getCategories]', error);
    return { error: 'Database error' };
  }
}

export default getCategories;
