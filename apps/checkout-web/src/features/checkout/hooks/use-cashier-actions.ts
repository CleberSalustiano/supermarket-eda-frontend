import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import {
  addCheckoutSaleItem,
  ApiClientError,
  cancelCheckoutSale,
  closeCheckoutPosSession,
  completeCheckoutSale,
  openCheckoutPosSession,
  processCheckoutSalePayment,
  removeCheckoutSaleItem,
  resolveApiClientCorrelationId,
  resolveApiClientErrorMessage,
  scanCheckoutCatalogItemByBarcode,
  startCheckoutSale,
  type CancelCheckoutSale,
  type CheckoutCatalogItem,
  type CheckoutSale,
  type CheckoutSalePaymentMethod,
  type CloseCheckoutPosSession,
  type CompleteCheckoutSale
} from '@supermarket/api-sdk';
import type { FrontendRuntimeConfig } from '@supermarket/frontend-config';
import { useUiMessages } from '@supermarket/frontend-ui';

import { useI18n, type CheckoutMessages } from '../../../i18n';
import { deriveCheckoutCapabilities, deriveRecoveredReceipt, isTerminalSale } from '../lib/sale-state';
import type { CheckoutWorkspaceState } from '../lib/workspace';
import type { CancelSaleFormValues } from '../schemas/checkout-forms';
import { usePersistedCheckoutWorkspace } from './use-persisted-checkout-workspace';

export type FeedbackArea = 'register' | 'scanner' | 'payment' | 'cancel' | 'close';

export interface CashierFeedback {
  tone: 'danger' | 'warning';
  title: string;
  detail?: string;
  supportCode?: string;
}

type ErrorAction = keyof CheckoutMessages['errors'];

export interface OpenSessionInput {
  registerId: string;
  operatorId: string;
  openingFloatAmount: number;
}

export interface PaymentInput {
  paymentMethod: CheckoutSalePaymentMethod;
  paidAmount: number;
}

export interface CloseSessionInput {
  declaredCashAmount: number;
}

export interface CartItemInput {
  barcode: string;
  quantity: number;
}

const NOT_FOUND_STATUS = 404;
const APPROVAL_DENIED_STATUS = 403;
const APPROVAL_LOCKED_STATUS = 429;
const APPROVAL_UNAVAILABLE_STATUS = 503;

function isApprovalFailure(error: unknown): error is ApiClientError {
  return (
    error instanceof ApiClientError &&
    [APPROVAL_DENIED_STATUS, APPROVAL_LOCKED_STATUS, APPROVAL_UNAVAILABLE_STATUS].includes(error.statusCode)
  );
}

