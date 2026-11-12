'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Thin client wrapper so the root layout can stay a server component.
 * `attribute="class"` puts `.dark` on <html>, which is what the
 * `@custom-variant dark (&:is(.dark *))` in globals.css matches.
 */
const ThemeProvider = ({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) => {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
};

export default ThemeProvider;
