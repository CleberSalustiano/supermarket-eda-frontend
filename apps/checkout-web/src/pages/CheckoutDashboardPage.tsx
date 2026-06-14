import { useState } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addCheckoutSaleItem,
  backendServices,
  fetchServiceHealth,
  openCheckoutPosSession,
  removeCheckoutSaleItem,
  resolveApiClientCorrelationId,
  resolveApiClientErrorMessage,
  scanCheckoutCatalogItemByBarcode,
  startCheckoutSale,
  type CheckoutCatalogItem,
  type CheckoutSale,
  type CheckoutSaleStatus
} from '@supermarket/api-sdk';
import {
  ActionCard,
  AppSection,
  AppShell,
  MetricCard,
  StatusPill
} from '@supermarket/frontend-ui';
import { useForm, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import {
  Boxes,
  CircleDollarSign,
  Receipt,
  ReceiptText,
  ScanLine
} from 'lucide-react';
import { z } from 'zod';

import { checkoutServiceBaseUrl } from '../environment';
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
import { defaultCheckoutTenantId } from '../features/checkout/lib/workspace';
import {
  cartMutationFormSchema,
  openSessionFormSchema,
  tenantIdSchema,
  type CartMutationFormValues,
  type OpenSessionFormValues
} from '../features/checkout/schemas/checkout-forms';

const navigationItems = [
  {
    label: 'Workspace control',
    description: 'Keep tenant targeting explicit while the backend still has no authenticated user session.'
  },
  {
    label: 'Session execution',
    description: 'Open a cashier session and preserve the local workspace so refreshes do not lose context.'
  },
  {
    label: 'Cart execution',
    description: 'Scan the cached catalog and mutate the current sale without leaving the cashier surface.'
  }
] as const;

const actionCards = [
  {
    title: 'Open a register session',
    description: 'Capture the operator, register, and opening float before a sale begins.',
    footer: 'POST /pos-sessions',
    icon: <Receipt className="size-5" />
  },
  {
    title: 'Start and persist a sale',
    description: 'Create the sale once, keep it visible locally, and continue safely after a refresh.',
    footer: 'POST /sales',
    icon: <ReceiptText className="size-5" />
  },
  {
    title: 'Scan from the local catalog',
    description: 'Resolve product information from the checkout cache before mutating the cart.',
    footer: 'GET /catalog-items/barcodes/:barcode',
    icon: <ScanLine className="size-5" />
  },
  {
    title: 'Mutate cart totals live',
    description: 'Add or remove line quantities while the sale stays open and visible on the screen.',
    footer: 'POST /sales/:saleId/items and /items/removals',
    icon: <CircleDollarSign className="size-5" />
  }
] as const;

export function CheckoutDashboardPage() {
  const [workspace, setWorkspace, resetWorkspace] = usePersistedCheckoutWorkspace();
  const [feedback, setFeedback] = useState<CheckoutFeedback | null>(null);
  const [scanPreview, setScanPreview] = useState<CheckoutCatalogItem | null>(null);

  const openSessionForm = useForm<OpenSessionFormValues>({
    defaultValues: {
      registerId: '',
      operatorId: '',
      openingFloatAmount: '150.00'
    }
  });

  const cartMutationForm = useForm<CartMutationFormValues>({
    defaultValues: {
      barcode: '',
      quantity: '1'
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
  const hasOpenSession = activeSession?.status === 'OPEN';
  const hasMutableSale = activeSale?.status === 'OPEN';
  const canStartSale =
    hasOpenSession && (activeSale === null || isTerminalSale(activeSale.status));
  const formsLocked = !tenantValidation.success;
  const tenantLocked = hasOpenSession;

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
      setScanPreview(null);
      setFeedback({
        tone: 'success',
        title: 'Session opened',
        description: `Register ${response.registerId} is now open for operator ${response.operatorId}.`,
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
      setScanPreview(null);
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

  function handleSaleMutationSuccess(
    sale: CheckoutSale,
    title: string
  ): void {
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

  function clearTerminalSale(): void {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      activeSale: null
    }));
    setScanPreview(null);
    setFeedback({
      tone: 'warning',
      title: 'Terminal sale cleared locally',
      description: 'The local checkout workspace now focuses on the current session only.',
      detail: 'This does not change backend data.'
    });
  }

  const cartMutationPending =
    scanItemMutation.isPending || addItemMutation.isPending || removeItemMutation.isPending;

  return (
    <AppShell
      eyebrow="Checkout Web"
      title="Checkout execution is now operational."
      description="This screen keeps the cashier workflow sparse and fast, while using live backend mutations for session startup and cart handling."
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
            <StatusPill
              tone={
                activeSale === null
                  ? 'neutral'
                  : activeSale.status === 'OPEN'
                    ? 'success'
                    : activeSale.status === 'PAID'
                      ? 'warning'
                      : 'neutral'
              }
            >
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
            value="3 mutations"
            detail="Session opening, sale creation, and cart mutation already submit against the running checkout backend."
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
            label="Catalog dependency"
            value="Management sync"
            detail="Barcode scans succeed only for products already published from management into the local checkout cache."
            icon={<ScanLine className="size-5" />}
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
                  {
                    label: 'Sale id',
                    value: activeSale?.saleId ?? 'No sale yet'
                  }
                ]}
              />
              {activeSale !== null && isTerminalSale(activeSale.status) ? (
                <SecondaryButton
                  type="button"
                  className="w-full"
                  onClick={clearTerminalSale}
                >
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
          description="This slice focuses on the fastest live cashier path first: session opening, sale creation, barcode resolution, and cart mutation."
        >
          <div className="grid gap-4 lg:grid-cols-2">
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
                    placeholder="register-01"
                    disabled={hasOpenSession}
                    {...openSessionForm.register('registerId')}
                  />
                </FormField>
                <FormField
                  label="Operator id"
                  error={openSessionForm.formState.errors.operatorId?.message}
                >
                  <TextInput
                    placeholder="cashier-01"
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
                    {
                      label: 'Opening float',
                      value: formatCurrency(activeSession.openingFloatAmount)
                    },
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
                      registerId: '',
                      operatorId: '',
                      openingFloatAmount: '150.00'
                    });
                    openSessionMutation.reset();
                  }}
                >
                  Clear form
                </SecondaryButton>
              </div>
            </form>
          </CheckoutFormCard>

          <CheckoutFormCard
            title="Start sale"
            description="Create the active sale after the register session exists. This app keeps just one local active sale visible at a time until broader query endpoints land."
            actionLabel={hasMutableSale ? 'Sale live' : 'Ready'}
            actionTone={hasMutableSale ? 'success' : 'warning'}
          >
            <div className="space-y-4">
              <SectionIntro
                icon={<ReceiptText className="size-5" />}
                title="One visible active sale"
                description="When a sale is open, the cashier surface keeps totals, items, and mutation actions close together. Payment and closure remain in the next slice."
              />

              {activeSale === null ? (
                <FeedbackBanner
                  tone="warning"
                  title="No active sale yet"
                  description="Open a session first, then start a sale to unlock barcode scan and cart mutation."
                />
              ) : (
                <DefinitionList
                  items={[
                    { label: 'Sale status', value: activeSale.status },
                    { label: 'Sale id', value: activeSale.saleId },
                    { label: 'Item quantity', value: activeSale.totalItemsQuantity },
                    { label: 'Sale total', value: formatCurrency(activeSale.total) }
                  ]}
                />
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
                  disabled={formsLocked || !hasMutableSale || cartMutationPending}
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
                  disabled={formsLocked || !hasMutableSale || cartMutationPending}
                >
                  {addItemMutation.isPending ? 'Adding...' : 'Add item'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  disabled={formsLocked || !hasMutableSale || cartMutationPending}
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
            actionLabel={hasMutableSale ? 'Live cart' : 'No live cart'}
            actionTone={hasMutableSale ? 'success' : 'neutral'}
          >
            {activeSale === null ? (
              <FeedbackBanner
                tone="warning"
                title="Cart unavailable"
                description="Open a session and start a sale to populate this panel with live line items and totals."
              />
            ) : (
              <div className="space-y-4">
                <DefinitionList
                  items={[
                    { label: 'Status', value: activeSale.status },
                    { label: 'Subtotal', value: formatCurrency(activeSale.subtotal) },
                    { label: 'Total', value: formatCurrency(activeSale.total) },
                    { label: 'Items', value: activeSale.totalItemsQuantity }
                  ]}
                />

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
                            <span className="text-sm font-medium text-ink">
                              Qty {item.quantity}
                            </span>
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

        <AppSection
          title="Current route inventory"
          description="These are the live backend routes already supporting the operational slice now visible on the screen."
        >
          <div className="rounded-3xl border border-line bg-stone-950 px-5 py-4 text-stone-100">
            <ul className="space-y-2 font-mono text-sm">
              <li>{backendServices.checkout.routes.openPosSession}</li>
              <li>{backendServices.checkout.routes.startSale}</li>
              <li>/catalog-items/barcodes/:barcode</li>
              <li>{backendServices.checkout.routes.addSaleItem(':saleId')}</li>
              <li>{backendServices.checkout.routes.removeSaleItem(':saleId')}</li>
            </ul>
          </div>
        </AppSection>
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function isTerminalSale(status: CheckoutSaleStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELED';
}

function submitValidatedCartMutation(
  form: UseFormReturn<CartMutationFormValues>,
  schema: z.ZodType<CartMutationFormValues>,
  onValid: (parsedValues: CartMutationFormValues) => void
): void {
  submitSchemaValidatedForm(form, schema, form.getValues(), onValid);
}

function submitSchemaValidatedForm<TFormValues extends FieldValues>(
  form: UseFormReturn<TFormValues>,
  schema: z.ZodType<TFormValues>,
  values: TFormValues,
  onValid: (parsedValues: TFormValues) => void
): void {
  form.clearErrors();

  const validationResult = schema.safeParse(values);

  if (!validationResult.success) {
    for (const issue of validationResult.error.issues) {
      const fieldName = issue.path[0];

      if (typeof fieldName === 'string') {
        form.setError(fieldName as Path<TFormValues>, {
          type: 'manual',
          message: issue.message
        });
      }
    }

    return;
  }

  onValid(validationResult.data);
}
