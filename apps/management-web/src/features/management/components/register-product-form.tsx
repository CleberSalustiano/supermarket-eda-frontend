import { registerManagementProduct } from '@supermarket/api-sdk';
import { Button, InlineMessage, MoneyField, TextField } from '@supermarket/frontend-ui';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { zodFormResolver } from '../lib/zod-form-resolver';
import { useI18n } from '../../../i18n';
import { useManagement } from '../management-context';
import { createRegisterProductSchema, type RegisterProductFormValues } from '../schemas/management-forms';
import type { RecentProduct } from '../lib/recent-products';
import { ApiErrorMessage } from './api-error-message';

const unitOptions = ['UN', 'KG', 'L', 'CX'] as const;
const emptyValues: RegisterProductFormValues = { name: '', barcode: '', unitOfMeasure: 'UN', price: '' };

export function RegisterProductForm({ onRegistered }: { onRegistered: (product: RecentProduct) => void }) {
  const { m, fmt } = useI18n();
  const { tenantId, managementBaseUrl } = useManagement();
  const schema = useMemo(() => createRegisterProductSchema({ m, fmt }), [m, fmt]);
  const form = useForm<RegisterProductFormValues>({ resolver: zodFormResolver(schema), defaultValues: emptyValues });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: RegisterProductFormValues) =>
      registerManagementProduct(
        {
          tenantId,
          name: values.name.trim(),
          barcode: values.barcode.trim(),
          unitOfMeasure: values.unitOfMeasure.trim().toUpperCase(),
          price: fmt.parseDecimal(values.price) ?? 0
        },
        { baseUrl: managementBaseUrl }
      ),
    onSuccess: (response) => {
      onRegistered({
        productId: response.productId,
        name: response.name,
        barcode: response.barcode,
        unitOfMeasure: response.unitOfMeasure,
        currentPrice: response.currentPrice,
        updatedAt: new Date().toISOString()
      });
      form.reset(emptyValues);
    }
  });

  const copy = m.products.register;

  return (
    <section className="flex flex-col gap-4 rounded-pane border border-rule bg-paper p-4 sm:p-6">
      <h2 className="text-heading">{copy.title}</h2>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <TextField label={copy.name} error={errors.name?.message} {...form.register('name')} />
        <TextField label={copy.barcode} error={errors.barcode?.message} {...form.register('barcode')} />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={copy.unit}
            list="management-unit-options"
            error={errors.unitOfMeasure?.message}
            {...form.register('unitOfMeasure')}
          />
          <MoneyField label={copy.price} error={errors.price?.message} {...form.register('price')} />
        </div>
        <datalist id="management-unit-options">
          {unitOptions.map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>
        {mutation.isError ? (
          <ApiErrorMessage
            title={copy.error}
            error={mutation.error}
          />
        ) : null}
        {mutation.isSuccess ? (
          <>
            <InlineMessage tone="success" title={copy.success({ name: mutation.data.name })} />
            <InlineMessage tone="info" title={copy.firstPriceInfo} />
          </>
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
