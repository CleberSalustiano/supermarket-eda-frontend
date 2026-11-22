import { useState } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addCheckoutSaleItem,
  cancelCheckoutSale,
  closeCheckoutPosSession,
  completeCheckoutSale,
  fetchServiceHealth,
  openCheckoutPosSession,
  processCheckoutSalePayment,
  removeCheckoutSaleItem,
  resolveApiClientCorrelationId,
  resolveApiClientErrorMessage,
  scanCheckoutCatalogItemByBarcode,
  startCheckoutSale,
  type CancelCheckoutSale,
  type CheckoutCatalogItem,
  type CompleteCheckoutSale,
  type CheckoutSale,
  type CloseCheckoutPosSession
} from '@supermarket/api-sdk';
import {
  ActionCard,
  AppSection,
  AppShell,
  MetricCard,
  StatusPill
} from '@supermarket/frontend-ui';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { Boxes, CreditCard, Receipt, ReceiptText } from 'lucide-react';
import type { z } from 'zod';

import { checkoutServiceBaseUrl } from '../environment';
import { CancellationClosurePanel } from '../features/checkout/components/cancellation-closure-panel';
import { RouteInventorySection } from '../features/checkout/components/route-inventory-section';
import { PaymentCompletionPanel } from '../features/checkout/components/payment-completion-panel';
import {
  CheckoutFormCard,
  DefinitionList,
  FeedbackBanner,
  FormField,
  PrimaryButton,
  SecondaryButton,
  SectionIntro,
  TextInput
} from '../features/checkout/components/form-primitives';
import { usePersistedCheckoutWorkspace } from '../features/checkout/hooks/use-persisted-checkout-workspace';
import { actionCards, navigationItems } from '../features/checkout/lib/dashboard-content';
import { submitSchemaValidatedForm } from '../features/checkout/lib/form-validation';
import {
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
  shortenUuid
} from '../features/checkout/lib/formatters';
import {
  buildSaleDefinitionItems,
  deriveCheckoutCapabilities,
  deriveRecoveredReceipt,
  isTerminalSale,
  resolveSaleStatusTone
} from '../features/checkout/lib/sale-state';
import {
  defaultCheckoutOperatorId,
  defaultCheckoutRegisterId,
  defaultCheckoutTenantId
} from '../features/checkout/lib/workspace';
import {
  cartMutationFormSchema,
  openSessionFormSchema,
  tenantIdSchema,
  type CancelSaleFormValues,
  type CartMutationFormValues,
  type CloseSessionFormValues,
  type OpenSessionFormValues,
  type PaymentFormValues
} from '../features/checkout/schemas/checkout-forms';

