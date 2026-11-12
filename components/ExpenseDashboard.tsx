'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  ListOrdered,
  Scale,
  Wallet,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/app-1-utils/sidebar';
import { App1Sidebar } from '@/components/ui/app-1-utils/app-1-sidebar';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import type { Analytics } from '@/app/actions/getAnalytics';
import type { Summary, Transaction } from '@/types/Transaction';
import { formatCurrency, MONTHS, monthLabel } from '@/lib/utils';
import type React from 'react';

/** Same fixed-table approach as TransactionItem: no locale lookup, UTC getters. */
const formatDate = (d: Date | string) => {
  const dt = new Date(d);
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
};

const chartConfig = {
  income: { label: 'Income', color: 'var(--chart-2)' },
  expense: { label: 'Expense', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const ExpenseDashboard = ({
  firstName,
  avatarUrl,
  summary,
  analytics,
  transactions,
  transactionCount,
  signedOut = false,
  children,
}: {
  firstName: string;
  avatarUrl?: string;
  summary: Summary;
  analytics: Analytics;
  transactions: Transaction[];
  transactionCount: number;
  /** Show the shell with a sign-in prompt instead of the (empty) data. */
  signedOut?: boolean;
  /**
   * Server components rendered below the panels — the add form, the filter
   * row and the paginated list. Passed as children because this is a client
   * component and server components can only cross that boundary as slots.
   */
  children?: React.ReactNode;
}) => {
  const stats = [
    { label: 'Income', value: formatCurrency(summary.income), hint: 'Money in', icon: ArrowUpRight },
    { label: 'Expense', value: formatCurrency(summary.expense), hint: 'Money out', icon: ArrowDownLeft },
    { label: 'Net', value: formatCurrency(summary.net), hint: 'Income minus expense', icon: Scale },
    {
      label: 'Transactions',
      value: String(transactionCount),
      hint: `${formatCurrency(summary.cash)} cash · ${formatCurrency(summary.online)} online`,
      icon: ListOrdered,
    },
  ];

  // Chart rows need the display label baked in: the x-axis gets a plain
  // string, so no locale formatting runs inside Recharts.
  const chartData = analytics.months.map((m) => ({
    month: monthLabel(m.month),
    income: m.income,
    expense: m.expense,
  }));

  const categoryTotal = analytics.byCategory.reduce((n, c) => n + c.value, 0);
  const initials = firstName.slice(0, 2).toUpperCase() || 'ME';

  return (
    <SidebarProvider>
      <App1Sidebar />
      {/* min-w-0: a flex item will not shrink below its content's min-content
          width without it, which pushes the inset past the viewport. */}
      <SidebarInset className='min-w-0'>
        <header className='sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background px-4 sm:px-6'>
          <SidebarTrigger aria-label='Toggle navigation' />
          <h1 className='truncate text-lg font-semibold'>
            Welcome back, {firstName}
          </h1>
          <div className='ml-auto flex items-center gap-2'>
            <ThemeToggle />
            <SignedOut>
              <SignInButton>
                <Button size='sm'>Sign in</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
            {signedOut ? (
              <Avatar className='size-8'>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ) : avatarUrl ? (
              <Avatar className='size-8'>
                <AvatarImage src={avatarUrl} alt={firstName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ) : null}
          </div>
        </header>

        {signedOut ? (
          // The shell still renders when signed out. Returning the plain
          // Guest page here instead would make /dashboard look like the
          // old app, which is the opposite of the point.
          <main className='flex flex-1 items-center justify-center p-6'>
            <Card className='w-full max-w-sm'>
              <CardHeader>
                <CardTitle className='text-xl'>Sign in to continue</CardTitle>
                <CardDescription>
                  Your balance, categories and recent transactions appear here
                  once you are signed in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignInButton>
                  <Button className='w-full'>Sign in</Button>
                </SignInButton>
              </CardContent>
            </Card>
          </main>
        ) : (
        <main className='flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6'>
          <div className='grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {stats.map((stat) => (
              <Card key={stat.label} className='min-w-0'>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <CardTitle className='truncate text-sm font-medium'>
                    {stat.label}
                  </CardTitle>
                  <stat.icon aria-hidden className='size-5 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <p className='truncate text-2xl font-semibold tabular-nums'>
                    {stat.value}
                  </p>
                  <p className='truncate text-xs text-muted-foreground'>{stat.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income and expense</CardTitle>
              <CardDescription>
                {chartData.length > 1
                  ? `By month, ${chartData[0].month} to ${chartData[chartData.length - 1].month}`
                  : 'By month'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className='py-10 text-center text-sm text-muted-foreground'>
                  Nothing to chart yet. Add a transaction and it appears here.
                </p>
              ) : (
                <ChartContainer config={chartConfig} className='h-64 w-full'>
                  <AreaChart
                    data={chartData}
                    margin={{ left: 4, right: 4, top: 8 }}
                    accessibilityLayer
                  >
                    <defs>
                      <linearGradient id='expenseFill' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='var(--color-expense)' stopOpacity={0.25} />
                        <stop offset='100%' stopColor='var(--color-expense)' stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' />
                    <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={72}
                      tickFormatter={formatCurrency}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {/* Separated by form as well as colour, so the two series
                        stay distinguishable in both themes. */}
                    <Area
                      dataKey='income'
                      type='monotone'
                      stroke='var(--color-income)'
                      strokeDasharray='4 4'
                      fill='none'
                      strokeWidth={2}
                    />
                    <Area
                      dataKey='expense'
                      type='monotone'
                      stroke='var(--color-expense)'
                      fill='url(#expenseFill)'
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className='grid min-w-0 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Where the money goes</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-5'>
                {analytics.byCategory.length === 0 ? (
                  <p className='py-6 text-center text-sm text-muted-foreground'>
                    No categorised spending in this range yet.
                  </p>
                ) : (
                  analytics.byCategory.map((slice) => {
                    const share = categoryTotal
                      ? Math.round((slice.value / categoryTotal) * 100)
                      : 0;
                    return (
                      <div key={slice.label} className='flex flex-col gap-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <h3 className='truncate text-sm font-medium'>
                            {slice.label}
                          </h3>
                          <span className='shrink-0 text-sm tabular-nums'>
                            {formatCurrency(slice.value)}
                          </span>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Progress
                            value={share}
                            aria-label={`${slice.label} share of spending`}
                          />
                          <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                            {share}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent transactions</CardTitle>
                <CardDescription>Your latest activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className='py-6 text-center text-sm text-muted-foreground'>
                    No transactions to show yet.
                  </p>
                ) : (
                  <ol className='flex flex-col gap-4'>
                    {transactions.map((t) => {
                      const isExpense = t.type === 'expense';
                      return (
                        <li key={t.id} className='flex items-start gap-3'>
                          <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-muted'>
                            {isExpense ? (
                              <ArrowDownLeft className='size-4' aria-hidden />
                            ) : (
                              <ArrowUpRight className='size-4' aria-hidden />
                            )}
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='flex items-center justify-between gap-2 text-sm leading-snug'>
                              <span className='truncate font-medium'>{t.text}</span>
                              <span className='shrink-0 tabular-nums'>
                                {isExpense ? '-' : '+'}
                                {formatCurrency(t.amount)}
                              </span>
                            </p>
                            <p className='flex items-center gap-2 text-xs text-muted-foreground'>
                              <span className='truncate'>
                                {t.category?.name ?? 'Uncategorised'} ·{' '}
                                {formatDate(t.date)}
                              </span>
                              <Badge
                                variant='outline'
                                className='ml-auto shrink-0 gap-1'
                              >
                                {t.paymentMethod === 'online' ? (
                                  <CreditCard className='size-3' aria-hidden />
                                ) : (
                                  <Banknote className='size-3' aria-hidden />
                                )}
                                {t.paymentMethod === 'online' ? 'Online' : 'Cash'}
                              </Badge>
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {children}
        </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ExpenseDashboard;
