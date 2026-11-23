import { EmployeesTable } from '../features/management/components/employees-table';
import { PageTitle } from '../features/management/components/page-title';
import { RegisterEmployeeForm } from '../features/management/components/register-employee-form';
import { useI18n } from '../i18n';

export function EmployeesPage() {
  const { m } = useI18n();

  return (
    <div className="mx-auto flex max-w-[1040px] flex-col gap-6">
      <PageTitle>{m.nav.employees}</PageTitle>
      <RegisterEmployeeForm />
      <EmployeesTable />
    </div>
  );
}
