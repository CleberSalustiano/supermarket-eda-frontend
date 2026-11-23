import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addRecentProduct,
  maxRecentProducts,
  readRecentProducts,
  recentProductsStorageKey,
  writeRecentProducts,
  type RecentProduct
} from './recent-products';

const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';

function product(index: number, overrides: Partial<RecentProduct> = {}): RecentProduct {
  return {
    productId: `product-${index}`,
    name: `Product ${index}`,
    barcode: `789000${index}`,
    unitOfMeasure: 'UN',
    currentPrice: index,
    updatedAt: '2026-11-22T12:00:00.000Z',
    ...overrides
  };
}

describe('recent products', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('puts the newest first and deduplicates by product id', () => {
    const list = addRecentProduct([product(1), product(2)], product(1, { currentPrice: 99 }));

    expect(list.map((entry) => entry.productId)).toEqual(['product-1', 'product-2']);
    expect(list[0]?.currentPrice).toBe(99);
  });

  it('keeps at most 20 entries', () => {
    let list: RecentProduct[] = [];

    for (let index = 1; index <= maxRecentProducts + 5; index += 1) {
      list = addRecentProduct(list, product(index));
    }

    expect(list).toHaveLength(maxRecentProducts);
    expect(list[0]?.productId).toBe(`product-${maxRecentProducts + 5}`);
  });

  it('persists per tenant and reads back', () => {
    writeRecentProducts(tenantId, [product(1)]);

    expect(window.localStorage.getItem(recentProductsStorageKey(tenantId))).not.toBeNull();
    expect(readRecentProducts(tenantId)).toEqual([product(1)]);
    expect(readRecentProducts('another-tenant')).toEqual([]);
  });

  it('ignores corrupt stored data', () => {
    window.localStorage.setItem(recentProductsStorageKey(tenantId), '{not json');
    expect(readRecentProducts(tenantId)).toEqual([]);

    window.localStorage.setItem(recentProductsStorageKey(tenantId), JSON.stringify([{ productId: 1 }, product(3)]));
    expect(readRecentProducts(tenantId)).toEqual([product(3)]);
  });

  it('does not throw when storage fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(readRecentProducts(tenantId)).toEqual([]);
    expect(() => writeRecentProducts(tenantId, [product(1)])).not.toThrow();
  });
});
