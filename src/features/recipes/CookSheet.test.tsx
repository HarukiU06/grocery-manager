import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRESET_RECIPES } from '../../data/recipes';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { CookSheet } from './CookSheet';

const recipe = PRESET_RECIPES.find((r) => r.id === 'teriyaki-chicken')!;

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('CookSheet', () => {
  it('records an entry with a nutrition snapshot and removes the checked ingredients', async () => {
    const s = useAppStore.getState();
    s.addPantryItem('chicken-thigh');
    s.addPantryItem('soy-sauce');
    renderWithRouter(<CookSheet recipe={recipe} open onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Record what you cooked' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Soy sauce' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Record' }));
    const log = useAppStore.getState().cookingLog;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ recipeId: 'teriyaki-chicken', servings: 2 });
    expect(log[0].nutrition?.energy).toBeGreaterThan(0);
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['soy-sauce']);
  });
  it('records the servings chosen in the sheet', async () => {
    renderWithRouter(<CookSheet recipe={recipe} open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'More servings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Record' }));
    expect(useAppStore.getState().cookingLog[0].servings).toBe(3);
  });
});
