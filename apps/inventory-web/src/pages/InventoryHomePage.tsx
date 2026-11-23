import { EmptyState } from '@supermarket/frontend-ui';

import { useI18n } from '../i18n';

export function InventoryHomePage() {
  const { m } = useI18n();

  return (
    <div className="mx-auto max-w-[1040px]">
      <h1 className="font-display text-title text-ink">{m.nav.home}</h1>
      <EmptyState title={m.empty.title} body={m.empty.body} />
    </div>
  );
}
