import getTransactions from '@/app/actions/getTransactions';
import TransactionItem from './TransactionItem';
import Pagination from './Pagination';
import {
  Transaction,
  TransactionFilters,
  Category,
  Wallet,
} from '@/types/Transaction';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Receipt } from 'lucide-react';

const TransactionList = async ({
  filters,
  categories,
  wallets,
}: {
  filters: TransactionFilters;
  categories: Category[];
  wallets: Wallet[];
}) => {
  const { transactions, total, page, pageCount, error } =
    await getTransactions(filters);

  // A failed query is shown as an empty history, not as "Database error".
  // The real cause is logged server-side in the action.
  const empty = error || !transactions || transactions.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>History</CardTitle>
        <CardDescription>
          {empty ? 'Nothing here yet' : 'Newest first'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className='flex flex-col items-center gap-2 py-10 text-center'>
            <span className='flex size-10 items-center justify-center rounded-full bg-muted'>
              <Receipt className='size-5 text-muted-foreground' aria-hidden='true' />
            </span>
            <p className='text-sm font-medium'>
              {error ? 'No transactions to show yet.' : 'No transactions match these filters.'}
            </p>
            <p className='text-sm text-muted-foreground'>
              {error
                ? 'They will appear here once there is data.'
                : 'Try resetting them, or add your first transaction above.'}
            </p>
          </div>
        ) : (
          <>
            <ul className='divide-y'>
              {transactions!.map((transaction: Transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  categories={categories}
                  wallets={wallets}
                />
              ))}
            </ul>
            <Pagination
              page={page ?? 1}
              pageCount={pageCount ?? 1}
              total={total ?? 0}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionList;
