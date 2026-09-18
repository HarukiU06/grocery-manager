import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '../../components/toastStore';
import * as exportImport from '../../store/exportImport';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { SettingsPage } from './SettingsPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('SettingsPage', () => {
  it('switches language and threshold', async () => {
    renderWithRouter(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: '日本語' }));
    expect(useAppStore.getState().language).toBe('ja');
    expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(useAppStore.getState().almostThreshold).toBe(5);
  });
  it('exports a JSON file', async () => {
    const spy = vi.spyOn(exportImport, 'downloadTextFile').mockImplementation(() => {});
    renderWithRouter(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/^grocery-manager-\d{4}-\d{2}-\d{2}\.json$/),
      expect.stringContaining('"schemaVersion": 2'),
    );
    spy.mockRestore();
  });
  it('imports a valid file after confirmation and rejects an invalid one', async () => {
    renderWithRouter(<SettingsPage />);
    const input = screen.getByLabelText('Import JSON') as HTMLInputElement;
    const good = new File(
      [JSON.stringify({ ...defaultPersistedState('en'), pantry: [{ ingredientId: 'egg', addedOn: '2026-09-18' }] })],
      'data.json',
      { type: 'application/json' },
    );
    await userEvent.upload(input, good);
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm' }));
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['egg']);
    const bad = new File(['nope'], 'bad.json', { type: 'application/json' });
    await userEvent.upload(input, bad);
    // The toast host lives in the app layout; assert on the toast store instead.
    await waitFor(() => expect(useToastStore.getState().message).toBe('Could not import this file.'));
    expect(useAppStore.getState().pantry).toHaveLength(1);
  });
  it('resets data after confirmation', async () => {
    useAppStore.getState().addPantryItem('egg');
    renderWithRouter(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Reset all data' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset all data' }));
    expect(useAppStore.getState().pantry).toHaveLength(0);
  });
});
