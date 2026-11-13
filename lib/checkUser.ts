import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

const DEFAULT_CATEGORIES: { name: string; icon: string; type: string }[] = [
  { name: 'Food & Drink', icon: 'utensils', type: 'expense' },
  { name: 'Transport', icon: 'car', type: 'expense' },
  { name: 'Rent', icon: 'home', type: 'expense' },
  { name: 'Shopping', icon: 'bag', type: 'expense' },
  { name: 'Bills', icon: 'receipt', type: 'expense' },
  { name: 'Health', icon: 'heart', type: 'expense' },
  { name: 'Other', icon: 'tag', type: 'expense' },
  { name: 'Salary', icon: 'wallet', type: 'income' },
  { name: 'Family', icon: 'users', type: 'income' },
  { name: 'Freelance', icon: 'laptop', type: 'income' },
  { name: 'Other', icon: 'tag', type: 'income' },
];

/**
 * Create the starter categories and wallet for a user.
 * `skipDuplicates` makes this safe to call more than once.
 */
export const seedDefaults = async (clerkUserId: string) => {
  await db.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: clerkUserId })),
    skipDuplicates: true,
  });

  await db.wallet.createMany({
    data: [{ name: 'Cash', type: 'cash', balance: 0, userId: clerkUserId }],
    skipDuplicates: true,
  });
};

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const loggedInUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
  });

  if (loggedInUser) {
    // Existing users are already seeded, so skip the two writes on every
    // dashboard load. Still covers users who predate the Category and Wallet
    // models: if either table is empty for them, seed it now.
    const [category, wallet] = await Promise.all([
      db.category.findFirst({
        where: { userId: user.id },
        select: { id: true },
      }),
      db.wallet.findFirst({ where: { userId: user.id }, select: { id: true } }),
    ]);

    if (!category || !wallet) {
      await seedDefaults(user.id);
    }

    return loggedInUser;
  }

  const newUser = await db.user.create({
    data: {
      clerkUserId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
    },
  });

  await seedDefaults(user.id);

  return newUser;
};
