import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { defaultPersistedState } from '../store/migrations';
import { useAppStore } from '../store/useAppStore';
import { ServingsStepper } from './ServingsStepper';

describe('ServingsStepper', () => {
  it('shows the count and clamps at the bounds', async () => {
    useAppStore.setState(defaultPersistedState('en'));
    const onChange = vi.fn();
    render(<ServingsStepper value={12} onChange={onChange} />);
    expect(screen.getByText('12 servings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More servings' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Fewer servings' }));
    expect(onChange).toHaveBeenCalledWith(11);
  });
});
