import type { GenerateProfitAndLossReportResponse, ProfitAndLossReportDay } from '@supermarket/api-sdk';
import { DataTable, InlineMessage, type DataTableColumn } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';
import { ScrollRegion } from './scroll-region';

export function ProfitAndLossStatement({ report }: { report: GenerateProfitAndLossReportResponse }) {
  const { m, fmt } = useI18n();
  const copy = m.results;

  const columns: DataTableColumn<ProfitAndLossReportDay>[] = [
    { key: 'date', header: copy.colDate, render: (row) => fmt.date(row.businessDate) },
    { key: 'revenue', header: copy.colRevenue, align: 'right', render: (row) => fmt.currency(row.revenueNetTotal) },
    { key: 'losses', header: copy.colLosses, align: 'right', render: (row) => fmt.currency(row.inventoryLossTotal) },
    {
      key: 'result',
      header: copy.colResult,
      align: 'right',
      render: (row) => (
        <span className={row.profitAndLossTotal < 0 ? 'text-stop' : undefined}>{fmt.currency(row.profitAndLossTotal)}</span>
      )
    },
    { key: 'sales', header: copy.colSales, align: 'right', render: (row) => row.netSalesCount }
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading">{copy.heading({ from: fmt.date(report.fromDate), to: fmt.date(report.toDate) })}</h2>
      <dl className="grid max-w-xl grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-body">
        <dt>{copy.revenue}</dt>
        <dd className="text-right tabular-nums">{fmt.currency(report.revenueNetTotal)}</dd>
        <dt className="border-b border-rule pb-2">{copy.losses}</dt>
        <dd className="border-b border-rule pb-2 text-right tabular-nums">{fmt.currency(report.inventoryLossTotal)}</dd>
        <dt className="pt-1 font-bold">{copy.result}</dt>
        <dd
          data-testid="result-total"
          className={`pt-1 text-right font-display text-display-md tabular-nums ${
            report.profitAndLossTotal < 0 ? 'text-stop' : 'text-go'
          }`}
        >
          {fmt.currency(report.profitAndLossTotal)}
        </dd>
      </dl>
      <p className="text-small text-ink-muted">
        {copy.counts({
          sales: report.netSalesCount,
          items: report.soldItemsQuantity,
          lossEvents: report.lossEventsCount,
          lossItems: report.lossItemsQuantity
        })}
      </p>
      {report.days.length === 0 ? (
        <InlineMessage tone="info" title={copy.empty} />
      ) : (
        <ScrollRegion label={m.tableRegion({ title: copy.byDay })}>
          <DataTable caption={copy.byDay} columns={columns} rows={report.days} rowKey={(row) => row.businessDate} />
        </ScrollRegion>
      )}
    </section>
  );
}
