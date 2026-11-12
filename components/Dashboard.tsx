'use client';
// Must be a client component: the chart kit is 'use client', and `format` /
// `xFormat` are functions. Functions cannot cross the server -> client
// boundary, so a server Dashboard throws
// "Functions cannot be passed directly to Client Components" at render.
// The data it receives from page.tsx is plain JSON and serializes fine.
import {
  AreaTrend,
  BarCompare,
  ChartCard,
  DonutBreakdown,
  KpiCard,
  type Series,
} from '@/components/ui/revenue-charts-kpi';
import type { Analytics } from '@/app/actions/getAnalytics';
import { Summary } from '@/types/Transaction';
import { formatMoney, monthLabel } from '@/lib/utils';

/**
 * The 21st.dev / Layro chart kit, fed by real transaction data.
 *
 * `format` and `xFormat` are passed explicitly on every chart. The kit's
 * own default is `(v) => v.toLocaleString()`, and its data-table fallback
 * renders during SSR — which would reintroduce the locale hydration
 * mismatch that was fixed in TransactionItem.
 */
const Dashboard = ({
  summary,
  analytics,
  filtered,
}: {
  summary: Summary;
  analytics: Analytics;
  filtered: boolean;
}) => {
  const { months, byCategory, breakdownType, deltas, trends } = analytics;

  const series: Series[] = [
    { key: 'income', label: 'Income', slot: 2 },
    { key: 'expense', label: 'Expense', slot: 5 },
  ];

  const period = months.length > 1 ? 'vs last month' : undefined;
  const suffix = filtered ? ' (filtered)' : '';

  return (
    <div className='dashboard'>
      <div className='dashboard-kpis'>
        <KpiCard
          label={`Income${suffix}`}
          value={formatMoney(summary.income)}
          delta={deltas.income}
          good='up'
          period={period}
          trend={trends.income.length > 1 ? trends.income : undefined}
        />
        <KpiCard
          label={`Expense${suffix}`}
          value={formatMoney(summary.expense)}
          delta={deltas.expense}
          good='down'
          period={period}
          trend={trends.expense.length > 1 ? trends.expense : undefined}
        />
        <KpiCard
          label={`Net${suffix}`}
          value={formatMoney(summary.net)}
          delta={deltas.net}
          good='up'
          period={period}
          trend={trends.net.length > 1 ? trends.net : undefined}
        />
      </div>

      {months.length === 0 ? (
        <ChartCard
          title='Income and expense over time'
          subtitle='Nothing to chart yet'
        >
          <p className='empty'>
            Add a transaction, or widen the filters, and the charts appear
            here.
          </p>
        </ChartCard>
      ) : months.length === 1 ? (
        <ChartCard
          title='Income and expense'
          subtitle={`${monthLabel(months[0].month)} — one month of data so far`}
        >
          <BarCompare
            data={months}
            xKey='month'
            series={series}
            format={formatMoney}
            xFormat={monthLabel}
            description={`Income and expense for ${monthLabel(
              months[0].month
            )}.`}
          />
        </ChartCard>
      ) : (
        <ChartCard
          title='Income and expense over time'
          subtitle={`Last ${months.length} months`}
        >
          <AreaTrend
            data={months}
            xKey='month'
            series={series}
            format={formatMoney}
            xFormat={monthLabel}
            description={`Income and expense by month, ${monthLabel(
              months[0].month
            )} to ${monthLabel(months[months.length - 1].month)}.`}
          />
        </ChartCard>
      )}

      <ChartCard
        title={breakdownType === 'income' ? 'Income by category' : 'Where the money goes'}
        subtitle={
          breakdownType === 'income'
            ? 'Income by category'
            : 'Expense by category'
        }
      >
        {byCategory.length === 0 ? (
          <p className='empty'>
            No categorised {breakdownType} in this range yet.
          </p>
        ) : (
          <DonutBreakdown
            data={byCategory}
            format={formatMoney}
            centerLabel='Total'
            description={`${
              breakdownType === 'income' ? 'Income' : 'Expense'
            } split by category.`}
          />
        )}
      </ChartCard>
    </div>
  );
};

export default Dashboard;
