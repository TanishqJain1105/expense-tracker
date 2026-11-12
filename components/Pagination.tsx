'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  page,
  pageCount,
  total,
}: {
  page: number;
  pageCount: number;
  total: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const label = `${total} transaction${total === 1 ? '' : 's'}`;

  if (pageCount <= 1) {
    return <p className='pt-4 text-xs text-muted-foreground'>{label}</p>;
  }

  const go = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(next));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 pt-4'>
      <p className='text-xs text-muted-foreground'>
        Page {page} of {pageCount} — {label}
      </p>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className='gap-1'
        >
          <ChevronLeft className='size-3.5' aria-hidden='true' />
          Previous
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
          className='gap-1'
        >
          Next
          <ChevronRight className='size-3.5' aria-hidden='true' />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
