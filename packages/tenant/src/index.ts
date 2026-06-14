export const frontendTenantTransport = {
  tenantIdQueryParameter: 'tenantId'
} as const;

export function appendTenantIdToUrl(targetUrl: URL, tenantId: string | undefined): URL {
  if (tenantId !== undefined && tenantId.trim().length > 0) {
    targetUrl.searchParams.set(frontendTenantTransport.tenantIdQueryParameter, tenantId.trim());
  }

  return targetUrl;
}

export function withTenantIdInBody<TBody extends Record<string, unknown>>(
  body: TBody,
  tenantId: string
): TBody & { tenantId: string } {
  return {
    ...body,
    tenantId
  };
}
