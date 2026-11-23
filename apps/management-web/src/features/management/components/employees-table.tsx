import { listManagementEmployees, type ManagementEmployee } from '@supermarket/api-sdk';
import { Button, DataTable, InlineMessage, type DataTableColumn } from '@supermarket/frontend-ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { useI18n } from '../../../i18n';
import { useManagement } from '../management-context';
import { ApiErrorMessage } from './api-error-message';
import { ChangeEmployeePinDialog } from './change-employee-pin-dialog';
import { DeactivateEmployeeDialog } from './deactivate-employee-dialog';
import { employeesListLimit, employeesQueryKey } from './employees-query';
import { ScrollRegion } from './scroll-region';

const copiedLabelMs = 2000;

function selectText(element: HTMLElement): void {
  const range = document.createRange();

  range.selectNodeContents(element);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
}

export function EmployeesTable() {
  const { m, fmt } = useI18n();
  const { tenantId, managementBaseUrl } = useManagement();
  const copy = m.employees;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fallbackId, setFallbackId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<ManagementEmployee | null>(null);
  const [changingPin, setChangingPin] = useState<ManagementEmployee | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const query = useQuery({
    queryKey: employeesQueryKey(tenantId),
    queryFn: ({ signal }) =>
      listManagementEmployees(
        { tenantId, status: 'all', limit: employeesListLimit },
        { baseUrl: managementBaseUrl, signal }
      )
  });

  async function copyId(employee: ManagementEmployee): Promise<void> {
    window.clearTimeout(timer.current);

    try {
      await navigator.clipboard.writeText(employee.employeeId);
      setFallbackId(null);
      setCopiedId(employee.employeeId);
      timer.current = window.setTimeout(() => setCopiedId(null), copiedLabelMs);
    } catch {
      const element = document.getElementById(`employee-id-${employee.employeeId}`);

      if (element !== null) {
        selectText(element);
      }

      setCopiedId(null);
      setFallbackId(employee.employeeId);
    }
  }

  const roleLabel = (role: string): string => (role in copy.roles ? copy.roles[role as keyof typeof copy.roles] : role);

  const columns: DataTableColumn<ManagementEmployee>[] = [
    { key: 'code', header: copy.list.code, render: (row) => row.employeeCode },
    { key: 'name', header: copy.list.name, render: (row) => row.fullName },
    { key: 'role', header: copy.list.role, render: (row) => roleLabel(row.role) },
    {
      key: 'status',
      header: copy.list.status,
      render: (row) =>
        row.active || row.deactivatedAt === null
          ? copy.list.active
          : copy.list.inactiveSince({ date: fmt.dateTime(row.deactivatedAt) })
    },
    {
      key: 'id',
      header: copy.colId,
      render: (row) => (
        <span id={`employee-id-${row.employeeId}`} className="break-all text-small tabular-nums">
          {row.employeeId}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <div className="flex flex-wrap gap-1">
            <Button
              variant="quiet"
              aria-label={copy.copyIdAria({ name: row.fullName })}
              onClick={() => {
                void copyId(row);
              }}
            >
              {copiedId === row.employeeId ? copy.copied : copy.copyId}
            </Button>
            <Button
              variant="quiet"
              disabled={!row.active}
              aria-label={`${copy.actions.changePin}: ${row.fullName}`}
              onClick={() => {
                setNotice(null);
                setChangingPin(row);
              }}
            >
              {copy.actions.changePin}
            </Button>
            <Button
              variant="quiet"
              disabled={!row.active}
              aria-label={`${copy.actions.deactivate}: ${row.fullName}`}
              onClick={() => {
                setNotice(null);
                setDeactivating(row);
              }}
            >
              {copy.actions.deactivate}
            </Button>
          </div>
          {fallbackId === row.employeeId ? <span className="text-small text-ink-muted">{copy.copyFallback}</span> : null}
        </div>
      )
    }
  ];

  function renderList() {
    if (query.isPending) {
      return <p role="status" className="text-small text-ink-muted">…</p>;
    }

    if (query.isError) {
      return (
        <div className="flex flex-col items-start gap-3">
          <ApiErrorMessage title={copy.list.error} error={query.error} />
          <Button
            variant="secondary"
            onClick={() => {
              void query.refetch();
            }}
          >
            {copy.list.retry}
          </Button>
        </div>
      );
    }

    if (query.data.items.length === 0) {
      return <p className="text-body text-ink-muted">{copy.list.empty}</p>;
    }

    return (
      <>
        <ScrollRegion label={m.tableRegion({ title: copy.list.title })}>
          <DataTable columns={columns} rows={query.data.items} rowKey={(row) => row.employeeId} />
        </ScrollRegion>
        {query.data.total > query.data.items.length ? (
          <p className="text-small text-ink-muted">
            {copy.list.truncated({ shown: query.data.items.length, total: query.data.total })}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading">{copy.list.title}</h2>
      {notice === null ? null : <InlineMessage tone="success" title={notice} />}
      {renderList()}
      <DeactivateEmployeeDialog
        employee={deactivating}
        onClose={() => setDeactivating(null)}
        onDone={(employee) => {
          setDeactivating(null);
          setNotice(copy.deactivate.done({ name: employee.fullName }));
        }}
      />
      <ChangeEmployeePinDialog
        employee={changingPin}
        onClose={() => setChangingPin(null)}
        onDone={(employee) => {
          setChangingPin(null);
          setNotice(copy.pin.done({ name: employee.fullName }));
        }}
      />
    </section>
  );
}