export function useCashierActions(config: FrontendRuntimeConfig, tenantId: string) {
  const { m } = useI18n();
  const uiMessages = useUiMessages();
  const baseUrl = config.serviceBaseUrls.checkout;
  const requestOptions = { baseUrl };

  const [workspace, setWorkspace, resetWorkspace] = usePersistedCheckoutWorkspace(tenantId);
  const [feedback, setFeedback] = useState<Record<FeedbackArea, CashierFeedback | null>>({
    register: null,
    scanner: null,
    payment: null,
    cancel: null,
    close: null
  });
  const [scanPreview, setScanPreview] = useState<CheckoutCatalogItem | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [lastAddedBarcode, setLastAddedBarcode] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState<CompleteCheckoutSale | null>(null);
  const [cancellationResult, setCancellationResult] = useState<CancelCheckoutSale | null>(null);
  const [closureResult, setClosureResult] = useState<CloseCheckoutPosSession | null>(null);
  const [approvalFailureCount, setApprovalFailureCount] = useState(0);

  const activeSession = workspace.activeSession;
  const activeSale = workspace.activeSale;
  const capabilities = deriveCheckoutCapabilities(activeSession, activeSale);
  const requiresManagerApproval = capabilities.requiresManagerApproval;
  const receiptToDisplay = completionResult?.receipt ?? deriveRecoveredReceipt(activeSale);

  function setAreaFeedback(area: FeedbackArea, value: CashierFeedback | null): void {
    setFeedback((current) => ({ ...current, [area]: value }));
  }

  function failureFeedback(action: ErrorAction, error: unknown, barcode?: string): CashierFeedback {
    if (!(error instanceof ApiClientError)) {
      return { tone: 'danger', title: uiMessages.message.network };
    }

    if (barcode !== undefined && error.statusCode === NOT_FOUND_STATUS) {
      return { tone: 'danger', title: m.scanner.notFound({ code: barcode }) };
    }

    if (action === 'cancel' && isApprovalFailure(error)) {
      return approvalFailureFeedback(error);
    }

    return {
      tone: 'danger',
      title: m.errors[action],
      detail: resolveApiClientErrorMessage(error),
      supportCode: resolveApiClientCorrelationId(error)
    };
  }

  /** Approval failures never show the backend detail: the sale is unchanged and the cashier can retry. */
  function approvalFailureFeedback(error: ApiClientError): CashierFeedback {
    const supportCode = resolveApiClientCorrelationId(error);

    if (error.statusCode === APPROVAL_DENIED_STATUS) {
      return { tone: 'danger', title: m.cancel.approvalRejected, supportCode };
    }

    if (error.statusCode === APPROVAL_LOCKED_STATUS) {
      return { tone: 'warning', title: m.cancel.approvalLocked, supportCode };
    }

    return { tone: 'warning', title: m.cancel.approvalUnavailable, supportCode };
  }

  function updateSale(sale: CheckoutSale): void {
    setWorkspace((current) => ({ ...current, activeSale: sale }));
  }

  const open = useMutation({
    mutationFn: (values: OpenSessionInput) =>
      openCheckoutPosSession({ tenantId, ...values }, requestOptions),
    onMutate: () => setAreaFeedback('register', null),
    onSuccess: (response) => {
      setWorkspace((current: CheckoutWorkspaceState) => ({
        ...current,
        activeSession: response,
        activeSale: null
      }));
      setScanPreview(null);
      setCompletionResult(null);
      setCancellationResult(null);
      setClosureResult(null);
      setLastAddedBarcode(null);
    },
    onError: (error) => setAreaFeedback('register', failureFeedback('open', error))
  });

  const start = useMutation({
    mutationFn: () =>
      startCheckoutSale({ tenantId, sessionId: activeSession?.sessionId ?? '' }, requestOptions),
    onMutate: () => setAreaFeedback('register', null),
    onSuccess: (response) => {
      updateSale(response);
      setScanPreview(null);
      setCompletionResult(null);
      setCancellationResult(null);
      setLastAddedBarcode(null);
      setFeedback((current) => ({ ...current, payment: null, cancel: null, scanner: null }));
    },
    onError: (error) => setAreaFeedback('register', failureFeedback('start', error))
  });

  const scan = useMutation({
    mutationFn: (barcode: string) =>
      scanCheckoutCatalogItemByBarcode({ tenantId, barcode }, requestOptions),
    onMutate: () => setAreaFeedback('scanner', null),
    onSuccess: (response) => setScanPreview(response),
    onError: (error, barcode) => {
      setScanPreview(null);
      setAreaFeedback('scanner', failureFeedback('lookup', error, barcode));
    }
  });

  const add = useMutation({
    mutationFn: ({ barcode, quantity }: CartItemInput) =>
      addCheckoutSaleItem(
        { tenantId, saleId: activeSale?.saleId ?? '', barcode, quantity },
        requestOptions
      ),
    onMutate: () => setAreaFeedback('scanner', null),
    onSuccess: (response, { barcode, quantity }) => {
      updateSale(response);
      setScanPreview(null);
      setLastAddedBarcode(barcode);
      const name = response.items.find((item) => item.barcode === barcode)?.name ?? barcode;
      setAnnouncement(m.scanner.announceAdded({ name, count: quantity }));
    },
    onError: (error, { barcode }) =>
      setAreaFeedback('scanner', failureFeedback('add', error, barcode))
  });

  const remove = useMutation({
    mutationFn: ({ barcode, quantity }: CartItemInput) =>
      removeCheckoutSaleItem(
        { tenantId, saleId: activeSale?.saleId ?? '', barcode, quantity },
        requestOptions
      ),
    onMutate: () => setAreaFeedback('scanner', null),
    onSuccess: (response) => {
      updateSale(response);
      setScanPreview(null);
      setLastAddedBarcode(null);
    },
    onError: (error) => setAreaFeedback('scanner', failureFeedback('remove', error))
  });

  const pay = useMutation({
    mutationFn: (values: PaymentInput) =>
      processCheckoutSalePayment(
        {
          tenantId,
          saleId: activeSale?.saleId ?? '',
          paymentMethod: values.paymentMethod,
          paidAmount: values.paidAmount
        },
        requestOptions
      ),
    onMutate: () => setAreaFeedback('payment', null),
    onSuccess: updateSale,
    onError: (error) => setAreaFeedback('payment', failureFeedback('payment', error))
  });

  const complete = useMutation({
    mutationFn: () =>
      completeCheckoutSale({ tenantId, saleId: activeSale?.saleId ?? '' }, requestOptions),
    onMutate: () => setAreaFeedback('payment', null),
    onSuccess: (response) => {
      updateSale(response);
      setCompletionResult(response);
      setCancellationResult(null);
    },
    onError: (error) => setAreaFeedback('payment', failureFeedback('complete', error))
  });

  const cancel = useMutation({
    mutationFn: (values: CancelSaleFormValues) =>
      cancelCheckoutSale(
        {
          tenantId,
          saleId: activeSale?.saleId ?? '',
          reason: values.reason.trim(),
          ...(requiresManagerApproval
            ? {
                managerApproval: {
                  employeeCode: values.managerEmployeeCode.trim().toUpperCase(),
                  pin: values.managerPin
                }
              }
            : {})
        },
        requestOptions
      ),
    onMutate: () => setAreaFeedback('cancel', null),
    onSuccess: (response) => {
      updateSale(response);
      setCancellationResult(response);
      setCompletionResult(null);
    },
    onError: (error) => {
      setAreaFeedback('cancel', failureFeedback('cancel', error));
      if (isApprovalFailure(error)) {
        setApprovalFailureCount((count) => count + 1);
      }
    }
  });

  const close = useMutation({
    mutationFn: (values: CloseSessionInput) =>
      closeCheckoutPosSession(
        {
          tenantId,
          sessionId: activeSession?.sessionId ?? '',
          declaredCashAmount: values.declaredCashAmount
        },
        requestOptions
      ),
    onMutate: () => setAreaFeedback('close', null),
    onSuccess: (response) => {
      setWorkspace((current) => ({
        ...current,
        activeSession: response,
        activeSale:
          current.activeSale === null || !isTerminalSale(current.activeSale.status)
            ? null
            : current.activeSale
      }));
      setClosureResult(response);
      setScanPreview(null);
    },
    onError: (error) => setAreaFeedback('close', failureFeedback('close', error))
  });

  /** Clears the locally persisted session and sale; backend data is untouched. */
  function resetLocalData(): void {
    resetWorkspace();
    setScanPreview(null);
    setCompletionResult(null);
    setCancellationResult(null);
    setClosureResult(null);
    setLastAddedBarcode(null);
    setFeedback({ register: null, scanner: null, payment: null, cancel: null, close: null });
  }

  return {
    workspace,
    capabilities,
    feedback,
    scanPreview,
    clearScanPreview: () => setScanPreview(null),
    clearFeedback: (area: FeedbackArea) => setAreaFeedback(area, null),
    announcement,
    lastAddedBarcode,
    completionResult,
    cancellationResult,
    closureResult,
    approvalFailureCount,
    receiptToDisplay,
    mutations: { open, start, scan, add, remove, pay, complete, cancel, close },
    resetLocalData
  };
}
