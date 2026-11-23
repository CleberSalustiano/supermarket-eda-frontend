import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { Popover } from './popover';

describe('Popover', () => {
  it('toggles aria-expanded and shows the panel', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Popover triggerLabel="Abrir" triggerIcon={<span>i</span>}>
        <button>Dentro</button>
      </Popover>
    );
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Dentro' })).toBeVisible();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Popover triggerLabel="Abrir" triggerIcon={<span>i</span>}>
        <button>Dentro</button>
      </Popover>
    );
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Dentro' }));
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <div>
        <button>Fora</button>
        <Popover triggerLabel="Abrir" triggerIcon={<span>i</span>}>
          <p>Painel</p>
        </Popover>
      </div>
    );
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(screen.getByRole('button', { name: 'Fora' }));
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveAttribute('aria-expanded', 'false');
  });
});
