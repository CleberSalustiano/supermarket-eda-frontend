import { withTenantIdInBody } from '@supermarket/frontend-tenant';

import { backendServices } from './backend-services';
import { requestJson, type ApiRequestOptions } from './http-client';

export const managementEmployeeRoles = ['ADMIN', 'MANAGER', 'CASHIER'] as const;
export type ManagementEmployeeRole = (typeof managementEmployeeRoles)[number];

export type IntegrationEventPublicationStatus = 'published' | 'pending';

export interface RegisterManagementProductInput {
  tenantId: string;
  name: string;
  barcode: string;
  unitOfMeasure: string;
  price: number;
}

export interface RegisterManagementProductResponse {
  productId: string;
  tenantId: string;
  name: string;
  barcode: string;
  unitOfMeasure: string;
  currentPrice: number;
  active: boolean;
  eventPublicationStatus: IntegrationEventPublicationStatus;
}

export interface UpdateManagementProductPriceInput {
  tenantId: string;
  productId: string;
  price: number;
}

export interface UpdateManagementProductPriceResponse {
  productId: string;
  tenantId: string;
  barcode: string;
  name: string;
  unitOfMeasure: string;
  currentPrice: number;
  previousPrice: number;
  active: boolean;
  eventPublicationStatus: IntegrationEventPublicationStatus;
}

export interface RegisterManagementEmployeeInput {
  tenantId: string;
  employeeCode: string;
  fullName: string;
  role: ManagementEmployeeRole;
  pin: string;
}

export interface RegisterManagementEmployeeResponse {
  employeeId: string;
  tenantId: string;
  employeeCode: string;
  fullName: string;
  role: ManagementEmployeeRole;
  active: boolean;
  eventPublicationStatus: IntegrationEventPublicationStatus;
}

export type ManagementEmployeeStatusFilter = 'active' | 'inactive' | 'all';

export interface ManagementEmployee {
  employeeId: string;
  tenantId: string;
  employeeCode: string;
  fullName: string;
  role: ManagementEmployeeRole;
  active: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManagementEmployeeList {
  items: ManagementEmployee[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListManagementEmployeesInput {
  tenantId: string;
  status?: ManagementEmployeeStatusFilter;
  limit?: number;
  offset?: number;
}

export interface DeactivateManagementEmployeeInput {
  tenantId: string;
  employeeId: string;
}

export interface ChangeManagementEmployeePinInput {
  tenantId: string;
  employeeId: string;
  pin: string;
}

export interface ChangeManagementEmployeePinResponse {
  employeeId: string;
  tenantId: string;
  employeeCode: string;
  pinChangedAt: string;
}

export interface ProfitAndLossReportDay {
  businessDate: string;
  revenueNetTotal: number;
  inventoryLossTotal: number;
  profitAndLossTotal: number;
  netSalesCount: number;
  soldItemsQuantity: number;
  lossEventsCount: number;
  lossItemsQuantity: number;
}

export interface GenerateProfitAndLossReportInput {
  tenantId: string;
  fromDate: string;
  toDate: string;
}

export interface GenerateProfitAndLossReportResponse {
  tenantId: string;
  fromDate: string;
  toDate: string;
  revenueNetTotal: number;
  inventoryLossTotal: number;
  profitAndLossTotal: number;
  netSalesCount: number;
  soldItemsQuantity: number;
  lossEventsCount: number;
  lossItemsQuantity: number;
  days: ProfitAndLossReportDay[];
}

export async function registerManagementProduct(
  input: RegisterManagementProductInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<RegisterManagementProductResponse> {
  return requestJson<RegisterManagementProductResponse>(
    'management',
    backendServices.management.routes.registerProduct,
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody(
        {
          name: input.name,
          barcode: input.barcode,
          unitOfMeasure: input.unitOfMeasure,
          price: input.price
        },
        input.tenantId
      )
    }
  );
}

export async function updateManagementProductPrice(
  input: UpdateManagementProductPriceInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<UpdateManagementProductPriceResponse> {
  return requestJson<UpdateManagementProductPriceResponse>(
    'management',
    backendServices.management.routes.updateProductPrice(input.productId),
    {
      ...options,
      method: 'PUT',
      body: withTenantIdInBody(
        {
          price: input.price
        },
        input.tenantId
      )
    }
  );
}

export async function registerManagementEmployee(
  input: RegisterManagementEmployeeInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<RegisterManagementEmployeeResponse> {
  return requestJson<RegisterManagementEmployeeResponse>(
    'management',
    backendServices.management.routes.registerEmployee,
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody(
        {
          employeeCode: input.employeeCode,
          fullName: input.fullName,
          role: input.role,
          pin: input.pin
        },
        input.tenantId
      )
    }
  );
}

export async function listManagementEmployees(
  input: ListManagementEmployeesInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<ManagementEmployeeList> {
  const routeUrl = new URL(backendServices.management.routes.listEmployees, 'http://localhost');

  if (input.status !== undefined) {
    routeUrl.searchParams.set('status', input.status);
  }
  if (input.limit !== undefined) {
    routeUrl.searchParams.set('limit', String(input.limit));
  }
  if (input.offset !== undefined) {
    routeUrl.searchParams.set('offset', String(input.offset));
  }

  return requestJson<ManagementEmployeeList>('management', `${routeUrl.pathname}${routeUrl.search}`, {
    ...options,
    tenantId: input.tenantId
  });
}

export async function deactivateManagementEmployee(
  input: DeactivateManagementEmployeeInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<ManagementEmployee> {
  return requestJson<ManagementEmployee>(
    'management',
    backendServices.management.routes.deactivateEmployee(input.employeeId),
    {
      ...options,
      method: 'POST',
      body: withTenantIdInBody({}, input.tenantId)
    }
  );
}

export async function changeManagementEmployeePin(
  input: ChangeManagementEmployeePinInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<ChangeManagementEmployeePinResponse> {
  return requestJson<ChangeManagementEmployeePinResponse>(
    'management',
    backendServices.management.routes.changeEmployeePin(input.employeeId),
    {
      ...options,
      method: 'PUT',
      body: withTenantIdInBody({ pin: input.pin }, input.tenantId)
    }
  );
}

export async function generateProfitAndLossReport(
  input: GenerateProfitAndLossReportInput,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
): Promise<GenerateProfitAndLossReportResponse> {
  const routeUrl = new URL(backendServices.management.routes.generateProfitAndLossReport, 'http://localhost');
  routeUrl.searchParams.set('fromDate', input.fromDate);
  routeUrl.searchParams.set('toDate', input.toDate);

  return requestJson<GenerateProfitAndLossReportResponse>('management', `${routeUrl.pathname}${routeUrl.search}`, {
    ...options,
    tenantId: input.tenantId
  });
}
