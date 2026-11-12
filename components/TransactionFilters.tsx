'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Category, Wallet } from '@/types/Transaction';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import NativeSelect from '@/components/NativeSelect';
import { Search, X } from 'lucide-react';

const TransactionFilters = ({
  categories,
  wallets,
}: {
  categories: Category[];
  wallets: Wallet[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  // Keep filter state in the URL: the view survives a refresh, the back
  // button works, and the page can be shared or bookmarked.
  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Any filter change invalidates the current page number.
      params.delete('page');

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounce the search box so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (search === current) return;

    const timer = setTimeout(() => setParam({ q: search }), 400);
    return () => clearTimeout(timer);
  }, [search, searchParams, setParam]);

  const reset = () => {
    setSearch('');
    router.push(pathname);
  };

  const hasFilters = Array.from(searchParams.keys()).some((k) => k !== 'page');

  return (
    <Card>
      <CardContent className='flex flex-col gap-4 pt-6'>
        <div className='relative'>
          <Search
            className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
            aria-hidden='true'
          />
          <Input
            type='search'
            placeholder='Search description, note or category...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label='Search transactions'
            className='pl-9'
          />
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='filter-type'>Type</Label>
            <NativeSelect
              id='filter-type'
              value={searchParams.get('type') ?? ''}
              onChange={(e) => setParam({ type: e.target.value })}
            >
              <option value=''>All types</option>
              <option value='income'>Income</option>
              <option value='expense'>Expense</option>
            </NativeSelect>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='filter-method'>Method</Label>
            <NativeSelect
              id='filter-method'
              value={searchParams.get('paymentMethod') ?? ''}
              onChange={(e) => setParam({ paymentMethod: e.target.value })}
            >
              <option value=''>All methods</option>
              <option value='cash'>Cash</option>
              <option value='online'>Online</option>
            </NativeSelect>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='filter-category'>Category</Label>
            <NativeSelect
              id='filter-category'
              value={searchParams.get('categoryId') ?? ''}
              onChange={(e) => setParam({ categoryId: e.target.value })}
            >
              <option value=''>All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='filter-wallet'>Wallet</Label>
            <NativeSelect
              id='filter-wallet'
              value={searchParams.get('walletId') ?? ''}
              onChange={(e) => setParam({ walletId: e.target.value })}
            >
              <option value=''>All wallets</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='filter-from'>From</Label>
              <Input
                id='filter-from'
                type='date'
                value={searchParams.get('from') ?? ''}
                onChange={(e) => setParam({ from: e.target.value })}
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='filter-to'>To</Label>
              <Input
                id='filter-to'
                type='date'
                value={searchParams.get('to') ?? ''}
                onChange={(e) => setParam({ to: e.target.value })}
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={reset}
            className='w-fit gap-1.5'
          >
            <X className='size-3.5' aria-hidden='true' />
            Reset filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionFilters;
