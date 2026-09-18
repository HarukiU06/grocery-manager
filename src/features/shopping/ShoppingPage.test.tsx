import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { ShoppingPage } from './ShoppingPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('ShoppingPage', () => {
  it('shows the empty state, adds via search, buys and removes', async () => {
    renderWithRouter(<ShoppingPage />);
    expect(screen.getByText('Your shopping list is empty.')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'milk');
    await userEvent.click(screen.getByRole('button', { name: 'Milk' }));
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    await userEvent.click(screen.getByRole('button', { name: 'Egg' }));
    expect(useAppStore.getState().shoppingList).toHaveLength(2);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mark as bought Milk' }));
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['milk']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Egg' }));
    expect(useAppStore.getState().shoppingList).toHaveLength(0);
  });
});
