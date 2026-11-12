'use client';
import { useEffect, useRef, useState } from 'react';
import addTransaction from '@/app/actions/addTransaction';
import { toast } from 'react-toastify';
import { Category, PaymentMethod, Wallet } from '@/types/Transaction';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NativeSelect from '@/components/NativeSelect';
import { cn } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';

/**
 * Today in the VIEWER's timezone, as yyyy-mm-dd.
 *
 * Not `toISOString().slice(0, 10)`: that is the UTC date, so anyone behind
 * UTC midnight sees yesterday — in IST the form defaulted to the previous
 * day between 00:00 and 05:30 local.
 *
 * Called from an effect, never during render: the server and the browser
 * are not in the same timezone, so computing it during render would be a
 * hydration mismatch.
 */
const localToday = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

/** Segmented control that is still real radios, so FormData picks them up. */
const Segmented = <T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) => (
  <div className='inline-flex w-fit rounded-md bg-muted p-0.5'>
    {options.map((option) => (
      <label
        key={option}
        className={cn(
          'cursor-pointer rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors',
          value === option
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <input
          type='radio'
          name={name}
          value={option}
          checked={value === option}
          onChange={() => onChange(option)}
          className='sr-only'
        />
        {option}
      </label>
    ))}
  </div>
);

const AddTransaction = ({
  categories,
  wallets,
}: {
  categories: Category[];
  wallets: Wallet[];
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [pending, setPending] = useState(false);
  // Empty on the server, filled on mount — see localToday().
  const [date, setDate] = useState('');

  useEffect(() => setDate(localToday()), []);

  // Only show categories matching the selected type, so an expense can't
  // be filed under "Salary".
  const visibleCategories = categories.filter((c) => c.type === type);

  const clientAction = async (formData: FormData) => {
    setPending(true);
    const { error } = await addTransaction(formData);
    setPending(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Transaction added');
      formRef.current?.reset();
      setType('expense');
      setPaymentMethod('cash');
      // reset() does not clear a controlled input.
      setDate(localToday());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Add transaction</CardTitle>
        <CardDescription>
          Amounts are stored positive — the type decides the sign.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={clientAction}
          className='flex flex-col gap-5'
        >
          <div className='flex flex-wrap gap-6'>
            <div className='flex flex-col gap-2'>
              <Label>Type</Label>
              <Segmented
                name='type'
                value={type}
                options={['expense', 'income'] as const}
                onChange={setType}
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label>Payment method</Label>
              <Segmented
                name='paymentMethod'
                value={paymentMethod}
                options={['cash', 'online'] as const}
                onChange={setPaymentMethod}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='text'>Description</Label>
              <Input
                type='text'
                id='text'
                name='text'
                placeholder='e.g. Groceries'
                autoComplete='off'
                required
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='amount'>Amount</Label>
              <Input
                type='number'
                name='amount'
                id='amount'
                placeholder='0.00'
                step='0.01'
                min='0'
                className='tabular-nums'
                required
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='date'>Date</Label>
              <Input
                type='date'
                name='date'
                id='date'
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='categoryId'>Category</Label>
              <NativeSelect name='categoryId' id='categoryId'>
                <option value=''>Uncategorised</option>
                {visibleCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='walletId'>Wallet</Label>
              <NativeSelect name='walletId' id='walletId'>
                <option value=''>None</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='note'>Note (optional)</Label>
              <Input
                type='text'
                name='note'
                id='note'
                placeholder='Add a note'
                autoComplete='off'
              />
            </div>
          </div>

          <Button
            type='submit'
            disabled={pending}
            className='w-full gap-2 sm:w-auto sm:self-start'
          >
            {pending ? (
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            ) : (
              <Plus className='size-4' aria-hidden='true' />
            )}
            {pending ? 'Adding...' : 'Add transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTransaction;
