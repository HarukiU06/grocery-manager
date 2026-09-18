import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { IngredientPicker } from './IngredientPicker';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('IngredientPicker', () => {
  it('searches the catalog and picks a result', async () => {
    const onPick = vi.fn();
    render(<IngredientPicker onPick={onPick} placeholder="Search" />);
    await userEvent.type(screen.getByRole('searchbox'), 'oni');
    await userEvent.click(screen.getByRole('button', { name: /^Onion/ }));
    expect(onPick).toHaveBeenCalledWith('onion');
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
  it('marks disabled ids', async () => {
    render(
      <IngredientPicker onPick={vi.fn()} placeholder="Search" disabledIds={new Set(['onion'])} disabledLabel="In pantry" />,
    );
    await userEvent.type(screen.getByRole('searchbox'), 'onion');
    expect(screen.getByRole('button', { name: 'Onion' })).toBeDisabled();
    expect(screen.getByText('In pantry')).toBeInTheDocument();
  });
  it('creates a new ingredient when there is no exact match', async () => {
    const onPick = vi.fn();
    render(<IngredientPicker onPick={onPick} placeholder="Search" />);
    await userEvent.type(screen.getByRole('searchbox'), 'Dragon fruit');
    await userEvent.click(screen.getByRole('button', { name: 'Create "Dragon fruit"' }));
    expect(screen.getByRole('dialog', { name: 'New ingredient' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name (English)')).toHaveValue('Dragon fruit');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'fruit');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const created = useAppStore.getState().customIngredients[0];
    expect(created).toMatchObject({ name: { en: 'Dragon fruit' }, category: 'fruit', isPreset: false });
    expect(onPick).toHaveBeenCalledWith(created.id);
  });
});
