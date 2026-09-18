import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LogPage } from './features/log/LogPage';
import { PantryPage } from './features/pantry/PantryPage';
import { ImportRecipePage } from './features/recipes/ImportRecipePage';
import { RecipeDetailPage } from './features/recipes/RecipeDetailPage';
import { RecipeFormPage } from './features/recipes/RecipeFormPage';
import { RecipesPage } from './features/recipes/RecipesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ShoppingPage } from './features/shopping/ShoppingPage';
import { SuggestionsPage } from './features/suggestions/SuggestionsPage';

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <PantryPage /> },
      { path: 'suggestions', element: <SuggestionsPage /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipes/new', element: <RecipeFormPage /> },
      { path: 'recipes/import', element: <ImportRecipePage /> },
      { path: 'recipes/:id', element: <RecipeDetailPage /> },
      { path: 'recipes/:id/edit', element: <RecipeFormPage /> },
      { path: 'shopping', element: <ShoppingPage /> },
      { path: 'log', element: <LogPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
