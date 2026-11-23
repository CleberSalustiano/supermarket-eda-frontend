import { generateProfitAndLossReport } from '@supermarket/api-sdk';
import { Button, TextField } from '@supermarket/frontend-ui';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { ApiErrorMessage } from '../features/management/components/api-error-message';
import { ProfitAndLossStatement } from '../features/management/components/profit-and-loss-statement';
import { PageTitle } from '../features/management/components/page-title';
import { useManagement } from '../features/management/management-context';
import { createProfitAndLossSchema, type ProfitAndLossFormValues } from '../features/management/schemas/management-forms';
import { zodFormResolver } from '../features/management/lib/zod-form-resolver';
import { useI18n } from '../i18n';

function defaultDates(): ProfitAndLossFormValues {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return { fromDate: `${now.getFullYear()}-${month}-01`, toDate: `${now.getFullYear()}-${month}-${day}` };
}

export function ProfitAndLossPage() {
  const { m, fmt } = useI18n();
  const { tenantId, managementBaseUrl } = useManagement();
  const copy = m.results;
  const schema = useMemo(() => createProfitAndLossSchema({ m, fmt }), [m, fmt]);
  const form = useForm<ProfitAndLossFormValues>({ resolver: zodFormResolver(schema), defaultValues: defaultDates() });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: ProfitAndLossFormValues) =>
      generateProfitAndLossReport(
        { tenantId, fromDate: values.fromDate, toDate: values.toDate },
        { baseUrl: managementBaseUrl }
      )
  });

  const report = mutation.data;

  return (
    <div className="mx-auto flex max-w-[1040px] flex-col gap-6">
      <PageTitle>{m.nav.results}</PageTitle>
      <form
        className="flex flex-wrap items-end gap-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <TextField label={copy.from} type="date" error={errors.fromDate?.message} {...form.register('fromDate')} />
        <TextField label={copy.to} type="date" error={errors.toDate?.message} {...form.register('toDate')} />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? copy.generating : copy.submit}
        </Button>
      </form>
      {mutation.isError ? <ApiErrorMessage title={copy.error} error={mutation.error} /> : null}
      {report === undefined ? null : <ProfitAndLossStatement report={report} />}
    </div>
  );
}
