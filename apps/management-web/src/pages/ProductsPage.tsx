import { useRef, useState } from 'react';

import { PageTitle } from '../features/management/components/page-title';
import { RecentProductsTable } from '../features/management/components/recent-products-table';
import { RegisterProductForm } from '../features/management/components/register-product-form';
import { UpdatePriceForm } from '../features/management/components/update-price-form';
import { useRecentProducts } from '../features/management/hooks/use-recent-products';
import { useManagement } from '../features/management/management-context';
import { useI18n } from '../i18n';

export function ProductsPage() {
  const { m } = useI18n();
  const { tenantId } = useManagement();
  const { recentProducts, remember } = useRecentProducts(tenantId);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const priceInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="mx-auto flex max-w-[1040px] flex-col gap-6">
      <PageTitle>{m.nav.products}</PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <RegisterProductForm
          onRegistered={(product) => {
            remember(product);
            setSelectedProductId(product.productId);
            setSelectionRevision((current) => current + 1);
          }}
        />
        <UpdatePriceForm
          recentProducts={recentProducts}
          selectedProductId={selectedProductId}
          selectionRevision={selectionRevision}
          priceInputRef={priceInputRef}
          onSelect={(product) => {
            setSelectedProductId(product.productId);
          }}
          onUpdated={remember}
        />
      </div>
      <RecentProductsTable
        products={recentProducts}
        onChangePrice={(product) => {
          setSelectedProductId(product.productId);
          setSelectionRevision((current) => current + 1);
          priceInputRef.current?.focus();
        }}
      />
    </div>
  );
}
