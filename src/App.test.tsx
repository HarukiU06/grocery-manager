import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { defaultPersistedState } from './store/migrations';
import { useAppStore } from './store/useAppStore';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('App', () => {
  it('renders the pantry page and navigation', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Pantry' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });
});
