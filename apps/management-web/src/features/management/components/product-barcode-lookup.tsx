import { ApiClientError, scanCheckoutCatalogItemByBarcode } from '@supermarket/api-sdk';
import { Button, InlineMessage, PriceTag, TextField } from '@supermarket/frontend-ui';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useI18n } from '../../../i18n';
import type { RecentProduct } from '../lib/recent-products';
import { useManagement } from '../management-context';
import { ApiErrorMessage } from './api-error-message';

export function ProductBarcodeLookup({ onFound }: { onFound: (product: RecentProduct) => void }) {
  const { m, fmt } = useI18n();
  const { tenantId, checkoutBaseUrl } = useManagement();
  const [barcode, setBarcode] = useState('');
  const copy = m.products.price;

  const lookup = useMutation({
    mutationFn: (code: string) => scanCheckoutCatalogItemByBarcode({ tenantId, barcode: code }, { baseUrl: checkoutBaseUrl }),
    onSuccess: (item) => {
      onFound({
        productId: item.productId,
        name: item.name,
        barcode: item.barcode,
        unitOfMeasure: item.unitOfMeasure,
        currentPrice: item.unitPrice,
        updatedAt: item.priceUpdatedAt
      });
    }
  });

  const notFound = lookup.error instanceof ApiClientError && lookup.error.statusCode === 404;

  function search() {
    const code = barcode.trim();

    if (code.length > 0) {
      lookup.mutate(code);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <TextField
          className="flex-1"
          label={copy.searchBarcode}
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              search();
            }
          }}
        />
        <Button variant="secondary" onClick={search} disabled={lookup.isPending}>
          {copy.search}
        </Button>
      </div>
      {lookup.isSuccess ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-body">{copy.lookupCurrent({ amount: fmt.currency(lookup.data.unitPrice) })}</p>
          <PriceTag value={lookup.data.unitPrice} size="md" label={lookup.data.name} />
        </div>
      ) : null}
      {notFound ? <InlineMessage tone="warning" title={copy.lookupNotFound} /> : null}
      {lookup.isError && !notFound ? <ApiErrorMessage title={copy.error} error={lookup.error} /> : null}
    </div>
  );
}
