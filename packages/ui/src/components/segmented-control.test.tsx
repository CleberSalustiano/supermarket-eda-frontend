import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render-with-providers';
import { SegmentedControl } from './segmented-control';

function Harness() {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a');
  return (
    <SegmentedControl
      label="Forma"
      value={value}
      onChange={setValue}
      options={[
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' }
      ]}
    />
  );
}

describe('SegmentedControl', () => {
  it('exposes a labelled radiogroup with roving tabindex', () => {
    renderWithProviders(<Harness />);
    expect(screen.getByRole('radiogroup', { name: 'Forma' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'A' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves and selects with arrow keys, wrapping around', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    screen.getByRole('radio', { name: 'A' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'C' })).toBeChecked();
  });

  it('selects with Space', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('radio', { name: 'A' }));
    expect(screen.getByRole('radio', { name: 'A' })).toBeChecked();
    await user.keyboard(' ');
    expect(screen.getByRole('radio', { name: 'A' })).toBeChecked();
  });
});
