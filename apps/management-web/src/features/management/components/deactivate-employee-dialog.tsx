import { ApiClientError, deactivateManagementEmployee, type ManagementEmployee } from '@supermarket/api-sdk';
import { Button, Dialog, InlineMessage } from '@supermarket/frontend-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useI18n } from '../../../i18n';
import { useManagement } from '../management-context';
import { ApiErrorMessage } from './api-error-message';
import { employeesQueryKey } from './employees-query';

interface DeactivateEmployeeDialogProps {
  employee: ManagementEmployee | null;
  onClose: () => void;
  onDone: (employee: ManagementEmployee) => void;
}

export function DeactivateEmployeeDialog({ employee, onClose, onDone }: DeactivateEmployeeDialogProps) {
  const { m } = useI18n();

  return (
    <Dialog open={employee !== null} onClose={onClose} title={m.employees.deactivate.title}>
      {employee === null ? null : <DeactivateEmployeeContent employee={employee} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function DeactivateEmployeeContent({
  employee,
  onClose,
  onDone
}: {
  employee: ManagementEmployee;
  onClose: () => void;
  onDone: (employee: ManagementEmployee) => void;
}) {
  const { m } = useI18n();
  const { tenantId, managementBaseUrl } = useManagement();
  const queryClient = useQueryClient();
  const copy = m.employees.deactivate;

  const mutation = useMutation({
    mutationFn: () =>
      deactivateManagementEmployee({ tenantId, employeeId: employee.employeeId }, { baseUrl: managementBaseUrl }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesQueryKey(tenantId) });
      onDone(employee);
    }
  });

  const alreadyInactive = mutation.error instanceof ApiClientError && mutation.error.statusCode === 409;

  return (
    <>
      <p className="text-body text-ink">{copy.body({ name: employee.fullName, code: employee.employeeCode })}</p>
      {mutation.isError ? (
        alreadyInactive ? (
          <InlineMessage tone="danger" title={copy.alreadyInactive} />
        ) : (
          <ApiErrorMessage title={m.employees.list.actionError} error={mutation.error} />
        )
      ) : null}
      <div className="flex justify-between gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>
          {copy.back}
        </Button>
        <Button variant="danger" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {copy.confirm}
        </Button>
      </div>
    </>
  );
}
