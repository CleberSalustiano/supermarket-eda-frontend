import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { fetchServiceHealth } from '@supermarket/api-sdk';
import type { FrontendRuntimeConfig } from '@supermarket/frontend-config';
import {
  AppFrame,
  Button,
  ConnectionBanner,
  InlineMessage,
  LaneLight,
  Popover
} from '@supermarket/frontend-ui';

import { useI18n } from '../i18n';
import { CancelSaleDialog } from '../features/checkout/components/cancel-sale-dialog';
import { CloseRegisterDialog } from '../features/checkout/components/close-register-dialog';
import { LineItems } from '../features/checkout/components/line-items';
import { MobileActionBar } from '../features/checkout/components/mobile-action-bar';
import { NextStep } from '../features/checkout/components/next-step';
import { PaidStep } from '../features/checkout/components/paid-step';
import { PaymentStep } from '../features/checkout/components/payment-step';
import { ReceiptView } from '../features/checkout/components/receipt-view';
import { RegisterOpening } from '../features/checkout/components/register-opening';
import { SaleTotal } from '../features/checkout/components/sale-total';
import { Scanner } from '../features/checkout/components/scanner';
import { useCashierActions } from '../features/checkout/hooks/use-cashier-actions';
import { useCashierShortcuts } from '../features/checkout/hooks/use-cashier-shortcuts';
import { useCompactViewport } from '../features/checkout/hooks/use-compact-viewport';
import { usePaymentForm } from '../features/checkout/hooks/use-payment-form';
import { useTenantSelection } from '../features/checkout/hooks/use-tenant-override';

// Statically removed from production builds, so no developer tooling ships to users.
const CashierDevTools =
  import.meta.env.MODE === 'production'
    ? null
    : lazy(() =>
        import('../features/checkout/components/cashier-dev-tools').then((module) => ({
          default: module.CashierDevTools
        }))
      );

const HEALTH_REFETCH_INTERVAL_MS = 15_000;
const OPERATOR_PREFIX_LENGTH = 8;

