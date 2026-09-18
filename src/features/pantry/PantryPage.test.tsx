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