export function CheckoutDashboardPage() {
  const [workspace, setWorkspace, resetWorkspace] = usePersistedCheckoutWorkspace();
  const [feedback, setFeedback] = useState<CheckoutFeedback | null>(null);
  const [scanPreview, setScanPreview] = useState<CheckoutCatalogItem | null>(null);
  const [completionResult, setCompletionResult] = useState<CompleteCheckoutSale | null>(null);
  const [cancellationResult, setCancellationResult] = useState<CancelCheckoutSale | null>(null);
  const [closureResult, setClosureResult] = useState<CloseCheckoutPosSession | null>(null);

  const openSessionForm = useForm<OpenSessionFormValues>({
    defaultValues: {
      registerId: defaultCheckoutRegisterId,
      operatorId: defaultCheckoutOperatorId,
      openingFloatAmount: '150.00'
    }
  });

  const cartMutationForm = useForm<CartMutationFormValues>({
    defaultValues: {
      barcode: '',
      quantity: '1'
    }
  });

  const paymentForm = useForm<PaymentFormValues>({
    defaultValues: {
      paymentMethod: 'CASH',
      paidAmount: ''
    }
  });

  const cancelSaleForm = useForm<CancelSaleFormValues>({
    defaultValues: {
      reason: '',
      managerApprovalCode: ''
    }
  });

  const closeSessionForm = useForm<CloseSessionFormValues>({
    defaultValues: {
      declaredCashAmount: '150.00'
    }
  });

  const healthQuery = useQuery({
    queryKey: ['service-health', 'checkout'],
    queryFn: () => fetchServiceHealth('checkout', { baseUrl: checkoutServiceBaseUrl })
  });

  const tenantValidation = tenantIdSchema.safeParse(workspace.tenantId);
  const tenantErrorMessage = tenantValidation.success
    ? undefined
    : tenantValidation.error.issues[0]?.message ?? 'Tenant id must be a valid UUID.';

  const activeSession = workspace.activeSession;
  const activeSale = workspace.activeSale;
  const capabilities = deriveCheckoutCapabilities(activeSession, activeSale);
  const { hasOpenSession, hasMutableSale, canStartSale } = capabilities;
  const formsLocked = !tenantValidation.success;
  const tenantLocked = hasOpenSession;
  const recoveredReceipt = deriveRecoveredReceipt(activeSale);
  const receiptToDisplay = completionResult?.receipt ?? recoveredReceipt;

  const openSessionMutation = useMutation({
    mutationFn: (values: OpenSessionFormValues) =>
      openCheckoutPosSession(
        {
          tenantId: workspace.tenantId,
          registerId: values.registerId.trim(),
          operatorId: values.operatorId.trim(),
          openingFloatAmount: Number.parseFloat(values.openingFloatAmount)
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        tenantId: response.tenantId,
        activeSession: response,
        activeSale: null
      }));
      closeSessionForm.setValue('declaredCashAmount', response.openingFloatAmount.toFixed(2), {
        shouldDirty: false,
        shouldValidate: false
      });
      setScanPreview(null);
      setCompletionResult(null);
      setCancellationResult(null);
      setClosureResult(null);
      setFeedback({
        tone: 'success',
        title: 'Session opened',
        description: `Register ${response.registerId} is now open for operator ${shortenUuid(response.operatorId)}.`,
        detail: `Session id ${response.sessionId}`
      });
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Session opening failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const startSaleMutation = useMutation({
    mutationFn: () =>
      startCheckoutSale(
        {
          tenantId: workspace.tenantId,
          sessionId: activeSession?.sessionId ?? ''
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        activeSale: response
      }));
      resetSaleForms();
      setScanPreview(null);
      setCompletionResult(null);
      setCancellationResult(null);
      setFeedback({
        tone: 'success',
        title: 'Sale started',
        description: 'The sale is now open and ready for barcode-driven cart mutations.',
        detail: `Sale id ${response.saleId}`
      });
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Sale start failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const scanItemMutation = useMutation({
    mutationFn: (values: CartMutationFormValues) =>
      scanCheckoutCatalogItemByBarcode(
        {
          tenantId: workspace.tenantId,
          barcode: values.barcode.trim()
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setScanPreview(response);
      setFeedback({
        tone: 'success',
        title: 'Catalog item resolved',
        description: `${response.name} is available locally for sale at ${formatCurrency(response.unitPrice)}.`,
        detail: `${response.barcode} · ${response.unitOfMeasure}`
      });
    },
    onError: (error) => {
      setScanPreview(null);
      setFeedback({
        tone: 'danger',
        title: 'Catalog lookup failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const addItemMutation = useMutation({
    mutationFn: (values: CartMutationFormValues) =>
      addCheckoutSaleItem(
        {
          tenantId: workspace.tenantId,
          saleId: activeSale?.saleId ?? '',
          barcode: values.barcode.trim(),
          quantity: Number.parseInt(values.quantity, 10)
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      handleSaleMutationSuccess(response, 'Item added to sale');
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Item addition failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: (values: CartMutationFormValues) =>
      removeCheckoutSaleItem(
        {
          tenantId: workspace.tenantId,
          saleId: activeSale?.saleId ?? '',
          barcode: values.barcode.trim(),
          quantity: Number.parseInt(values.quantity, 10)
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      handleSaleMutationSuccess(response, 'Item removed from sale');
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Item removal failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: (values: PaymentFormValues) =>
      processCheckoutSalePayment(
        {
          tenantId: workspace.tenantId,
          saleId: activeSale?.saleId ?? '',
          paymentMethod: values.paymentMethod,
          paidAmount: Number.parseFloat(values.paidAmount)
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        activeSale: response
      }));
      const paymentMethodLabel =
        response.paymentMethod === null ? 'Payment' : formatPaymentMethod(response.paymentMethod);
      setFeedback({
        tone: 'success',
        title: 'Payment captured',
        description: `${paymentMethodLabel} was recorded for ${formatCurrency(response.total)}.`,
        detail:
          response.changeAmount === null
            ? `Sale id ${response.saleId}`
            : `Change ${formatCurrency(response.changeAmount)}`
      });
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Payment failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const completeSaleMutation = useMutation({
    mutationFn: () =>
      completeCheckoutSale(
        {
          tenantId: workspace.tenantId,
          saleId: activeSale?.saleId ?? ''
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        activeSale: response
      }));
      setCompletionResult(response);
      setCancellationResult(null);
      setFeedback({
        tone: 'success',
        title: 'Sale completed',
        description: `Receipt issued for ${formatCurrency(response.receipt.total)} with ${response.receipt.totalItemsQuantity} units.`,
        detail: `Event ${response.eventPublicationStatus}`
      });
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Sale completion failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const cancelSaleMutation = useMutation({
    mutationFn: (values: CancelSaleFormValues) =>
      cancelCheckoutSale(
        {
          tenantId: workspace.tenantId,
          saleId: activeSale?.saleId ?? '',
          reason: values.reason.trim(),
          ...(values.managerApprovalCode.trim().length === 0
            ? {}
            : { managerApprovalCode: values.managerApprovalCode.trim() })
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        activeSale: response
      }));
      setCancellationResult(response);
      setCompletionResult(null);
      setFeedback({
        tone: 'warning',
        title: 'Sale canceled',
        description: `Sale ${response.saleId} was canceled with reason "${response.cancellationReason ?? 'Not provided'}".`,
        detail: `Event ${response.eventPublicationStatus}`
      });
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Cancellation failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  const closeSessionMutation = useMutation({
    mutationFn: (values: CloseSessionFormValues) =>
      closeCheckoutPosSession(
        {
          tenantId: workspace.tenantId,
          sessionId: activeSession?.sessionId ?? '',
          declaredCashAmount: Number.parseFloat(values.declaredCashAmount)
        },
        {
          baseUrl: checkoutServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        activeSession: response,
        activeSale:
          currentWorkspace.activeSale === null ||
          !isTerminalSale(currentWorkspace.activeSale.status)
            ? null
            : currentWorkspace.activeSale
      }));
      setClosureResult(response);
      setFeedback({
        tone: 'success',
        title: 'Session closed',
        description: `Register ${response.registerId} was closed with declared cash ${formatCurrency(response.declaredCashAmount)}.`,
        detail: `Event ${response.eventPublicationStatus}`
      });
    },
    onError: (error) => {
      setFeedback({
        tone: 'danger',
        title: 'Register closure failed',
        description: resolveApiClientErrorMessage(error),
        detail: resolveApiClientCorrelationId(error)
      });
    }
  });

  function handleSaleMutationSuccess(sale: CheckoutSale, title: string): void {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      activeSale: sale
    }));
    cartMutationForm.reset({
      barcode: '',
      quantity: '1'
    });
    setScanPreview(null);
    setFeedback({
      tone: 'success',
      title,
      description: `Sale total is now ${formatCurrency(sale.total)} across ${sale.totalItemsQuantity} units.`,
      detail: `Sale id ${sale.saleId}`
    });
  }

  function setTenantId(value: string): void {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      tenantId: value
    }));
  }

  function resetSaleForms(): void {
    paymentForm.reset({ paymentMethod: 'CASH', paidAmount: '' });
    cancelSaleForm.reset({ reason: '', managerApprovalCode: '' });
  }

  function clearTerminalSale(): void {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      activeSale: null
    }));
    resetSaleForms();
    setScanPreview(null);
    setFeedback({
      tone: 'warning',
      title: 'Terminal sale cleared locally',
      description: 'The local checkout workspace now focuses on the current session only.',
      detail: 'This does not change backend data.'
    });
  }

  const cartMutationPendingState =
    scanItemMutation.isPending || addItemMutation.isPending || removeItemMutation.isPending;

  return (
    <AppShell
      eyebrow="Checkout Web"
      title="Checkout execution now reaches terminal flows."
      description="This screen keeps the cashier workflow sparse and fast, while using live backend mutations from session startup all the way to payment, completion, cancellation, and closure."
      navigationItems={navigationItems.map((item) => ({ ...item }))}
      sidebarFooter={
        <div className="space-y-3 rounded-2xl border border-line bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">API target</p>
          <p className="font-mono text-sm text-ink">{checkoutServiceBaseUrl}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={tenantValidation.success ? 'success' : 'warning'}>
              {tenantValidation.success ? 'Tenant ready' : 'Tenant invalid'}
            </StatusPill>
            <StatusPill tone={hasOpenSession ? 'success' : 'warning'}>
              {hasOpenSession ? 'Session open' : 'No open session'}
            </StatusPill>
            <StatusPill tone={resolveSaleStatusTone(activeSale?.status)}>
              {activeSale === null ? 'No active sale' : `Sale ${activeSale.status}`}
            </StatusPill>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Live write flows"
            value="7 mutations"
            detail="Session opening, sale changes, payment, completion, cancellation, and closure now submit against the running checkout backend."
            icon={<Receipt className="size-5" />}
          />
          <MetricCard
            label="Local continuity"
            value="Persisted workspace"
            detail="Tenant, session, and sale context survive a refresh while read endpoints still catch up."
            icon={<Boxes className="size-5" />}
            tone="accent"
          />
          <MetricCard
            label="Terminal support"
            value="Receipt ready"
            detail="Receipt and closure summaries remain visible on the cashier surface once the terminal actions succeed."
            icon={<CreditCard className="size-5" />}
          />
        </div>

        <AppSection
          title="Workspace control"
          description="The current backend is tenant-aware but still unauthenticated, so this cashier surface keeps tenant targeting and restored workspace state explicit."
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <SectionIntro
                icon={<ReceiptText className="size-5" />}
                title="Tenant, health, and local continuity"
                description="Keep one demo tenant active during evaluation, then move to a real store tenant later. The local workspace is intentionally visible because read endpoints are still limited."
              />
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <FormField
                  label="Tenant id"
                  hint={tenantLocked ? 'Locked while a session is open' : 'Required for every checkout request'}
                  error={tenantErrorMessage}
                >
                  <TextInput
                    value={workspace.tenantId}
                    disabled={tenantLocked}
                    onChange={(event) => {
                      setTenantId(event.target.value.trim());
                    }}
                    placeholder={defaultCheckoutTenantId}
                  />
                </FormField>
                <div className="flex items-end">
                  <SecondaryButton
                    type="button"
                    disabled={tenantLocked}
                    onClick={() => {
                      setTenantId(defaultCheckoutTenantId);
                    }}
                  >
                    Reset demo tenant
                  </SecondaryButton>
                </div>
                <div className="flex items-end">
                  {healthQuery.isPending ? <StatusPill tone="warning">Checking</StatusPill> : null}
                  {healthQuery.isError ? <StatusPill tone="danger">Unavailable</StatusPill> : null}
                  {healthQuery.isSuccess ? <StatusPill tone="success">Healthy</StatusPill> : null}
                </div>
              </div>

              {!tenantValidation.success ? (
                <FeedbackBanner
                  tone="warning"
                  title="Fix the tenant id before opening a session"
                  description="The checkout backend validates tenant ids as UUID v4 values. Leaving this invalid guarantees request failure."
                />
              ) : null}

              {feedback === null ? null : (
                <FeedbackBanner
                  tone={feedback.tone}
                  title={feedback.title}
                  description={feedback.description}
                  detail={feedback.detail}
                />
              )}
            </div>

            <div className="space-y-4 rounded-3xl border border-line bg-stone-950 px-5 py-4 text-stone-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                  Restored workspace
                </p>
                <p className="mt-2 text-sm text-stone-300">
                  This view uses locally persisted session and sale context because the backend still has no read endpoints for recovery screens.
                </p>
              </div>
              <DefinitionList
                items={[
                  { label: 'Session id', value: activeSession?.sessionId ?? 'No session yet' },
                  { label: 'Register', value: activeSession?.registerId ?? 'Not selected' },
                  { label: 'Operator', value: activeSession?.operatorId ?? 'Not selected' },
                  { label: 'Sale id', value: activeSale?.saleId ?? 'No sale yet' }
                ]}
              />
              {activeSale !== null && isTerminalSale(activeSale.status) ? (
                <SecondaryButton type="button" className="w-full" onClick={clearTerminalSale}>
                  Clear terminal sale from workspace
                </SecondaryButton>
              ) : null}
              {activeSession?.status === 'CLOSED' ? (
                <SecondaryButton
                  type="button"
                  className="w-full"
                  onClick={() => {
                    resetWorkspace();
                    setFeedback({
                      tone: 'warning',
                      title: 'Local checkout workspace cleared',
                      description: 'A closed session no longer occupies the local cashier context.',
                      detail: 'Backend data was not changed.'
                    });
                  }}
                >
                  Clear closed session from workspace
                </SecondaryButton>
              ) : null}
            </div>
          </div>
        </AppSection>

        <AppSection
          title="MVP feature lanes"
          description="This slice now covers the full cashier path that already exists in the backend, while keeping the UI optimized for speed and recovery."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {actionCards.map((actionCard) => (
              <ActionCard key={actionCard.title} {...actionCard} />
            ))}
          </div>
        </AppSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <CheckoutFormCard
            title="Open cashier session"
            description="Start the operational context before any sale begins. The returned session is stored locally so the cashier can refresh without losing the current register."
            actionLabel={hasOpenSession ? 'Session active' : 'Ready'}
            actionTone={hasOpenSession ? 'success' : 'neutral'}
          >
            <form
              className="space-y-4"
              onSubmit={openSessionForm.handleSubmit((values) => {
                submitSchemaValidatedForm(
                  openSessionForm,
                  openSessionFormSchema,
                  values,
                  (parsedValues) => {
                    openSessionMutation.mutate(parsedValues);
                  }
                );
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Register id"
                  error={openSessionForm.formState.errors.registerId?.message}
                >
                  <TextInput
                    placeholder={defaultCheckoutRegisterId}
                    disabled={hasOpenSession}
                    {...openSessionForm.register('registerId')}
                  />
                </FormField>
                <FormField
                  label="Operator id"
                  hint="UUID v4 required by the backend"
                  error={openSessionForm.formState.errors.operatorId?.message}
                >
                  <TextInput
                    placeholder={defaultCheckoutOperatorId}
                    disabled={hasOpenSession}
                    {...openSessionForm.register('operatorId')}
                  />
                </FormField>
              </div>

              <FormField
                label="Opening float amount"
                hint="Decimal amount with up to 2 places"
                error={openSessionForm.formState.errors.openingFloatAmount?.message}
              >
                <TextInput
                  placeholder="150.00"
                  inputMode="decimal"
                  disabled={hasOpenSession}
                  {...openSessionForm.register('openingFloatAmount')}
                />
              </FormField>

              {activeSession === null ? null : (
                <DefinitionList
                  items={[
                    { label: 'Status', value: activeSession.status },
                    { label: 'Opened at', value: formatDateTime(activeSession.openedAt) },
                    { label: 'Opening float', value: formatCurrency(activeSession.openingFloatAmount) },
                    { label: 'Session id', value: activeSession.sessionId }
                  ]}
                />
              )}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  type="submit"
                  disabled={formsLocked || hasOpenSession || openSessionMutation.isPending}
                >
                  {openSessionMutation.isPending ? 'Opening...' : 'Open session'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    openSessionForm.reset({
                      registerId: defaultCheckoutRegisterId,
                      operatorId: defaultCheckoutOperatorId,
                      openingFloatAmount: '150.00'
                    });
                    openSessionMutation.reset();
                  }}
                >
                  Reset form
                </SecondaryButton>
              </div>
            </form>
          </CheckoutFormCard>

          <CheckoutFormCard
            title="Start sale"
            description="Create the active sale after the register session exists. This app keeps one local active sale visible at a time until broader query endpoints land."
            actionLabel={hasMutableSale ? 'Sale live' : 'Ready'}
            actionTone={hasMutableSale ? 'success' : 'warning'}
          >
            <div className="space-y-4">
              <SectionIntro
                icon={<ReceiptText className="size-5" />}
                title="One visible active sale"
                description="When a sale is open, the cashier surface keeps totals, items, payment, and terminal actions close together."
              />

              {activeSale === null ? (
                <FeedbackBanner
                  tone="warning"
                  title="No active sale yet"
                  description="Open a session first, then start a sale to unlock barcode scan and cart mutation."
                />
              ) : (
                <DefinitionList items={buildSaleDefinitionItems(activeSale)} />
              )}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  type="button"
                  disabled={formsLocked || !canStartSale || startSaleMutation.isPending}
                  onClick={() => {
                    startSaleMutation.mutate();
                  }}
                >
                  {startSaleMutation.isPending ? 'Starting...' : 'Start sale'}
                </PrimaryButton>
                {activeSale !== null && isTerminalSale(activeSale.status) ? (
                  <SecondaryButton type="button" onClick={clearTerminalSale}>
                    Clear terminal sale
                  </SecondaryButton>
                ) : null}
              </div>
            </div>
          </CheckoutFormCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <CheckoutFormCard
            title="Scan and mutate cart"
            description="Resolve the product locally before mutating the sale. This keeps the cashier path fast and gives immediate confirmation that the barcode already exists in the checkout cache."
            actionLabel={hasMutableSale ? 'Cart enabled' : 'Waiting for sale'}
            actionTone={hasMutableSale ? 'success' : 'warning'}
          >
            <form
              className="space-y-4"
              onSubmit={cartMutationForm.handleSubmit((values) => {
                submitSchemaValidatedForm(
                  cartMutationForm,
                  cartMutationFormSchema,
                  values,
                  (parsedValues) => {
                    addItemMutation.mutate(parsedValues);
                  }
                );
              })}
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
                <FormField
                  label="Barcode"
                  hint="Needs to exist in the local checkout catalog"
                  error={cartMutationForm.formState.errors.barcode?.message}
                >
                  <TextInput
                    autoFocus
                    placeholder="7891234567890"
                    disabled={!hasMutableSale}
                    {...cartMutationForm.register('barcode')}
                  />
                </FormField>
                <FormField
                  label="Quantity"
                  error={cartMutationForm.formState.errors.quantity?.message}
                >
                  <TextInput
                    inputMode="numeric"
                    placeholder="1"
                    disabled={!hasMutableSale}
                    {...cartMutationForm.register('quantity')}
                  />
                </FormField>
              </div>

              {scanPreview === null ? (
                <FeedbackBanner
                  tone="warning"
                  title="Scan preview is idle"
                  description="Use barcode scan to confirm the product exists in the local checkout cache before adding or removing quantities."
                />
              ) : (
                <div className="rounded-2xl border border-line/80 bg-stone-50 px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">{scanPreview.name}</p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {scanPreview.barcode} · {scanPreview.unitOfMeasure}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill tone={scanPreview.active ? 'success' : 'warning'}>
                        {scanPreview.active ? 'Active' : 'Inactive'}
                      </StatusPill>
                      <span className="text-sm font-semibold text-ink">
                        {formatCurrency(scanPreview.unitPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <SecondaryButton
                  type="button"
                  disabled={formsLocked || !hasMutableSale || cartMutationPendingState}
                  onClick={() => {
                    submitValidatedCartMutation(
                      cartMutationForm,
                      cartMutationFormSchema,
                      (parsedValues) => {
                        scanItemMutation.mutate(parsedValues);
                      }
                    );
                  }}
                >
                  {scanItemMutation.isPending ? 'Scanning...' : 'Scan preview'}
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={formsLocked || !hasMutableSale || cartMutationPendingState}
                >
                  {addItemMutation.isPending ? 'Adding...' : 'Add item'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  disabled={formsLocked || !hasMutableSale || cartMutationPendingState}
                  onClick={() => {
                    submitValidatedCartMutation(
                      cartMutationForm,
                      cartMutationFormSchema,
                      (parsedValues) => {
                        removeItemMutation.mutate(parsedValues);
                      }
                    );
                  }}
                >
                  {removeItemMutation.isPending ? 'Removing...' : 'Remove item'}
                </SecondaryButton>
              </div>
            </form>
          </CheckoutFormCard>

          <CheckoutFormCard
            title="Current sale snapshot"
            description="The cart stays visible locally because the backend still has no sale read endpoint for recovery or support-oriented screens."
            actionLabel={hasMutableSale ? 'Live cart' : activeSale === null ? 'No live cart' : activeSale.status}
            actionTone={resolveSaleStatusTone(activeSale?.status)}
          >
            {activeSale === null ? (
              <FeedbackBanner
                tone="warning"
                title="Cart unavailable"
                description="Open a session and start a sale to populate this panel with live line items and totals."
              />
            ) : (
              <div className="space-y-4">
                <DefinitionList items={buildSaleDefinitionItems(activeSale)} />

                {activeSale.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-stone-50 px-4 py-6">
                    <p className="text-sm text-muted">
                      The sale exists, but the cart is still empty. Scan a product and add it to begin the basket.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {activeSale.items.map((item) => (
                      <div
                        key={`${item.productId}-${item.barcode}`}
                        className="rounded-2xl border border-line/80 bg-stone-50 px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-ink">{item.name}</p>
                            <p className="mt-1 font-mono text-xs text-muted">
                              {item.barcode} · {item.unitOfMeasure}
                            </p>
                          </div>
                          <div className="grid gap-2 text-right">
                            <span className="text-sm font-medium text-ink">Qty {item.quantity}</span>
                            <span className="text-sm font-semibold text-ink">
                              {formatCurrency(item.lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CheckoutFormCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <PaymentCompletionPanel
            paymentForm={paymentForm}
            activeSale={activeSale}
            capabilities={capabilities}
            formsLocked={formsLocked}
            isPaymentPending={processPaymentMutation.isPending}
            isCompletionPending={completeSaleMutation.isPending}
            completionResult={completionResult}
            receiptToDisplay={receiptToDisplay}
            onSubmitPayment={(values) => {
              processPaymentMutation.mutate(values);
            }}
            onCompleteSale={() => {
              completeSaleMutation.mutate();
            }}
          />

          <CancellationClosurePanel
            cancelSaleForm={cancelSaleForm}
            closeSessionForm={closeSessionForm}
            activeSale={activeSale}
            activeSession={activeSession}
            capabilities={capabilities}
            formsLocked={formsLocked}
            isCancellationPending={cancelSaleMutation.isPending}
            isClosurePending={closeSessionMutation.isPending}
            cancellationResult={cancellationResult}
            closureResult={closureResult}
            onCancelSale={(values) => {
              cancelSaleMutation.mutate(values);
            }}
            onCloseSession={(values) => {
              closeSessionMutation.mutate(values);
            }}
          />
        </div>

        <RouteInventorySection />
      </div>
    </AppShell>
  );
}

interface CheckoutFeedback {
  tone: 'success' | 'danger' | 'warning';
  title: string;
  description: string;
  detail?: string;
}

function submitValidatedCartMutation(
  form: UseFormReturn<CartMutationFormValues>,
  schema: z.ZodType<CartMutationFormValues>,
  onValid: (parsedValues: CartMutationFormValues) => void
): void {
  submitSchemaValidatedForm(form, schema, form.getValues(), onValid);
}

