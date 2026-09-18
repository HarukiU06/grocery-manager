import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { emptyTotals } from '../../domain/nutrition';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { LogPage } from './LogPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('LogPage', () => {
  it('shows the empty state', () => {
    renderWithRouter(<LogPage />);
    expect(screen.getByText('Nothing recorded yet')).toBeInTheDocument();
  });
  it('lists entries by week and deletes one', async () => {
    const s = useAppStore.getState();
    s.logCook({
      recipeId: 'a',
      recipeName: { en: 'Teriyaki chicken' },
      servings: 2,
      cookedOn: '2026-09-16',
      nutrition: { ...emptyTotals(), energy: 500 },
    });
    s.logCook({ recipeId: 'b', recipeName: { en: 'Miso soup' }, servings: 2, cookedOn: '2026-09-16' });
    renderWithRouter(<LogPage />);
    expect(screen.getByText('Teriyaki chicken')).toBeInTheDocument();
    expect(screen.getByText('1 entries have no nutrition data')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Miso soup' }));
    expect(useAppStore.getState().cookingLog).toHaveLength(1);
  });
});
