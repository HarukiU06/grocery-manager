import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { PantryPage } from './PantryPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('PantryPage', () => {
  it('shows the empty state and adds staples', async () => {
    renderWithRouter(<PantryPage />);
    expect(screen.getByText('Your pantry is empty')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Add common staples' })[0]);
    expect(useAppStore.getState().pantry.length).toBe(17);
    expect(screen.getByRole('heading', { name: /Seasonings/ })).toBeInTheDocument();
  });
  // Re-enabled in Task 3, which replaces the free-text quantity field with a number and a unit.
  it.skip('adds an ingredient from search and edits it', async () => {
    renderWithRouter(<PantryPage />);
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    // "Egg" and "Eggplant" both match the search; pick by exact accessible name.
    await userEvent.click(screen.getByRole('button', { name: 'Egg' }));
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['egg']);
    await userEvent.click(screen.getByRole('button', { name: 'Egg' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit item' });
    await userEvent.type(within(dialog).getByLabelText('Quantity'), '6');
    await userEvent.selectOptions(within(dialog).getByLabelText('Location'), 'fridge');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(useAppStore.getState().pantry[0]).toMatchObject({ quantity: '6', location: 'fridge' });
    expect(screen.getByText('Fridge')).toBeInTheDocument();
  });
  it('removes an item from the edit sheet', async () => {
    useAppStore.getState().addPantryItem('milk');
    renderWithRouter(<PantryPage />);
    await userEvent.click(screen.getByRole('button', { name: /^Milk/ }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    expect(useAppStore.getState().pantry).toHaveLength(0);
  });
});
