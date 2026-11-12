'use client';
import { useState } from 'react';
import { Transaction, Category, Wallet } from '@/types/Transaction';
import { cn, formatCurrency, MONTHS } from '@/lib/utils';
import { toast } from 'react-toastify';
import deleteTransaction from '@/app/actions/deleteTransaction';
import updateTransaction from '@/app/actions/updateTransaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import NativeSelect from '@/components/NativeSelect';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Pencil,
  Trash2,
} from 'lucide-react';

const dateValue = (d: Date | string) =>
  new Date(d).toISOString().slice(0, 10);

/**
 * Fixed format, no locale lookup.
 *
 * toLocaleDateString(undefined, ...) resolves the locale from the host, so
 * Node formatted with the server locale ("Nov 13, 2026") and the browser
 * with the user's ("13 Nov 2026") — a hydration mismatch.
 *
 * The UTC getters matter too: the dates come back as UTC midnight, so local
 * getters would render the previous day for any viewer behind UTC.
 */
const formatDate = (d: Date | string) => {
  const dt = new Date(d);
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
};

/** "cash" -> "Cash". Unknown values are shown as stored rather than hidden. */
const methodLabel = (m: string) =>
  m === 'cash' ? 'Cash' : m === 'online' ? 'Online' : m;

const TransactionItem = ({
  transaction,
  categories,
  wallets,
}: {
  transaction: Transaction;
  categories: Category[];
  wallets: Wallet[];
}) => {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<string>(transaction.type);
  const [method, setMethod] = useState<string>(transaction.paymentMethod);
  const [pending, setPending] = useState(false);

  const isExpense = transaction.type === 'expense';
  const sign = isExpense ? '-' : '+';

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this transaction?');
    if (!confirmed) return;

    setPending(true);
    const { message, error } = await deleteTransaction(transaction.id);
    setPending(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(message);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    setPending(true);
    const { message, error } = await updateTransaction(
      transaction.id,
      formData
    );
    setPending(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(message);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <li className='py-4'>
        <form action={handleUpdate} className='flex flex-col gap-3'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={`type-${transaction.id}`}>Type</Label>
              <NativeSelect
                id={`type-${transaction.id}`}
                name='type'
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value='expense'>Expense</option>
                <option value='income'>Income</option>
              </NativeSelect>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={`method-${transaction.id}`}>Method</Label>
              <NativeSelect
                id={`method-${transaction.id}`}
                name='paymentMethod'
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value='cash'>Cash</option>
                <option value='online'>Online</option>
              </NativeSelect>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={`text-${transaction.id}`}>Description</Label>
              <Input
                id={`text-${transaction.id}`}
                type='text'
                name='text'
                defaultValue={transaction.text}
                required
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={`amount-${transaction.id}`}>Amount</Label>
              <Input
                id={`amount-${transaction.id}`}
                type='number'
                name='amount'
                step='0.01'
                min='0'
                defaultValue={transaction.amount}
                className='tabular-nums'
                required
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={`date-${transaction.id}`}>Date</Label>
              <Input
                id={`date-${transaction.id}`}
                type='date'
                name='date'
                defaultValue={dateValue(transaction.date)}
                required
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={`category-${transaction.id}`}>Category</Label>
              <NativeSelect
                id={`category-${transaction.id}`}
                name='categoryId'
                defaultValue={transaction.categoryId ?? ''}
              >
                <option value=''>Uncategorised</option>
                {categories
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </NativeSelect>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={`wallet-${transaction.id}`}>Wallet</Label>
              <NativeSelect
                id={`wallet-${transaction.id}`}
                name='walletId'
                defaultValue={transaction.walletId ?? ''}
              >
                <option value=''>None</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-2'>
              <Label htmlFor={`note-${transaction.id}`}>Note</Label>
              <Input
                id={`note-${transaction.id}`}
                type='text'
                name='note'
                defaultValue={transaction.note ?? ''}
                placeholder='Note'
              />
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button type='submit' size='sm' disabled={pending}>
              {pending ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className='group flex items-center gap-3 py-3'>
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isExpense
            ? 'bg-negative-muted text-negative'
            : 'bg-positive-muted text-positive'
        )}
      >
        {isExpense ? (
          <ArrowDownLeft className='size-4' aria-hidden='true' />
        ) : (
          <ArrowUpRight className='size-4' aria-hidden='true' />
        )}
      </span>

      <div className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate text-sm font-medium'>{transaction.text}</span>
        <span className='truncate text-xs text-muted-foreground'>
          {transaction.category?.name ?? 'Uncategorised'}
          {transaction.wallet ? ` · ${transaction.wallet.name}` : ''}
          {' · '}
          {formatDate(transaction.date)}
        </span>
        {transaction.note && (
          <span className='truncate text-xs text-muted-foreground'>
            {transaction.note}
          </span>
        )}
      </div>

      <Badge variant='outline' className='hidden shrink-0 gap-1 sm:flex'>
        {transaction.paymentMethod === 'online' ? (
          <CreditCard className='size-3' aria-hidden='true' />
        ) : (
          <Banknote className='size-3' aria-hidden='true' />
        )}
        {methodLabel(transaction.paymentMethod)}
      </Badge>

      <span
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          isExpense ? 'text-negative' : 'text-positive'
        )}
      >
        {sign}
        {formatCurrency(transaction.amount)}
      </span>

      <div className='flex shrink-0 items-center gap-0.5 transition-opacity sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100'>
        <Button
          variant='ghost'
          size='icon'
          className='size-8 text-muted-foreground'
          onClick={() => setEditing(true)}
          aria-label={`Edit transaction ${transaction.text}`}
        >
          <Pencil className='size-3.5' aria-hidden='true' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='size-8 text-muted-foreground hover:text-destructive'
          onClick={handleDelete}
          disabled={pending}
          aria-label={`Delete transaction ${transaction.text}`}
        >
          <Trash2 className='size-3.5' aria-hidden='true' />
        </Button>
      </div>
    </li>
  );
};

export default TransactionItem;
