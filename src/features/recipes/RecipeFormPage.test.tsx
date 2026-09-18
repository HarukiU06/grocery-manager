import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { RecipeFormPage } from './RecipeFormPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('RecipeFormPage', () => {
  it('shows validation errors and then saves a new recipe', async () => {
    renderWithRouter(<RecipeFormPage />, { route: '/recipes/new', path: '/recipes/new' });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a name in at least one language.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name (English)'), 'Egg on rice');
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    await userEvent.click(screen.getByRole('button', { name: 'Egg' }));
    await userEvent.type(screen.getByLabelText('Amount'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Unit'), 'pcs');
    await userEvent.type(screen.getByLabelText('Steps (English, one per line)'), 'Crack egg over rice');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const saved = useAppStore.getState().customRecipes[0];
    expect(saved).toMatchObject({
      name: { en: 'Egg on rice' },
      ingredients: [{ ingredientId: 'egg', amount: 1, unit: 'pcs' }],
      steps: { en: ['Crack egg over rice'] },
    });
  });
  it('edits an existing custom recipe', async () => {
    const created = useAppStore.getState().addCustomRecipe({
      name: { en: 'Mine' },
      cuisine: 'other',
      category: 'main',
      baseServings: 2,
      ingredients: [{ ingredientId: 'egg' }],
      steps: { en: ['Cook'] },
    });
    renderWithRouter(<RecipeFormPage />, { route: `/recipes/${created.id}/edit`, path: '/recipes/:id/edit' });
    expect(screen.getByRole('heading', { name: 'Edit recipe' })).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Name (English)'));
    await userEvent.type(screen.getByLabelText('Name (English)'), 'Renamed');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(useAppStore.getState().customRecipes[0].name.en).toBe('Renamed');
  });
});
