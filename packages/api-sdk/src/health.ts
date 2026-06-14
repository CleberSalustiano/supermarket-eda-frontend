import { backendServices } from './backend-services';
import { requestJson, type ApiRequestOptions } from './http-client';

export interface ServiceHealthResponse {
  serviceName: string;
  status: 'ok';
  timestamp: string;
}

export async function fetchServiceHealth(
  service: keyof typeof backendServices,
  options: Pick<ApiRequestOptions, 'baseUrl' | 'signal'> = {}
) {
  return requestJson<ServiceHealthResponse>(service, backendServices[service].routes.health, options);
}
