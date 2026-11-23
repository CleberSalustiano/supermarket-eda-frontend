import { useUiMessages } from '../i18n/ui-i18n';

export function ConfigurationErrorScreen({ missing }: { missing: string[] }) {
  const m = useUiMessages();
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 bg-floor p-6 text-ink">
      <h1 className="font-display text-title">{m.config.title}</h1>
      <p className="text-body">{m.config.body}</p>
      <ul className="flex flex-col gap-1 text-body">
        {missing.map((name) => (
          <li key={name}>
            <code className="rounded-control border border-edge bg-paper px-2 py-0.5 text-small">{name}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
