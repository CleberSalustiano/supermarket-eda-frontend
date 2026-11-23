import { ApiClientError, managementEmployeeRoles, registerManagementEmployee } from '@supermarket/api-sdk';
import { Button, InlineMessage, SelectField, TextField } from '@supermarket/frontend-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useI18n } from '../../../i18n';
import { zodFormResolver } from '../lib/zod-form-resolver';
import { useManagement } from '../management-context';
import { createRegisterEmployeeSchema, type RegisterEmployeeFormValues } from '../schemas/management-forms';
import { ApiErrorMessage } from './api-error-message';
import { employeesQueryKey } from './employees-query';

const emptyValues: RegisterEmployeeFormValues = { employeeCode: '', fullName: '', role: 'CASHIER', pin: '' };

export function RegisterEmployeeForm() {
  const { m, fmt } = useI18n();
  const { tenantId, managementBaseUrl } = useManagement();
  const copy = m.employees;
  const queryClient = useQueryClient();
  const schema = useMemo(() => createRegisterEmployeeSchema({ m, fmt }), [m, fmt]);
  const form = useForm<RegisterEmployeeFormValues>({ resolver: zodFormResolver(schema), defaultValues: emptyValues });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: RegisterEmployeeFormValues) =>
      registerManagementEmployee(
        {
          tenantId,
          employeeCode: values.employeeCode.trim(),
          fullName: values.fullName.trim(),
          role: values.role,
          pin: values.pin.trim()
        },
        { baseUrl: managementBaseUrl }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesQueryKey(tenantId) });
      // Clears the PIN together with the other fields.
      form.reset(emptyValues);
    }
  });

  const duplicate = mutation.error instanceof ApiClientError && mutation.error.statusCode === 409;

  return (
    <section className="flex max-w-lg flex-col gap-4 rounded-pane border border-rule bg-paper p-4 sm:p-6">
      <h2 className="text-heading">{copy.title}</h2>
      <p className="text-small text-ink-muted">{copy.operatorHint}</p>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <TextField label={copy.code} error={errors.employeeCode?.message} {...form.register('employeeCode')} />
        <TextField label={copy.fullName} error={errors.fullName?.message} {...form.register('fullName')} />
        <SelectField label={copy.role} error={errors.role?.message} {...form.register('role')}>
          {managementEmployeeRoles.map((role) => (
            <option key={role} value={role}>
              {copy.roles[role]}
            </option>
          ))}
        </SelectField>
        <TextField
          label={copy.pin.label}
          hint={copy.pin.hint}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          error={errors.pin?.message}
          {...form.register('pin')}
        />
        {mutation.isError ? (
          duplicate ? (
            <InlineMessage tone="danger" title={copy.duplicate({ code: form.getValues('employeeCode').trim() })} />
          ) : (
            <ApiErrorMessage title={copy.error} error={mutation.error} />
          )
        ) : null}
        {mutation.isSuccess ? (
          <InlineMessage tone="success" title={copy.success({ name: mutation.data.fullName })} />
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
