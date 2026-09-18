import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { RecipeDetailPage } from './RecipeDetailPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

const renderDetail = (id: string) =>
  renderWithRouter(<RecipeDetailPage />, { route: `/recipes/${id}`, path: '/recipes/:id' });

describe('RecipeDetailPage', () => {
  it('scales ingredient amounts with the servings stepper', async () => {
    renderDetail('teriyaki-chicken');
    expect(screen.getByText('300 g')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More servings' }));
    expect(screen.getByText('450 g')).toBeInTheDocument();
  });
  it('marks have and missing ingredients and adds missing to shopping', async () => {
    useAppStore.getState().addPantryItem('chicken-thigh');
    renderDetail('teriyaki-chicken');
    const list = screen.getByRole('list', { name: 'Ingredients' });
    expect(within(list).getAllByText('Have')).toHaveLength(1);
    expect(within(list).getAllByText('Missing')).toHaveLength(5);
    await userEvent.click(screen.getByRole('button', { name: 'Add missing to shopping list' }));
    expect(useAppStore.getState().shoppingList).toHaveLength(5);
  });
  it('duplicates a preset into a custom recipe', async () => {
    renderDetail('teriyaki-chicken');
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate & edit' }));
    expect(useAppStore.getState().customRecipes[0].name.en).toBe('Teriyaki chicken (copy)');
  });
  it('deletes a custom recipe after confirmation', async () => {
    const created = useAppStore.getState().addCustomRecipe({
      name: { en: 'Mine' },
      cuisine: 'other',
      category: 'main',
      baseServings: 2,
      ingredients: [{ ingredientId: 'egg' }],
      steps: { en: ['Cook'] },
    });
    renderDetail(created.id);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(useAppStore.getState().customRecipes).toHaveLength(0);
  });
  it('shows not found for unknown ids', () => {
    renderDetail('nope');
    expect(screen.getByText('Recipe not found.')).toBeInTheDocument();
  });
  it('shows nutrition per serving and for the whole recipe', async () => {
    renderDetail('teriyaki-chicken');
    const panel = screen.getByRole('region', { name: 'Nutrition' });
    expect(within(panel).getByRole('button', { name: 'Per serving' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(panel).getByText('Energy')).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: 'Whole recipe' }));
    expect(within(panel).getByRole('button', { name: 'Whole recipe' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('switches ingredient amounts to grams', async () => {
    renderDetail('teriyaki-chicken');
    expect(screen.getByText('300 g')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Grams' }));
    expect(useAppStore.getState().amountDisplay).toBe('grams');
    // Soy sauce and mirin are both 2 tbsp, which is about 36 g each; sugar's 1 tbsp is 9 g.
    expect(screen.getAllByText('36 g')).toHaveLength(2);
    expect(screen.getByText('9 g')).toBeInTheDocument();
  });
});
