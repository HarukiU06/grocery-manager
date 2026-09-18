import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { RecipesPage } from './RecipesPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('RecipesPage', () => {
  it('lists presets and filters by search and cuisine', async () => {
    renderWithRouter(<RecipesPage />);
    expect(screen.getByRole('link', { name: /Nikujaga/ })).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'carbo');
    expect(screen.getByRole('link', { name: /Carbonara/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Nikujaga/ })).not.toBeInTheDocument();
    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Chinese' }));
    expect(screen.getByRole('link', { name: /Mapo tofu/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Carbonara/ })).not.toBeInTheDocument();
  });
  it('searches Japanese names when the UI is Japanese', async () => {
    useAppStore.getState().setLanguage('ja');
    renderWithRouter(<RecipesPage />);
    await userEvent.type(screen.getByRole('searchbox'), '肉じゃが');
    expect(screen.getByRole('link', { name: /肉じゃが/ })).toBeInTheDocument();
  });
  it('marks custom recipes and links to the new-recipe form', () => {
    useAppStore.getState().addCustomRecipe({
      name: { en: 'My stew' },
      cuisine: 'other',
      category: 'main',
      baseServings: 2,
      ingredients: [{ ingredientId: 'egg' }],
      steps: { en: ['Cook'] },
    });
    renderWithRouter(<RecipesPage />);
    expect(screen.getByRole('link', { name: /My stew.*Custom/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New recipe' })).toHaveAttribute('href', '/recipes/new');
  });
});
