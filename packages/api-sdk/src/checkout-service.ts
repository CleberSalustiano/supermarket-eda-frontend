import { withTenantIdInBody } from '@supermarket/frontend-tenant';

import { backendServices } from './backend-services';
import { requestJson, type ApiRequestOptions } from './http-client';

export type CheckoutPosSessionStatus = 'OPEN' | 'CLOSED';
export type CheckoutSaleStatus = 'OPEN' | 'PAID' | 'COMPLETED' | 'CANCELED';
export type CheckoutEventPublicationStatus = 'published' | 'pending';
export const checkoutSalePaymentMethods = [
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX',
  'VOUCHER'
] as const;
export type CheckoutSalePaymentMethod = (typeof checkoutSalePaymentMethods)[number];

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

export interface ProcessCheckoutSalePaymentInput {
  tenantId: string;
  saleId: string;
  paymentMethod: CheckoutSalePaymentMethod;
  paidAmount: number;
}

export interface CompleteCheckoutSaleInput {
  tenantId: string;
  saleId: string;
}

export interface CancelCheckoutSaleInput {
  tenantId: string;
  saleId: string;
  reason: string;
  managerApprovalCode?: string;
}

export interface CloseCheckoutPosSessionInput {
  tenantId: string;
  sessionId: string;
  declaredCashAmount: number;
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
  paymentMethod: CheckoutSalePaymentMethod | null;
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

export interface CheckoutSaleReceipt {
  saleId: string;
  tenantId: string;
  sessionId: string;
  paymentMethod: CheckoutSalePaymentMethod;
  paidAmount: number;
  changeAmount: number;
  totalItemsQuantity: number;
  total: number;
  completedAt: string;
  issuedAt: string;
  items: CheckoutSaleItem[];
}

export interface CompleteCheckoutSale extends CheckoutSale {
  eventPublicationStatus: CheckoutEventPublicationStatus;
  receipt: CheckoutSaleReceipt;
}

export interface CancelCheckoutSale extends CheckoutSale {
  eventPublicationStatus: CheckoutEventPublicationStatus;
}

export interface CloseCheckoutPosSession {
  sessionId: string;
  tenantId: string;
  registerId: string;
  operatorId: string;
  openingFloatAmount: number;
  declaredCashAmount: number;
  status: CheckoutPosSessionStatus;
  openedAt: string;
  closedAt: string;
  createdAt: string;
  updatedAt: string;
  eventPublicationStatus: CheckoutEventPublicationStatus;
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

export async function processCheckoutSalePayment(
  input: ProcessCheckoutSalePaymentInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CheckoutSale> {
  return requestJson<CheckoutSale>(
    'checkout',
    backendServices.checkout.routes.processSalePayment(input.saleId),
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody(
        {
          paymentMethod: input.paymentMethod,
          paidAmount: input.paidAmount
        },
        input.tenantId
      )
    }
  );
}

export async function completeCheckoutSale(
  input: CompleteCheckoutSaleInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CompleteCheckoutSale> {
  return requestJson<CompleteCheckoutSale>(
    'checkout',
    backendServices.checkout.routes.completeSale(input.saleId),
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody({}, input.tenantId)
    }
  );
}

export async function cancelCheckoutSale(
  input: CancelCheckoutSaleInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CancelCheckoutSale> {
  return requestJson<CancelCheckoutSale>(
    'checkout',
    backendServices.checkout.routes.cancelSale(input.saleId),
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody(
        {
          reason: input.reason,
          ...(input.managerApprovalCode === undefined
            ? {}
            : { managerApprovalCode: input.managerApprovalCode })
        },
        input.tenantId
      )
    }
  );
}

export async function closeCheckoutPosSession(
  input: CloseCheckoutPosSessionInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<CloseCheckoutPosSession> {
  return requestJson<CloseCheckoutPosSession>(
    'checkout',
    backendServices.checkout.routes.closePosSession(input.sessionId),
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody(
        {
          declaredCashAmount: input.declaredCashAmount
        },
        input.tenantId
      )
    }
  );
}
