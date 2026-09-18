import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { SuggestionsPage } from './SuggestionsPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

function stock(...ids: string[]) {
  for (const id of ids) useAppStore.getState().addPantryItem(id);
}

describe('SuggestionsPage', () => {
  it('lists ready and almost recipes from the pantry', () => {
    // Tamagoyaki needs egg, sugar, soy-sauce, dashi-granules, cooking-oil.
    stock('egg', 'sugar', 'soy-sauce', 'dashi-granules', 'cooking-oil');
    renderWithRouter(<SuggestionsPage />);
    const ready = screen.getByRole('region', { name: 'Ready to cook' });
    expect(within(ready).getByText('Tamagoyaki (rolled omelette)')).toBeInTheDocument();
    // Spinach goma-ae needs spinach, sesame-seeds, soy-sauce, sugar -> missing 2 -> almost.
    const almost = screen.getByRole('region', { name: 'Almost there' });
    expect(within(almost).getByText('Spinach with sesame dressing')).toBeInTheDocument();
  });
  it('adds a missing ingredient to the shopping list from the buy-to-unlock section', async () => {
    stock('egg', 'sugar', 'soy-sauce', 'dashi-granules', 'cooking-oil', 'spinach');
    renderWithRouter(<SuggestionsPage />);
    const buy = screen.getByRole('region', { name: 'Buy this, unlock that' });
    const row = within(buy).getByText('Toasted sesame seeds').closest('li')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Add to shopping list' }));
    expect(useAppStore.getState().shoppingList.map((i) => i.ingredientId)).toEqual(['sesame-seeds']);
  });
  it('changes servings and filters by cuisine', async () => {
    stock('egg', 'sugar', 'soy-sauce', 'dashi-granules', 'cooking-oil');
    renderWithRouter(<SuggestionsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'More servings' }));
    expect(useAppStore.getState().servings).toBe(3);
    await userEvent.click(screen.getByRole('button', { name: 'Western' }));
    expect(screen.queryByText('Tamagoyaki (rolled omelette)')).not.toBeInTheDocument();
  });
});
