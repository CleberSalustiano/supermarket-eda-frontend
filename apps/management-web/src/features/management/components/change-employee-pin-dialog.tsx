import { ApiClientError, changeManagementEmployeePin, type ManagementEmployee } from '@supermarket/api-sdk';
import { Button, Dialog, InlineMessage, TextField } from '@supermarket/frontend-ui';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useI18n } from '../../../i18n';
import { zodFormResolver } from '../lib/zod-form-resolver';
import { useManagement } from '../management-context';
import { createChangeEmployeePinSchema, type ChangeEmployeePinFormValues } from '../schemas/management-forms';
import { ApiErrorMessage } from './api-error-message';

const FORM_ID = 'change-employee-pin-form';
const emptyValues: ChangeEmployeePinFormValues = { pin: '', confirmPin: '' };
const maxPinLength = 12;

interface ChangeEmployeePinDialogProps {
  employee: ManagementEmployee | null;
  onClose: () => void;
  onDone: (employee: ManagementEmployee) => void;
}

export function ChangeEmployeePinDialog({ employee, onClose, onDone }: ChangeEmployeePinDialogProps) {
  const { m } = useI18n();

  return (
    <Dialog
      open={employee !== null}
      onClose={onClose}
      title={employee === null ? m.employees.actions.changePin : m.employees.pin.title({ name: employee.fullName })}
    >
      {employee === null ? null : <ChangeEmployeePinContent employee={employee} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

// Mounted only while the dialog is open, so the PIN fields and the mutation state never outlive it.
function ChangeEmployeePinContent({
  employee,
  onClose,
  onDone
}: {
  employee: ManagementEmployee;
  onClose: () => void;
  onDone: (employee: ManagementEmployee) => void;
}) {
  const { m, fmt } = useI18n();
  const { tenantId, managementBaseUrl } = useManagement();
  const copy = m.employees.pin;
  const schema = useMemo(() => createChangeEmployeePinSchema({ m, fmt }), [m, fmt]);
  const form = useForm<ChangeEmployeePinFormValues>({ resolver: zodFormResolver(schema), defaultValues: emptyValues });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: ChangeEmployeePinFormValues) =>
      changeManagementEmployeePin(
        { tenantId, employeeId: employee.employeeId, pin: values.pin.trim() },
        { baseUrl: managementBaseUrl }
      ),
    onSuccess: () => {
      form.reset(emptyValues);
      onDone(employee);
    }
  });

  const status = mutation.error instanceof ApiClientError ? mutation.error.statusCode : null;

  return (
    <>
      <form
        id={FORM_ID}
        className="flex flex-col gap-4"
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <TextField
          label={copy.new}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={maxPinLength}
          autoFocus
          error={errors.pin?.message}
          {...form.register('pin')}
        />
        <TextField
          label={copy.confirm}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={maxPinLength}
          error={errors.confirmPin?.message}
          {...form.register('confirmPin')}
        />
      </form>
      {mutation.isError ? (
        status === 400 ? (
          <InlineMessage tone="danger" title={copy.rejected} />
        ) : status === 409 ? (
          <InlineMessage tone="danger" title={copy.inactive} />
        ) : (
          <ApiErrorMessage title={m.employees.list.actionError} error={mutation.error} />
        )
      ) : null}
      <div className="flex justify-between gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>
          {copy.back}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={mutation.isPending}>
          {copy.save}
        </Button>
      </div>
    </>
  );
}
