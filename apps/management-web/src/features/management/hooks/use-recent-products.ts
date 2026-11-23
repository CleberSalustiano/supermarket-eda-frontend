import { useCallback, useEffect, useState } from 'react';

import {
  addRecentProduct,
  readRecentProducts,
  writeRecentProducts,
  type RecentProduct
} from '../lib/recent-products';

export function useRecentProducts(tenantId: string): {
  recentProducts: RecentProduct[];
  remember: (entry: RecentProduct) => void;
} {
  const [recentProducts, setRecentProducts] = useState(() => readRecentProducts(tenantId));

  useEffect(() => {
    setRecentProducts(readRecentProducts(tenantId));
  }, [tenantId]);

  const remember = useCallback(
    (entry: RecentProduct) => {
      setRecentProducts((current) => {
        const next = addRecentProduct(current, entry);

        writeRecentProducts(tenantId, next);

        return next;
      });
    },
    [tenantId]
  );

  return { recentProducts, remember };
}
