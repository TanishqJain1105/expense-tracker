import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

/**
 * A plain <select> wearing the shadcn input styling.
 *
 * Not the Radix Select: these live inside forms submitted as FormData to a
 * server action, and a native select is what puts `name`/`value` into that
 * payload without extra wiring.
 */
const NativeSelect = ({ className, ...props }: ComponentProps<'select'>) => (
  <select
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);

export default NativeSelect;
