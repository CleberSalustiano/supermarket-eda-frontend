import { useEffect, useState } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  backendServices,
  fetchServiceHealth,
  generateProfitAndLossReport,
  managementEmployeeRoles,
  registerManagementEmployee,
  registerManagementProduct,
  resolveApiClientCorrelationId,
  resolveApiClientErrorMessage,
  type GenerateProfitAndLossReportResponse,
  type RegisterManagementEmployeeResponse,
  type RegisterManagementProductResponse,
  type UpdateManagementProductPriceResponse,
  updateManagementProductPrice
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
  BarChart3,
  Boxes,
  ClipboardCheck,
  Landmark,
  ShieldUser
} from 'lucide-react';
import { z } from 'zod';

import { managementServiceBaseUrl } from '../environment';
import {
  DefinitionList,
  FeedbackBanner,
  FormField,
  ManagementFormCard,
  PrimaryButton,
  SecondaryButton,
  SectionIntro,
  SelectInput,
  TextInput
} from '../features/management/components/form-primitives';
import { usePersistedTenantId } from '../features/management/hooks/use-persisted-tenant-id';
import { defaultManagementTenantId } from '../features/management/lib/tenant';
import {
  profitAndLossFormSchema,
  registerEmployeeFormSchema,
  registerProductFormSchema,
  tenantIdSchema,
  updateProductPriceFormSchema,
  type ProfitAndLossFormValues,
  type RegisterEmployeeFormValues,
  type RegisterProductFormValues,
  type UpdateProductPriceFormValues
} from '../features/management/schemas/management-forms';

const navigationItems = [
  {
    label: 'Tenant workspace',
    description: 'Choose the store tenant that owns every command executed from this console.'
  },
  {
    label: 'Catalog execution',
    description: 'Register products and adjust prices without waiting for new read endpoints.'
  },
  {
    label: 'People and finance',
    description: 'Onboard employees and query the current profit-and-loss report directly.'
  }
] as const;

const actionCards = [
  {
    title: 'Catalog writes',
    description: 'Product creation and pricing are now actionable, not just documented.',
    footer: 'POST /products and PUT /products/:productId/price',
    icon: <Boxes className="size-5" />
  },
  {
    title: 'Employee onboarding',
    description: 'Role assignment already works through the live management backend.',
    footer: 'POST /employees',
    icon: <ShieldUser className="size-5" />
  },
  {
    title: 'P&L retrieval',
    description: 'Finance users can query period-based summaries right now with no stub data.',
    footer: 'GET /reports/profit-and-loss',
    icon: <BarChart3 className="size-5" />
  }
] as const;

const unitOfMeasureOptions = ['UN', 'KG', 'G', 'L', 'ML', 'PACK'] as const;

