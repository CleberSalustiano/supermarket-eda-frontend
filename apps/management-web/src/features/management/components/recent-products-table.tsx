import { Button, DataTable, type DataTableColumn } from '@supermarket/frontend-ui';

import { useI18n } from '../../../i18n';
import type { RecentProduct } from '../lib/recent-products';
import { ScrollRegion } from './scroll-region';

export function RecentProductsTable({
  products,
  onChangePrice
}: {
  products: RecentProduct[];
  onChangePrice: (product: RecentProduct) => void;
}) {
  const { m, fmt } = useI18n();
  const copy = m.products.recent;

  const columns: DataTableColumn<RecentProduct>[] = [
    { key: 'name', header: copy.colProduct, render: (row) => row.name },
    { key: 'barcode', header: copy.colBarcode, render: (row) => row.barcode },
    { key: 'price', header: copy.colPrice, align: 'right', render: (row) => fmt.currency(row.currentPrice) },
    {
      key: 'action',
      header: copy.action,
      render: (row) => (
        <Button variant="quiet" aria-label={copy.actionAria({ name: row.name })} onClick={() => onChangePrice(row)}>
          {copy.action}
        </Button>
      )
    }
  ];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-heading">{copy.title}</h2>
      {products.length === 0 ? (
        <p className="text-body text-ink-muted">{copy.empty}</p>
      ) : (
        <ScrollRegion label={m.tableRegion({ title: copy.title })}>
          <DataTable columns={columns} rows={products} rowKey={(row) => row.productId} />
        </ScrollRegion>
      )}
    </section>
  );
}
