import { withTenantIdInBody } from '@supermarket/frontend-tenant';

import { backendServices } from './backend-services';
import { requestJson, type ApiRequestOptions } from './http-client';

export type CheckoutPosSessionStatus = 'OPEN' | 'CLOSED';
export type CheckoutSaleStatus = 'OPEN' | 'PAID' | 'COMPLETED' | 'CANCELED';

export interface CheckoutCatalogItem {
  productId: string;
  tenantId: string;
  barcode: string;
  name: string;
  unitOfMeasure: string;
  unitPrice: number;
  active: boolean;
  priceUpdatedAt: string;
}

export interface OpenCheckoutPosSessionInput {
  tenantId: string;
  registerId: string;
  operatorId: string;
  openingFloatAmount: number;
}

export interface CheckoutPosSession {
  sessionId: string;
  tenantId: string;
  registerId: string;
  operatorId: string;
  openingFloatAmount: number;
  declaredCashAmount: number | null;
  status: CheckoutPosSessionStatus;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartCheckoutSaleInput {
  tenantId: string;
  sessionId: string;
}

export interface ManageCheckoutSaleItemInput {
  tenantId: string;
  saleId: string;
  barcode: string;
  quantity: number;
}

export interface CheckoutSaleItem {
  productId: string;
  barcode: string;
  name: string;
  unitOfMeasure: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutSale {
  saleId: string;
  tenantId: string;
  sessionId: string;
  status: CheckoutSaleStatus;
  paymentMethod: string | null;
  paidAmount: number | null;
  changeAmount: number | null;
  paidAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  cancellationReason: string | null;
  totalItemsQuantity: number;
  subtotal: number;
  total: number;
  items: CheckoutSaleItem[];
  createdAt: string;
  updatedAt: string;
}

export async function scanCheckoutCatalogItemByBarcode(
  input: Pick<CheckoutCatalogItem, 'tenantId' | 'barcode'>,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CheckoutCatalogItem> {
  return requestJson<CheckoutCatalogItem>(
    'checkout',
    backendServices.checkout.routes.scanCatalogItemByBarcode(input.barcode),
    {
      ...options,
      tenantId: input.tenantId
    }
  );
}

export async function openCheckoutPosSession(
  input: OpenCheckoutPosSessionInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CheckoutPosSession> {
  return requestJson<CheckoutPosSession>('checkout', backendServices.checkout.routes.openPosSession, {
    ...options,
    method: 'POST',
    body: withTenantIdInBody(
      {
        registerId: input.registerId,
        operatorId: input.operatorId,
        openingFloatAmount: input.openingFloatAmount
      },
      input.tenantId
    )
  });
}

export async function startCheckoutSale(
  input: StartCheckoutSaleInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CheckoutSale> {
  return requestJson<CheckoutSale>('checkout', backendServices.checkout.routes.startSale, {
    ...options,
    method: 'POST',
    body: withTenantIdInBody(
      {
        sessionId: input.sessionId
      },
      input.tenantId
    )
  });
}

export async function addCheckoutSaleItem(
  input: ManageCheckoutSaleItemInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CheckoutSale> {
  return requestJson<CheckoutSale>('checkout', backendServices.checkout.routes.addSaleItem(input.saleId), {
    ...options,
    method: 'POST',
    body: withTenantIdInBody(
      {
        barcode: input.barcode,
        quantity: input.quantity
      },
      input.tenantId
    )
  });
}

export async function removeCheckoutSaleItem(
  input: ManageCheckoutSaleItemInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CheckoutSale> {
  return requestJson<CheckoutSale>(
    'checkout',
    backendServices.checkout.routes.removeSaleItem(input.saleId),
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody(
        {
          barcode: input.barcode,
          quantity: input.quantity
        },
        input.tenantId
      )
    }
  );
}