export function ManagementDashboardPage() {
  const [tenantId, setTenantId] = usePersistedTenantId();
  const [recentProducts, setRecentProducts] = useState<RegisterManagementProductResponse[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<RegisterManagementEmployeeResponse[]>([]);

  const healthQuery = useQuery({
    queryKey: ['service-health', 'management'],
    queryFn: () => fetchServiceHealth('management', { baseUrl: managementServiceBaseUrl })
  });

  const tenantValidation = tenantIdSchema.safeParse(tenantId);
  const tenantErrorMessage = tenantValidation.success
    ? undefined
    : tenantValidation.error.issues[0]?.message ?? 'Tenant id must be a valid UUID.';

  const registerProductForm = useForm<RegisterProductFormValues>({
    defaultValues: {
      name: '',
      barcode: '',
      unitOfMeasure: 'UN',
      price: ''
    }
  });

  const updatePriceForm = useForm<UpdateProductPriceFormValues>({
    defaultValues: {
      productId: '',
      price: ''
    }
  });

  const registerEmployeeForm = useForm<RegisterEmployeeFormValues>({
    defaultValues: {
      employeeCode: '',
      fullName: '',
      role: 'CASHIER',
      pin: ''
    }
  });

  const profitAndLossForm = useForm<ProfitAndLossFormValues>({
    defaultValues: createDefaultProfitAndLossDates()
  });

  const selectedProductId = updatePriceForm.watch('productId');
  const selectedProduct = recentProducts.find((product) => product.productId === selectedProductId);

  useEffect(() => {
    const firstRecentProduct = recentProducts[0];

    if (firstRecentProduct === undefined) {
      return;
    }

    if (updatePriceForm.getValues('productId').trim().length > 0) {
      return;
    }

    updatePriceForm.setValue('productId', firstRecentProduct.productId, {
      shouldDirty: false,
      shouldValidate: true
    });
  }, [recentProducts, updatePriceForm]);

  const registerProductMutation = useMutation({
    mutationFn: (values: RegisterProductFormValues) =>
      registerManagementProduct(
        {
          tenantId,
          name: values.name.trim(),
          barcode: values.barcode.trim(),
          unitOfMeasure: values.unitOfMeasure.trim().toUpperCase(),
          price: Number.parseFloat(values.price)
        },
        {
          baseUrl: managementServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setRecentProducts((currentProducts) => {
        const nextProducts = currentProducts.filter(
          (product) => product.productId !== response.productId
        );

        return [response, ...nextProducts].slice(0, 6);
      });
      registerProductForm.reset({
        name: '',
        barcode: '',
        unitOfMeasure: 'UN',
        price: ''
      });
      updatePriceForm.setValue('productId', response.productId, {
        shouldDirty: false,
        shouldValidate: true
      });
    }
  });

  const updatePriceMutation = useMutation({
    mutationFn: (values: UpdateProductPriceFormValues) =>
      updateManagementProductPrice(
        {
          tenantId,
          productId: values.productId.trim(),
          price: Number.parseFloat(values.price)
        },
        {
          baseUrl: managementServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setRecentProducts((currentProducts) => {
        const matchingProduct = currentProducts.find(
          (product) => product.productId === response.productId
        );

        const updatedProduct: RegisterManagementProductResponse = {
          productId: response.productId,
          tenantId: response.tenantId,
          barcode: response.barcode,
          name: response.name,
          unitOfMeasure: response.unitOfMeasure,
          currentPrice: response.currentPrice,
          active: response.active,
          eventPublicationStatus: response.eventPublicationStatus
        };

        const nextProducts = currentProducts.filter(
          (product) => product.productId !== response.productId
        );

        return [matchingProduct === undefined ? updatedProduct : updatedProduct, ...nextProducts].slice(0, 6);
      });
      updatePriceForm.reset({
        productId: response.productId,
        price: ''
      });
    }
  });

  const registerEmployeeMutation = useMutation({
    mutationFn: (values: RegisterEmployeeFormValues) =>
      registerManagementEmployee(
        {
          tenantId,
          employeeCode: values.employeeCode.trim(),
          fullName: values.fullName.trim(),
          role: values.role,
          pin: values.pin.trim()
        },
        {
          baseUrl: managementServiceBaseUrl
        }
      ),
    onSuccess: (response) => {
      setRecentEmployees((currentEmployees) => {
        const nextEmployees = currentEmployees.filter(
          (employee) => employee.employeeId !== response.employeeId
        );

        return [response, ...nextEmployees].slice(0, 6);
      });
      registerEmployeeForm.reset({
        employeeCode: '',
        fullName: '',
        role: 'CASHIER',
        pin: ''
      });
    }
  });

  const profitAndLossMutation = useMutation({
    mutationFn: (values: ProfitAndLossFormValues) =>
      generateProfitAndLossReport(
        {
          tenantId,
          fromDate: values.fromDate,
          toDate: values.toDate
        },
        {
          baseUrl: managementServiceBaseUrl
        }
      )
  });

  const formsLocked = !tenantValidation.success;

  return (
    <AppShell
      eyebrow="Management Web"
      title="Management workflows are now executable."
      description="A low-noise control surface for catalog, people, and finance, with live backend mutations instead of static placeholders."
      navigationItems={navigationItems.map((item) => ({ ...item }))}
      sidebarFooter={
        <div className="space-y-3 rounded-2xl border border-line bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">API target</p>
          <p className="font-mono text-sm text-ink">{managementServiceBaseUrl}</p>
          <div className="flex items-center gap-2">
            <StatusPill tone={tenantValidation.success ? 'success' : 'warning'}>
              {tenantValidation.success ? 'Tenant ready' : 'Tenant invalid'}
            </StatusPill>
            <span className="font-mono text-xs text-muted">{tenantId}</span>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Functional writes"
            value="3 flows"
            detail="Products, price changes, and employee records now submit through the live API."
            icon={<Boxes className="size-5" />}
          />
          <MetricCard
            label="Live report"
            value="P&L query"
            detail="Date-ranged P&L retrieval is available with summary totals and daily rows."
            icon={<BarChart3 className="size-5" />}
            tone="accent"
          />
          <MetricCard
            label="Tenant handling"
            value="User-controlled"
            detail="The current tenant id stays visible and editable until auth and tenant sessions exist."
            icon={<Landmark className="size-5" />}
          />
        </div>

        <AppSection
          title="Workspace control"
          description="The backend is tenant-aware but still unauthenticated, so this screen keeps tenant targeting explicit and visible."
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <SectionIntro
                icon={<ClipboardCheck className="size-5" />}
                title="Target tenant and connectivity"
                description="Use a stable demo tenant id for testing, or replace it with a real store tenant before submitting mutations."
              />
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <FormField
                  label="Tenant id"
                  hint="Required for every management request"
                  error={tenantErrorMessage}
                >
                  <TextInput
                    value={tenantId}
                    onChange={(event) => {
                      setTenantId(event.target.value.trim());
                    }}
                    placeholder={defaultManagementTenantId}
                  />
                </FormField>
                <div className="flex items-end">
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      setTenantId(defaultManagementTenantId);
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
                  title="Fix the tenant id before submitting"
                  description="The backend validates tenant ids as UUID v4 values. Keep this valid to avoid guaranteed request failure."
                />
              ) : null}
            </div>

            <div className="rounded-3xl border border-line bg-stone-950 px-5 py-4 text-stone-100">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                Current route inventory
              </p>
              <ul className="mt-3 space-y-2 font-mono text-sm">
                <li>{backendServices.management.routes.registerProduct}</li>
                <li>{backendServices.management.routes.updateProductPrice(':productId')}</li>
                <li>{backendServices.management.routes.registerEmployee}</li>
                <li>{backendServices.management.routes.generateProfitAndLossReport}</li>
              </ul>
            </div>
          </div>
        </AppSection>

        <AppSection
          title="MVP delivery lanes"
          description="The foundation cards now map to live workflows and the missing backend reads that still shape UX choices."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {actionCards.map((actionCard) => (
              <ActionCard key={actionCard.title} {...actionCard} />
            ))}
          </div>
        </AppSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <ManagementFormCard
            title="Register product"
            description="Create canonical products that feed checkout and downstream finance. The result is kept locally so price adjustments can happen without a list endpoint."
            actionLabel="Live mutation"
            actionTone="success"
          >
            <form
              className="space-y-4"
              onSubmit={registerProductForm.handleSubmit((values) => {
                submitSchemaValidatedForm(
                  registerProductForm,
                  registerProductFormSchema,
                  values,
                  (parsedValues) => {
                    registerProductMutation.mutate(parsedValues);
                  }
                );
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Product name"
                  error={registerProductForm.formState.errors.name?.message}
                >
                  <TextInput
                    placeholder="Arabica coffee beans 1kg"
                    {...registerProductForm.register('name')}
                  />
                </FormField>
                <FormField
                  label="Barcode"
                  error={registerProductForm.formState.errors.barcode?.message}
                >
                  <TextInput placeholder="7891234567890" {...registerProductForm.register('barcode')} />
                </FormField>
                <FormField
                  label="Unit of measure"
                  error={registerProductForm.formState.errors.unitOfMeasure?.message}
                >
                  <SelectInput {...registerProductForm.register('unitOfMeasure')}>
                    {unitOfMeasureOptions.map((unitOfMeasure) => (
                      <option key={unitOfMeasure} value={unitOfMeasure}>
                        {unitOfMeasure}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Current price" error={registerProductForm.formState.errors.price?.message}>
                  <TextInput placeholder="22.90" inputMode="decimal" {...registerProductForm.register('price')} />
                </FormField>
              </div>

              {registerProductMutation.isError ? (
                <FeedbackBanner
                  tone="danger"
                  title="Product registration failed"
                  description={resolveApiClientErrorMessage(registerProductMutation.error)}
                  detail={resolveApiClientCorrelationId(registerProductMutation.error)}
                />
              ) : null}

              {registerProductMutation.isSuccess ? (
                <FeedbackBanner
                  tone="success"
                  title="Product registered"
                  description={`${registerProductMutation.data.name} was created and is ready for downstream propagation.`}
                  detail={`Product id ${registerProductMutation.data.productId} · Event ${registerProductMutation.data.eventPublicationStatus}`}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" disabled={formsLocked || registerProductMutation.isPending}>
                  {registerProductMutation.isPending ? 'Registering...' : 'Register product'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    registerProductForm.reset({
                      name: '',
                      barcode: '',
                      unitOfMeasure: 'UN',
                      price: ''
                    });
                    registerProductMutation.reset();
                  }}
                >
                  Clear form
                </SecondaryButton>
              </div>
            </form>

            {recentProducts.length > 0 ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm font-semibold text-ink">Recent product results</p>
                <div className="grid gap-3">
                  {recentProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="rounded-2xl border border-line/80 bg-stone-50 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink">{product.name}</p>
                          <p className="mt-1 font-mono text-xs text-muted">
                            {product.productId} · {product.barcode}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusPill tone={product.active ? 'success' : 'warning'}>
                            {product.active ? 'Active' : 'Inactive'}
                          </StatusPill>
                          <span className="text-sm font-semibold text-ink">
                            {formatCurrency(product.currentPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </ManagementFormCard>

          <ManagementFormCard
            title="Update product price"
            description="Use a freshly created product id from this session or paste a known product id from another environment."
            actionLabel="Price sync"
            actionTone="warning"
          >
            <form
              className="space-y-4"
              onSubmit={updatePriceForm.handleSubmit((values) => {
                submitSchemaValidatedForm(
                  updatePriceForm,
                  updateProductPriceFormSchema,
                  values,
                  (parsedValues) => {
                    updatePriceMutation.mutate(parsedValues);
                  }
                );
              })}
            >
              <FormField
                label="Product id"
                hint="UUID v4 required by the backend"
                error={updatePriceForm.formState.errors.productId?.message}
              >
                <TextInput
                  list="management-recent-product-ids"
                  placeholder="Paste or pick a recent product id"
                  {...updatePriceForm.register('productId')}
                />
                <datalist id="management-recent-product-ids">
                  {recentProducts.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.name}
                    </option>
                  ))}
                </datalist>
              </FormField>

              {selectedProduct === undefined ? null : (
                <DefinitionList
                  items={[
                    { label: 'Product', value: selectedProduct.name },
                    { label: 'Barcode', value: selectedProduct.barcode },
                    { label: 'Current price', value: formatCurrency(selectedProduct.currentPrice) },
                    { label: 'Unit', value: selectedProduct.unitOfMeasure }
                  ]}
                />
              )}

              <FormField label="New price" error={updatePriceForm.formState.errors.price?.message}>
                <TextInput placeholder="24.90" inputMode="decimal" {...updatePriceForm.register('price')} />
              </FormField>

              {updatePriceMutation.isError ? (
                <FeedbackBanner
                  tone="danger"
                  title="Price update failed"
                  description={resolveApiClientErrorMessage(updatePriceMutation.error)}
                  detail={resolveApiClientCorrelationId(updatePriceMutation.error)}
                />
              ) : null}

              {updatePriceMutation.isSuccess ? (
                <FeedbackBanner
                  tone="success"
                  title="Price updated"
                  description={`${updatePriceMutation.data.name} moved from ${formatCurrency(updatePriceMutation.data.previousPrice)} to ${formatCurrency(updatePriceMutation.data.currentPrice)}.`}
                  detail={`Event ${updatePriceMutation.data.eventPublicationStatus}`}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" disabled={formsLocked || updatePriceMutation.isPending}>
                  {updatePriceMutation.isPending ? 'Updating...' : 'Update price'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    updatePriceForm.reset({
                      productId: selectedProduct?.productId ?? '',
                      price: ''
                    });
                    updatePriceMutation.reset();
                  }}
                >
                  Clear form
                </SecondaryButton>
              </div>
            </form>
          </ManagementFormCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ManagementFormCard
            title="Register employee"
            description="Create operational users while the backend still evolves toward full authentication and list endpoints."
            actionLabel="Access setup"
            actionTone="neutral"
          >
            <form
              className="space-y-4"
              onSubmit={registerEmployeeForm.handleSubmit((values) => {
                submitSchemaValidatedForm(
                  registerEmployeeForm,
                  registerEmployeeFormSchema,
                  values,
                  (parsedValues) => {
                    registerEmployeeMutation.mutate(parsedValues);
                  }
                );
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Employee code"
                  error={registerEmployeeForm.formState.errors.employeeCode?.message}
                >
                  <TextInput placeholder="MG-204" {...registerEmployeeForm.register('employeeCode')} />
                </FormField>
                <FormField label="Role" error={registerEmployeeForm.formState.errors.role?.message}>
                  <SelectInput {...registerEmployeeForm.register('role')}>
                    {managementEmployeeRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>

              <FormField
                label="Full name"
                error={registerEmployeeForm.formState.errors.fullName?.message}
              >
                <TextInput placeholder="Marina Costa" {...registerEmployeeForm.register('fullName')} />
              </FormField>

              <FormField label="PIN" hint="4 to 12 digits" error={registerEmployeeForm.formState.errors.pin?.message}>
                <TextInput
                  type="password"
                  inputMode="numeric"
                  placeholder="1234"
                  {...registerEmployeeForm.register('pin')}
                />
              </FormField>

              {registerEmployeeMutation.isError ? (
                <FeedbackBanner
                  tone="danger"
                  title="Employee registration failed"
                  description={resolveApiClientErrorMessage(registerEmployeeMutation.error)}
                  detail={resolveApiClientCorrelationId(registerEmployeeMutation.error)}
                />
              ) : null}

              {registerEmployeeMutation.isSuccess ? (
                <FeedbackBanner
                  tone="success"
                  title="Employee registered"
                  description={`${registerEmployeeMutation.data.fullName} is now active as ${registerEmployeeMutation.data.role}.`}
                  detail={`Employee id ${registerEmployeeMutation.data.employeeId} · Event ${registerEmployeeMutation.data.eventPublicationStatus}`}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" disabled={formsLocked || registerEmployeeMutation.isPending}>
                  {registerEmployeeMutation.isPending ? 'Registering...' : 'Register employee'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    registerEmployeeForm.reset({
                      employeeCode: '',
                      fullName: '',
                      role: 'CASHIER',
                      pin: ''
                    });
                    registerEmployeeMutation.reset();
                  }}
                >
                  Clear form
                </SecondaryButton>
              </div>
            </form>

            {recentEmployees.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {recentEmployees.map((employee) => (
                  <div
                    key={employee.employeeId}
                    className="rounded-2xl border border-line/80 bg-stone-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink">{employee.fullName}</p>
                        <p className="mt-1 font-mono text-xs text-muted">
                          {employee.employeeCode} · {employee.employeeId}
                        </p>
                      </div>
                      <StatusPill tone="neutral">{employee.role}</StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </ManagementFormCard>

          <ManagementFormCard
            title="Profit and loss report"
            description="Query the current backend report with explicit dates. This keeps the MVP useful even before broader management read models exist."
            actionLabel="On-demand read"
            actionTone="success"
          >
            <form
              className="space-y-4"
              onSubmit={profitAndLossForm.handleSubmit((values) => {
                submitSchemaValidatedForm(
                  profitAndLossForm,
                  profitAndLossFormSchema,
                  values,
                  (parsedValues) => {
                    profitAndLossMutation.mutate(parsedValues);
                  }
                );
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="From date"
                  error={profitAndLossForm.formState.errors.fromDate?.message}
                >
                  <TextInput type="date" {...profitAndLossForm.register('fromDate')} />
                </FormField>
                <FormField label="To date" error={profitAndLossForm.formState.errors.toDate?.message}>
                  <TextInput type="date" {...profitAndLossForm.register('toDate')} />
                </FormField>
              </div>

              {profitAndLossMutation.isError ? (
                <FeedbackBanner
                  tone="danger"
                  title="Report query failed"
                  description={resolveApiClientErrorMessage(profitAndLossMutation.error)}
                  detail={resolveApiClientCorrelationId(profitAndLossMutation.error)}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" disabled={formsLocked || profitAndLossMutation.isPending}>
                  {profitAndLossMutation.isPending ? 'Querying...' : 'Run report'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    profitAndLossForm.reset(createDefaultProfitAndLossDates());
                    profitAndLossMutation.reset();
                  }}
                >
                  Reset dates
                </SecondaryButton>
              </div>
            </form>

            {profitAndLossMutation.data === undefined ? null : (
              <ProfitAndLossResults report={profitAndLossMutation.data} />
            )}
          </ManagementFormCard>
        </div>
      </div>
    </AppShell>
  );
}

function ProfitAndLossResults({
  report
}: {
  report: GenerateProfitAndLossReportResponse;
}) {
  return (
    <div className="mt-5 space-y-5">
      <FeedbackBanner
        tone="success"
        title="Report generated"
        description={`Loaded ${report.days.length} business day entries for tenant ${report.tenantId}.`}
      />

      <DefinitionList
        items={[
          { label: 'Revenue net total', value: formatCurrency(report.revenueNetTotal) },
          { label: 'Inventory loss total', value: formatCurrency(report.inventoryLossTotal) },
          { label: 'P&L total', value: formatCurrency(report.profitAndLossTotal) },
          { label: 'Net sales count', value: report.netSalesCount },
          { label: 'Sold item quantity', value: report.soldItemsQuantity },
          { label: 'Loss events count', value: report.lossEventsCount }
        ]}
      />

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="min-w-full border-collapse bg-white text-left text-sm">
          <thead className="bg-stone-100 text-xs uppercase tracking-[0.18em] text-muted">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Losses</th>
              <th className="px-4 py-3">P&amp;L</th>
              <th className="px-4 py-3">Net sales</th>
            </tr>
          </thead>
          <tbody>
            {report.days.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-muted" colSpan={5}>
                  No day entries were returned for the selected range.
                </td>
              </tr>
            ) : null}
            {report.days.map((day) => (
              <tr key={day.businessDate} className="border-t border-line/70">
                <td className="px-4 py-3 font-medium text-ink">{day.businessDate}</td>
                <td className="px-4 py-3 text-ink">{formatCurrency(day.revenueNetTotal)}</td>
                <td className="px-4 py-3 text-ink">{formatCurrency(day.inventoryLossTotal)}</td>
                <td className="px-4 py-3 text-ink">{formatCurrency(day.profitAndLossTotal)}</td>
                <td className="px-4 py-3 text-muted">{day.netSalesCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function createDefaultProfitAndLossDates(): ProfitAndLossFormValues {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  const year = `${now.getFullYear()}`;

  return {
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${day}`
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
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
