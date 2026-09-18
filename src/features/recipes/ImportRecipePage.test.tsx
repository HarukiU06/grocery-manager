import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { ImportRecipePage } from './ImportRecipePage';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
  navigate.mockReset();
  useAppStore.setState(defaultPersistedState('en'));
});

describe('ImportRecipePage', () => {
  it('parses pasted text and carries a draft to the form', async () => {
    renderWithRouter(<ImportRecipePage />);
    await userEvent.type(
      screen.getByLabelText('Or paste the ingredient list'),
      'Onion 1 pcs\nSoy sauce 2 tbsp\nDragonfruit 1 pcs',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Read the text' }));
    expect(screen.getByText('Onion')).toBeInTheDocument();
    expect(screen.getByText('Dragonfruit')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue to the form' }));
    expect(navigate).toHaveBeenCalledWith('/recipes/new', expect.objectContaining({ state: expect.anything() }));
    const draft = navigate.mock.calls[0][1].state.draft;
    expect(draft.ingredients.map((i: { ingredientId: string }) => i.ingredientId)).toEqual(['onion', 'soy-sauce']);
  });
  it('adds an unmatched line as a new ingredient', async () => {
    renderWithRouter(<ImportRecipePage />);
    await userEvent.type(screen.getByLabelText('Or paste the ingredient list'), 'Dragonfruit 1 pcs');
    await userEvent.click(screen.getByRole('button', { name: 'Read the text' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add as a new ingredient' }));
    expect(useAppStore.getState().customIngredients[0].name.en).toBe('Dragonfruit');
  });
});
