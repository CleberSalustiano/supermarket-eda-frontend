export const employeesQueryKey = (tenantId: string) => ['management', 'employees', tenantId] as const;

export const employeesListLimit = 200;
