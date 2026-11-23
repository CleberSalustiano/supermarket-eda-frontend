import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { LaneLight } from './lane-light';

describe('LaneLight', () => {
  it('shows the open state with a go dot', () => {
    const { container } = renderWithProviders(<LaneLight state="open" label="Caixa register-01" />);
    expect(screen.getByText('Caixa register-01')).toBeInTheDocument();
    expect(screen.getByText('Aberto')).toBeInTheDocument();
    expect(container.querySelector('.bg-go')).not.toBeNull();
  });

  it('shows the closed state with a stop dot', () => {
    const { container } = renderWithProviders(<LaneLight state="closed" label="Register" />, { locale: 'en' });
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(container.querySelector('.bg-stop')).not.toBeNull();
  });
});
