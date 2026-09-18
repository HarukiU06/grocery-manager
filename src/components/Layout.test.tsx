import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../store/migrations';
import { useAppStore } from '../store/useAppStore';
import { renderWithRouter } from '../test/render';
import { Layout } from './Layout';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('Layout', () => {
  it('renders five navigation tabs in the active language', async () => {
    renderWithRouter(<Layout />);
    expect(screen.getByRole('link', { name: 'Pantry' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cook' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recipes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shopping' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    useAppStore.getState().setLanguage('ja');
    expect(await screen.findByRole('link', { name: '在庫' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ja');
  });
  it('navigates between tabs', async () => {
    renderWithRouter(<Layout />);
    await userEvent.click(screen.getByRole('link', { name: 'Settings' }));
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
  });
});
