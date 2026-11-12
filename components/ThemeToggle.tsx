'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Light/dark switch for the dashboard header.
 *
 * resolvedTheme is only known on the client — the server cannot tell which
 * theme the browser will pick — so rendering the real icon during SSR would
 * be a hydration mismatch. Until mounted this renders a same-sized invisible
 * placeholder, which also keeps the header from shifting.
 */
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className='size-10' aria-hidden='true' />;
  }

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun className='size-4' aria-hidden='true' />
      ) : (
        <Moon className='size-4' aria-hidden='true' />
      )}
    </Button>
  );
};

export default ThemeToggle;
