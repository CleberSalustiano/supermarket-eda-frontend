import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { AppFrame } from './app-frame';

describe('AppFrame', () => {
  it('puts the skip link first and renders nav, banner, top bar end and content', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/produtos']}>
        <AppFrame
          appName="Gestão"
          topBarEnd={<span>fim</span>}
          banner={<p>aviso</p>}
          nav={[
            { to: '/produtos', label: 'Produtos' },
            { to: '/resultado', label: 'Resultado' }
          ]}
        >
          <p>conteúdo</p>
        </AppFrame>
      </MemoryRouter>
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent('Ir para o conteúdo');
    expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Resultado' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('aviso')).toBeInTheDocument();
    expect(screen.getByText('fim')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('conteúdo');
    expect(screen.getByRole('button', { name: 'Preferências' })).toBeInTheDocument();
  });

  it('omits the nav when none is given', () => {
    renderWithProviders(
      <MemoryRouter>
        <AppFrame appName="Caixa">
          <p>x</p>
        </AppFrame>
      </MemoryRouter>
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
