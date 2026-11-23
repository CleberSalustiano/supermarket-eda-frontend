import { ApiClientError, resolveApiClientCorrelationId, resolveApiClientErrorMessage } from '@supermarket/api-sdk';
import { InlineMessage, useUiMessages } from '@supermarket/frontend-ui';

export function ApiErrorMessage({ title, error }: { title: string; error: unknown }) {
  const ui = useUiMessages();

  if (!(error instanceof ApiClientError)) {
    return <InlineMessage tone="danger" title={ui.message.network} />;
  }

  return (
    <InlineMessage
      tone="danger"
      title={title}
      detail={resolveApiClientErrorMessage(error)}
      supportCode={resolveApiClientCorrelationId(error)}
    />
  );
}
