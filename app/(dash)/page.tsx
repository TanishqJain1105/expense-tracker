import { currentUser } from '@clerk/nextjs/server';
import { checkUser } from '@/lib/checkUser';
import ExpenseDashboard from '@/components/ExpenseDashboard';
import AddTransaction from '@/components/AddTransaction';
import TransactionFilters from '@/components/TransactionFilters';
import TransactionList from '@/components/TransactionList';
import getCategories from '@/app/actions/getCategories';
import getWallets from '@/app/actions/getWallets';
import getSummary from '@/app/actions/getSummary';
import getAnalytics from '@/app/actions/getAnalytics';
import getTransactions from '@/app/actions/getTransactions';
import { parseFilters } from '@/lib/buildTransactionWhere';

const emptySummary = { income: 0, expense: 0, net: 0, cash: 0, online: 0 };
const emptyAnalytics = {
  months: [],
  byCategory: [],
  breakdownType: 'expense' as const,
  deltas: {},
  trends: { income: [], expense: [], net: [] },
};

const HomePage = async ({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) => {
  const user = await currentUser();

  // Signed out still gets the themed shell, with a sign-in card in place of
  // the data rather than a separate welcome page.
  if (!user) {
    return (
      <div className='app-shell'>
        <ExpenseDashboard
          signedOut
          firstName='there'
          summary={emptySummary}
          analytics={emptyAnalytics}
          transactions={[]}
          transactionCount={0}
        />
      </div>
    );
  }

  // Creates the User row (and seeds default categories/wallets) on first
  // visit. Must run after the signed-out early return, since checkUser()
  // needs a signed-in Clerk user. Without it, every transaction insert fails
  // on the Transaction.userId foreign key.
  await checkUser();

  const filters = parseFilters(searchParams);

  // Fetched once here and passed down, rather than each component running
  // its own query.
  const [{ categories }, { wallets }, { summary }, { analytics }, { transactions, total }] =
    await Promise.all([
      getCategories(),
      getWallets(),
      getSummary(filters),
      getAnalytics(filters),
      getTransactions(filters),
    ]);

  return (
    <div className='app-shell'>
      <ExpenseDashboard
        firstName={user.firstName ?? 'there'}
        avatarUrl={user.imageUrl}
        summary={summary ?? emptySummary}
        analytics={analytics ?? emptyAnalytics}
        transactions={(transactions ?? []).slice(0, 6)}
        transactionCount={total ?? 0}
      >
        <AddTransaction categories={categories ?? []} wallets={wallets ?? []} />
        <TransactionFilters
          categories={categories ?? []}
          wallets={wallets ?? []}
        />
        <TransactionList
          filters={filters}
          categories={categories ?? []}
          wallets={wallets ?? []}
        />
      </ExpenseDashboard>
    </div>
  );
};

export default HomePage;
