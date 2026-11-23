import { ApiClientError, resolveApiClientErrorMessage, updateManagementProductPrice } from '@supermarket/api-sdk';
import { Button, InlineMessage, MoneyField, SelectField, TextField } from '@supermarket/frontend-ui';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type Ref } from 'react';
import { useForm } from 'react-hook-form';

import { zodFormResolver } from '../lib/zod-form-resolver';
import { useI18n } from '../../../i18n';
import type { RecentProduct } from '../lib/recent-products';
import { useManagement } from '../management-context';
import { createUpdateProductPriceSchema, type UpdateProductPriceFormValues } from '../schemas/management-forms';
import { ApiErrorMessage } from './api-error-message';
import { ProductBarcodeLookup } from './product-barcode-lookup';

export type UpdatePriceFormProps = {
  recentProducts: RecentProduct[];
  selectedProductId: string | null;
  selectionRevision: number;
  onSelect: (product: RecentProduct) => void;
  onUpdated: (product: RecentProduct) => void;
  priceInputRef: Ref<HTMLInputElement>;
};

export function UpdatePriceForm({
  recentProducts,
  selectedProductId,
  selectionRevision,
  onSelect,
  onUpdated,
  priceInputRef
}: UpdatePriceFormProps) {
  const { m, fmt } = useI18n();
  const { tenantId, managementBaseUrl } = useManagement();
  const copy = m.products.price;
  const schema = useMemo(() => createUpdateProductPriceSchema({ m, fmt }), [m, fmt]);
  const form = useForm<UpdateProductPriceFormValues>({
    resolver: zodFormResolver(schema),
    defaultValues: { productId: '', price: '' }
  });
  const { errors } = form.formState;
  const [manualOpen, setManualOpen] = useState(false);
  const priceRegistration = form.register('price');
  const productId = form.watch('productId');

  useEffect(() => {
    if (selectedProductId !== null) {
      form.setValue('productId', selectedProductId, { shouldValidate: false });
    }
  }, [selectedProductId, selectionRevision, form]);

  const mutation = useMutation({
    mutationFn: (values: UpdateProductPriceFormValues) =>
      updateManagementProductPrice(
        { tenantId, productId: values.productId.trim(), price: fmt.parseDecimal(values.price) ?? 0 },
        { baseUrl: managementBaseUrl }
      ),
    onSuccess: (response) => {
      onUpdated({
        productId: response.productId,
        name: response.name,
        barcode: response.barcode,
        unitOfMeasure: response.unitOfMeasure,
        currentPrice: response.currentPrice,
        updatedAt: new Date().toISOString()
      });
      form.reset({ productId: response.productId, price: '' });
    }
  });

  const status = mutation.error instanceof ApiClientError ? mutation.error.statusCode : undefined;
  const samePrice =
    status === 400 && resolveApiClientErrorMessage(mutation.error).toLowerCase().includes('must differ');

  function pickFromRecents(id: string) {
    const product = recentProducts.find((entry) => entry.productId === id);

    form.setValue('productId', id, { shouldValidate: false });

    if (product !== undefined) {
      onSelect(product);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-pane border border-rule bg-paper p-4 sm:p-6">
      <h2 className="text-heading">{copy.title}</h2>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <SelectField
          label={copy.product}
          value={recentProducts.some((entry) => entry.productId === productId) ? productId : ''}
          disabled={recentProducts.length === 0}
          onChange={(event) => pickFromRecents(event.target.value)}
        >
          <option value="" />
          {recentProducts.map((entry) => (
            <option key={entry.productId} value={entry.productId}>
              {entry.name} ({entry.barcode})
            </option>
          ))}
        </SelectField>
        <ProductBarcodeLookup
          onFound={(product) => {
            form.setValue('productId', product.productId, { shouldValidate: false });
            onSelect(product);
          }}
        />
        <details
          open={manualOpen || errors.productId !== undefined}
          onToggle={(event) => setManualOpen(event.currentTarget.open)}
        >
          <summary className="cursor-pointer text-body">{copy.haveId}</summary>
          <div className="pt-2">
            <TextField label={copy.productId} error={errors.productId?.message} {...form.register('productId')} />
          </div>
        </details>
        <MoneyField
          label={copy.newPrice}
          error={errors.price?.message}
          {...priceRegistration}
          ref={(element) => {
            priceRegistration.ref(element);

            if (typeof priceInputRef === 'function') {
              priceInputRef(element);
            } else if (priceInputRef !== null) {
              (priceInputRef as { current: HTMLInputElement | null }).current = element;
            }
          }}
        />
        {mutation.isError ? (
          samePrice ? (
            <InlineMessage tone="warning" title={copy.samePrice} />
          ) : status === 404 ? (
            <InlineMessage tone="danger" title={copy.notFound} />
          ) : (
            <ApiErrorMessage title={copy.error} error={mutation.error} />
          )
        ) : null}
        {mutation.isSuccess ? (
          <InlineMessage
            tone="success"
            title={copy.success({
              name: mutation.data.name,
              old: fmt.currency(mutation.data.previousPrice),
              new: fmt.currency(mutation.data.currentPrice)
            })}
          />
        ) : null}
        <div>
          <Button type="submit" disabled={mutation.isPending}>
            {copy.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
