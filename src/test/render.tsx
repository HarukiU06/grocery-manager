import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

interface Options {
  route?: string;
  path?: string;
}

/** Render a page inside a memory router so `useParams` and `Link` work. */
export function renderWithRouter(ui: ReactElement, { route = '/', path = '*' }: Options = {}): RenderResult {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}