export function CashierPage({ config }: { config: FrontendRuntimeConfig }) {
  const { m } = useI18n();
  const compact = useCompactViewport();
  const tenant = useTenantSelection(config);
  const actions = useCashierActions(config, tenant.tenantId);
  const { workspace, capabilities, mutations } = actions;
  const { activeSession, activeSale } = workspace;
  const { hasOpenSession, hasMutableSale, canStartSale, canProcessPayment, canCompleteSale, canCancelSale } =
    capabilities;

  const scannerRef = useRef<HTMLInputElement>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [actionsMenuKey, setActionsMenuKey] = useState(0);

  const payment = usePaymentForm(activeSale?.saleId ?? null, activeSale?.total ?? 0, (input) => {
    mutations.pay.mutate(input);
  });

  const healthQuery = useQuery({
    queryKey: ['service-health', 'checkout', config.serviceBaseUrls.checkout],
    queryFn: () => fetchServiceHealth('checkout', { baseUrl: config.serviceBaseUrls.checkout }),
    refetchInterval: HEALTH_REFETCH_INTERVAL_MS
  });

  const focusScanner = useCallback(() => {
    if (document.querySelector('dialog[open]') === null) {
      scannerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (hasMutableSale) {
      focusScanner();
    }
  }, [hasMutableSale, activeSale?.saleId, focusScanner]);

  const dialogOpen = cancelOpen || closeOpen;
  const dialogWasOpen = useRef(false);

  useEffect(() => {
    if (dialogWasOpen.current && !dialogOpen) {
      focusScanner();
    }

    dialogWasOpen.current = dialogOpen;
  }, [dialogOpen, focusScanner]);

  const startSale = useCallback(() => {
    mutations.start.mutate();
  }, [mutations.start]);

  const openCancelDialog = useCallback(() => {
    actions.clearFeedback('cancel');
    setCancelOpen(true);
  }, [actions]);

  const openCloseDialog = useCallback(() => {
    actions.clearFeedback('close');
    setCloseOpen(true);
  }, [actions]);

  useCashierShortcuts({
    canStartSale,
    canProcessPayment,
    canCompleteSale,
    canCancelSale,
    onStartSale: startSale,
    onPayment: payment.submitOrFocus,
    onCompleteSale: () => {
      mutations.complete.mutate();
    },
    onCancelSale: openCancelDialog,
    onEscape: () => {
      actions.clearScanPreview();
      focusScanner();
    }
  });

  const cartBusy = mutations.scan.isPending || mutations.add.isPending || mutations.remove.isPending;
  const registerLabel = activeSession?.registerId ?? config.checkoutRegisterId;
  const registerFeedback = actions.feedback.register;
  const paymentFeedback = actions.feedback.payment;
  const saleIsSettled =
    activeSale === null || activeSale.status === 'COMPLETED' || activeSale.status === 'CANCELED';

  const moreActions = (
    <Popover
      key={actionsMenuKey}
      triggerLabel={m.topBar.moreActions}
      triggerIcon={
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="4" cy="10" r="1.75" />
          <circle cx="10" cy="10" r="1.75" />
          <circle cx="16" cy="10" r="1.75" />
        </svg>
      }
    >
      <div className="flex flex-col items-start gap-2">
        <Button
          variant="quiet"
          onClick={() => {
            setActionsMenuKey((key) => key + 1);
            openCloseDialog();
          }}
        >
          {m.topBar.closeRegister}
        </Button>
        {canCancelSale ? (
          <Button
            variant="quiet"
            onClick={() => {
              setActionsMenuKey((key) => key + 1);
              openCancelDialog();
            }}
          >
            {m.cancel.open}
          </Button>
        ) : null}
      </div>
    </Popover>
  );

  const topBarEnd = (
    <>
      {registerLabel === null ? null : (
        <LaneLight
          state={hasOpenSession ? 'open' : 'closed'}
          label={m.topBar.register({ registerId: registerLabel })}
        />
      )}
      {hasOpenSession && activeSession !== null ? (
        <>
          {compact ? null : (
            <span className="text-body text-ink-muted tabular-nums">
              {m.topBar.operator({ id: activeSession.operatorId.slice(0, OPERATOR_PREFIX_LENGTH) })}
            </span>
          )}
          {compact ? (
            moreActions
          ) : (
            <Button variant="secondary" onClick={openCloseDialog}>
              {m.topBar.closeRegister}
            </Button>
          )}
        </>
      ) : null}
    </>
  );

  const banner = healthQuery.isError ? (
    <ConnectionBanner
      service="checkout"
      onRetry={() => {
        void healthQuery.refetch();
      }}
    />
  ) : undefined;

  const total = (
    <SaleTotal
      compact={compact}
      total={activeSale?.total ?? 0}
      itemCount={activeSale?.totalItemsQuantity ?? 0}
    />
  );

  function renderStep() {
    if (activeSale === null) {
      return (
        <NextStep
          state="no-sale"
          canStartSale={canStartSale}
          isStarting={mutations.start.isPending}
          onStartSale={startSale}
          showPrimaryAction={!compact}
        />
      );
    }

    if (activeSale.status === 'OPEN') {
      return activeSale.items.length === 0 ? (
        <NextStep state="empty-cart" canStartSale={false} isStarting={false} onStartSale={startSale} />
      ) : (
        <PaymentStep
          controller={payment}
          total={activeSale.total}
          isPending={mutations.pay.isPending}
          showPrimaryAction={!compact}
        />
      );
    }

    if (activeSale.status === 'PAID') {
      return (
        <PaidStep
          sale={activeSale}
          isPending={mutations.complete.isPending}
          showPrimaryAction={!compact}
          onComplete={() => {
            mutations.complete.mutate();
          }}
        />
      );
    }

    return (
      <>
        {activeSale.status === 'COMPLETED' && actions.receiptToDisplay !== null ? (
          <ReceiptView
            receipt={actions.receiptToDisplay}
            pendingSync={actions.completionResult?.eventPublicationStatus === 'pending'}
          />
        ) : null}
        {activeSale.status === 'CANCELED' ? (
          <InlineMessage
            tone="info"
            title={m.canceled.summary({ reason: activeSale.cancellationReason ?? '' })}
          >
            {activeSale.cancellationApprovedBy === null ? null : (
              <p className="text-small">
                {m.canceled.approvedBy({
                  name: activeSale.cancellationApprovedBy.fullName,
                  code: activeSale.cancellationApprovedBy.employeeCode
                })}
              </p>
            )}
          </InlineMessage>
        ) : null}
        <NextStep
          state="settled"
          canStartSale={canStartSale}
          isStarting={mutations.start.isPending}
          onStartSale={startSale}
          showPrimaryAction={!compact}
        />
      </>
    );
  }

  function renderMobileBar() {
    if (!compact || !hasOpenSession) {
      return null;
    }

    if (saleIsSettled) {
      return (
        <MobileActionBar
          label={m.next.newSale}
          shortcut="F2"
          disabled={!canStartSale || mutations.start.isPending}
          onAction={startSale}
        />
      );
    }

    if (canProcessPayment) {
      return (
        <MobileActionBar
          label={m.payment.submit}
          shortcut="F8"
          disabled={mutations.pay.isPending || payment.isShort}
          onAction={payment.submitOrFocus}
        />
      );
    }

    if (canCompleteSale) {
      return (
        <MobileActionBar
          label={m.paid.complete}
          shortcut="F9"
          disabled={mutations.complete.isPending}
          onAction={() => {
            mutations.complete.mutate();
          }}
        />
      );
    }

    return null;
  }

  const mobileBar = renderMobileBar();

  return (
    <AppFrame appName={m.app.name} topBarEnd={topBarEnd} banner={banner}>
      {!hasOpenSession || activeSession === null ? (
        <RegisterOpening
          config={config}
          closedSession={activeSession?.status === 'CLOSED' ? activeSession : null}
          feedback={registerFeedback}
          isPending={mutations.open.isPending}
          onOpen={(input) => {
            mutations.open.mutate(input);
          }}
        />
      ) : (
        <div className={mobileBar === null ? undefined : 'pb-24'}>
          {compact ? total : null}
          <div className="grid gap-6 pt-4 lg:grid-cols-12 lg:pt-0">
            <section className="flex flex-col gap-4 lg:col-span-7">
              <Scanner
                inputRef={scannerRef}
                enabled={hasMutableSale}
                isBusy={cartBusy}
                preview={actions.scanPreview}
                feedback={actions.feedback.scanner}
                onAdd={(barcode, quantity) => {
                  mutations.add.mutate({ barcode, quantity }, { onSettled: focusScanner });
                }}
                onPriceCheck={(barcode) => {
                  mutations.scan.mutate(barcode, { onSettled: focusScanner });
                }}
              />
              {activeSale === null ? null : (
                <LineItems
                  sale={activeSale}
                  lastAddedBarcode={actions.lastAddedBarcode}
                  canRemove={hasMutableSale && !cartBusy}
                  onRemove={(barcode) => {
                    mutations.remove.mutate({ barcode, quantity: 1 }, { onSettled: focusScanner });
                  }}
                />
              )}
              <div aria-live="polite" className="sr-only">
                {actions.announcement}
              </div>
            </section>

            <section className="flex flex-col gap-6 border-rule lg:col-span-5 lg:border-l lg:pl-6">
              {compact ? null : total}
              {registerFeedback === null ? null : (
                <InlineMessage
                  tone={registerFeedback.tone}
                  title={registerFeedback.title}
                  detail={registerFeedback.detail}
                  supportCode={registerFeedback.supportCode}
                />
              )}
              {paymentFeedback === null ? null : (
                <InlineMessage
                  tone={paymentFeedback.tone}
                  title={paymentFeedback.title}
                  detail={paymentFeedback.detail}
                  supportCode={paymentFeedback.supportCode}
                />
              )}
              {renderStep()}
              {canCancelSale && !compact ? (
                <div>
                  <Button variant="quiet" shortcut="F4" className="text-stop" onClick={openCancelDialog}>
                    {m.cancel.open}
                  </Button>
                </div>
              ) : null}
            </section>
          </div>

          <CancelSaleDialog
            open={cancelOpen}
            requiresManagerApproval={capabilities.requiresManagerApproval}
            isPending={mutations.cancel.isPending}
            feedback={actions.feedback.cancel}
            approvalFailureCount={actions.approvalFailureCount}
            onClose={() => {
              setCancelOpen(false);
            }}
            onConfirm={(values) => {
              mutations.cancel.mutate(values, {
                onSuccess: () => {
                  setCancelOpen(false);
                }
              });
            }}
          />
          <CloseRegisterDialog
            open={closeOpen}
            canClose={capabilities.canCloseSession}
            openingFloat={activeSession.openingFloatAmount}
            isPending={mutations.close.isPending}
            feedback={actions.feedback.close}
            onClose={() => {
              setCloseOpen(false);
            }}
            onConfirm={(input) => {
              mutations.close.mutate(input, {
                onSuccess: () => {
                  setCloseOpen(false);
                }
              });
            }}
          />
        </div>
      )}

      {mobileBar}

      {config.devToolsEnabled && CashierDevTools !== null ? (
        <Suspense fallback={null}>
          <CashierDevTools
            config={config}
            tenant={tenant}
            tenantLocked={hasOpenSession}
            onClearLocalData={actions.resetLocalData}
          />
        </Suspense>
      ) : null}
    </AppFrame>
  );
}
