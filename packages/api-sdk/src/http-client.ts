import type { FrontendServiceName } from '@supermarket/frontend-config';
import { resolveServiceBaseUrl } from '@supermarket/frontend-config';
import { appendTenantIdToUrl } from '@supermarket/frontend-tenant';

import { backendServices } from './backend-services';

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };
type JsonBody = Record<string, JsonValue>;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: JsonBody;
  tenantId?: string;
  signal?: AbortSignal;
  baseUrl?: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function requestJson<TResponse>(
  service: FrontendServiceName,
  route: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const baseUrl = resolveServiceBaseUrl(
    service,
    options.baseUrl === undefined ? {} : { [service]: options.baseUrl }
  );
  const targetUrl = appendTenantIdToUrl(new URL(route, baseUrl), options.tenantId);
  const response = await fetch(targetUrl, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiClientError(
      `Request to ${service} failed with status ${response.status}`,
      response.status,
      responseBody
    );
  }

  return responseBody as TResponse;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  if (responseText.length === 0) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}
