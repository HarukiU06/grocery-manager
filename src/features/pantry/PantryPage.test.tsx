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
  it('adds an ingredient from search and edits its quantity', async () => {
    renderWithRouter(<PantryPage />);
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    await userEvent.click(screen.getByRole('button', { name: 'Egg' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Add to pantry' })).getByRole('button', { name: 'Add' }));
    await userEvent.click(screen.getByRole('button', { name: 'Egg' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit item' });
    await userEvent.type(within(dialog).getByLabelText('Amount'), '6');
    await userEvent.selectOptions(within(dialog).getByLabelText('Unit'), 'pcs');
    await userEvent.type(within(dialog).getByLabelText('Note'), 'from the market');
    await userEvent.selectOptions(within(dialog).getByLabelText('Location'), 'fridge');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(useAppStore.getState().pantry[0]).toMatchObject({
      quantity: { amount: 6, unit: 'pcs' },
      note: 'from the market',
      location: 'fridge',
    });
    expect(screen.getByText('6 pcs')).toBeInTheDocument();
    expect(screen.getByText('from the market')).toBeInTheDocument();
  });
  it('adds the bought amount to what is already on hand from search', async () => {
    useAppStore.getState().addPantryItem('egg', { quantity: { amount: 4, unit: 'pcs' } });
    renderWithRouter(<PantryPage />);
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    expect(screen.getByText('In pantry · 4 pcs')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Egg' }));
    const dialog = screen.getByRole('dialog', { name: 'Add to pantry' });
    expect(within(dialog).getByText('On hand: 4 pcs')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Unit')).toHaveValue('pcs');
    await userEvent.type(within(dialog).getByLabelText('Amount bought'), '6{Enter}');
    expect(useAppStore.getState().pantry[0].quantity).toEqual({ amount: 10, unit: 'pcs' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('10 pcs')).toBeInTheDocument();
  });
  it('previews the total and converts units before adding', async () => {
    useAppStore.getState().addPantryItem('milk', { quantity: { amount: 500, unit: 'ml' } });
    renderWithRouter(<PantryPage />);
    await userEvent.type(screen.getByRole('searchbox'), 'milk');
    await userEvent.click(screen.getByRole('button', { name: 'Milk' }));
    const dialog = screen.getByRole('dialog', { name: 'Add to pantry' });
    await userEvent.type(within(dialog).getByLabelText('Amount bought'), '1');
    await userEvent.selectOptions(within(dialog).getByLabelText('Unit'), 'l');
    expect(within(dialog).getByText('500 ml + 1 L = 1500 ml')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(useAppStore.getState().pantry[0].quantity).toEqual({ amount: 1500, unit: 'ml' });
  });
  it('adds a new ingredient with its bought amount from search', async () => {
    renderWithRouter(<PantryPage />);
    await userEvent.type(screen.getByRole('searchbox'), 'onion');
    await userEvent.click(screen.getByRole('button', { name: 'Onion' }));
    const dialog = screen.getByRole('dialog', { name: 'Add to pantry' });
    expect(within(dialog).getByText('Not in your pantry yet.')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('Amount bought'), '3');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(useAppStore.getState().pantry[0]).toMatchObject({ ingredientId: 'onion', quantity: { amount: 3, unit: 'pcs' } });
  });
  it('keeps the quantity empty when only a unit is chosen', async () => {
    useAppStore.getState().addPantryItem('milk');
    renderWithRouter(<PantryPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Milk' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit item' });
    await userEvent.selectOptions(within(dialog).getByLabelText('Unit'), 'ml');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(useAppStore.getState().pantry[0].quantity).toBeUndefined();
  });
  it('removes an item from the edit sheet', async () => {
    useAppStore.getState().addPantryItem('milk');
    renderWithRouter(<PantryPage />);
    await userEvent.click(screen.getByRole('button', { name: /^Milk/ }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    expect(useAppStore.getState().pantry).toHaveLength(0);
  });
  it('hides the expiry field and badge when tracking is off', async () => {
    useAppStore.getState().addPantryItem('milk', { expiresOn: '2020-01-01' });
    useAppStore.getState().setTrackExpiry(false);
    renderWithRouter(<PantryPage />);
    expect(screen.queryByText('Expired')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Milk' }));
    expect(within(screen.getByRole('dialog')).queryByLabelText('Best before')).not.toBeInTheDocument();
  });
});
