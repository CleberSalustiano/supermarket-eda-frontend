import { act, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import { createI18n, useLocale } from './create-i18n';

type Messages = { hello: string; total: (p: { amount: string }) => string };

const catalogs: Record<'pt-BR' | 'en', Messages> = {
  'pt-BR': { hello: 'Olá', total: (p) => `Total ${p.amount}` },
  en: { hello: 'Hello', total: (p) => `Sum ${p.amount}` }
};

const { I18nProvider, useI18n } = createI18n<Messages>();

function Probe() {
  const { m, fmt, locale, setLocale } = useI18n();
  return (
    <div>
      <p>{m.hello}</p>
      <p data-testid="total">{m.total({ amount: fmt.currency(1) })}</p>
      <p data-testid="locale">{locale}</p>
      <button type="button" onClick={() => setLocale('en')}>
        en
      </button>
    </div>
  );
}

function SharedLocale() {
  return <p data-testid="shared">{useLocale().locale}</p>;
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = '';
  vi.restoreAllMocks();
});

describe('createI18n', () => {
  it('starts with the default locale and sets <html lang>', () => {
    render(
      <I18nProvider catalogs={catalogs} defaultLocale="pt-BR">
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByText('Olá')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('pt-BR');
  });

  it('prefers the stored locale over the default', () => {
    window.localStorage.setItem('supermarket.locale', 'en');
    render(
      <I18nProvider catalogs={catalogs} defaultLocale="pt-BR">
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('switches locale, persists it and updates <html lang> and the shared context', () => {
    render(
      <I18nProvider catalogs={catalogs} defaultLocale="pt-BR">
        <Probe />
        <SharedLocale />
      </I18nProvider>
    );
    act(() => {
      screen.getByRole('button', { name: 'en' }).click();
    });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByTestId('total')).toHaveTextContent('Sum R$1.00');
    expect(screen.getByTestId('shared')).toHaveTextContent('en');
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('supermarket.locale')).toBe('en');
  });

  it('works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    render(
      <I18nProvider catalogs={catalogs} defaultLocale="pt-BR">
        <Probe />
      </I18nProvider>
    );
    act(() => {
      screen.getByRole('button', { name: 'en' }).click();
    });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('useI18n must be used inside an I18nProvider');
    expect(() => render(<SharedLocale />)).toThrow('useLocale must be used inside an I18nProvider');
  });
});
