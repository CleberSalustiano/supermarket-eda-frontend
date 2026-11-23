export type RecentProduct = {
  productId: string;
  name: string;
  barcode: string;
  unitOfMeasure: string;
  currentPrice: number;
  updatedAt: string;
};

export const maxRecentProducts = 20;

export const recentProductsStorageKeyPrefix = 'supermarket.management.recentProducts.';

export function recentProductsStorageKey(tenantId: string): string {
  return `${recentProductsStorageKeyPrefix}${tenantId}`;
}

function isRecentProduct(value: unknown): value is RecentProduct {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.productId === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.barcode === 'string' &&
    typeof candidate.unitOfMeasure === 'string' &&
    typeof candidate.currentPrice === 'number' &&
    typeof candidate.updatedAt === 'string'
  );
}

export function readRecentProducts(tenantId: string): RecentProduct[] {
  try {
    const raw = window.localStorage.getItem(recentProductsStorageKey(tenantId));

    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter(isRecentProduct).slice(0, maxRecentProducts) : [];
  } catch {
    return [];
  }
}

export function writeRecentProducts(tenantId: string, products: RecentProduct[]): void {
  try {
    window.localStorage.setItem(recentProductsStorageKey(tenantId), JSON.stringify(products));
  } catch {
    // Storage can be unavailable (private mode); recents are simply not persisted.
  }
}

/** Newest first, deduplicated by productId, capped at maxRecentProducts. */
export function addRecentProduct(products: RecentProduct[], entry: RecentProduct): RecentProduct[] {
  return [entry, ...products.filter((product) => product.productId !== entry.productId)].slice(
    0,
    maxRecentProducts
  );
}
