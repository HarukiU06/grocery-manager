# Grocery Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (JA/EN) single-page web app that tracks the groceries and seasonings a household has, suggests recipes that can be cooked now, and shows which single purchases unlock more recipes.

**Architecture:** React SPA with no backend. A pure-function domain layer (matching, scaling, search, dates) is tested in isolation; a single Zustand store persists to localStorage; feature folders hold one page each; preset content lives in typed data files validated by an integrity test.

**Tech Stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`), Zustand v5 (`persist`), react-router-dom v7 (hash router), Vitest, @testing-library/react, jsdom, ESLint (flat config).

**Spec:** `docs/superpowers/specs/2026-09-18-grocery-manager-design.md`

## Global Constraints

- All code, comments, commit messages, README.md and CLAUDE.md are in English. Japanese appears only inside i18n dictionaries and preset content.
- Every user-visible UI string goes through `t()` from `src/i18n`. Preset content uses `LocalizedText` + `localize()`.
- Presets must provide both `ja` and `en` for every localized field (enforced by `src/data/data.test.ts`).
- Water is never an ingredient.
- `tsconfig` uses `verbatimModuleSyntax: true`: type-only imports must use `import type`.
- `noUnusedLocals` and `noUnusedParameters` are on; `npm run build` runs `tsc -b` first and must pass.
- Matching is presence-based; optional recipe ingredients never affect status.
- `EXPIRING_SOON_DAYS = 3`; servings 1..12 (default 2); `almostThreshold` 1..3 (default 2).
- localStorage key: `grocery-manager`; schema version 1.
- Preset recipes use `baseServings: 2`.
- Git: local only, commit after each task, no remote push.

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html` | Tooling |
| `src/main.tsx`, `src/App.tsx`, `src/index.css` | Entry, router, global CSS |
| `src/domain/types.ts` | All domain types + runtime constant lists |
| `src/domain/localize.ts` | `localize`, `localizeList`, `otherLang` |
| `src/domain/dates.ts` | ISO date helpers, expiry status |
| `src/domain/ids.ts` | `newId(prefix)` |
| `src/domain/scaling.ts` | `scaleAmount`, `formatQuantity`, `formatIngredientAmount` |
| `src/domain/search.ts` | `searchIngredients`, `hasExactMatch`, `normalizeForSearch` |
| `src/domain/matching.ts` | `evaluateRecipe`, `buildSuggestions` |
| `src/i18n/en.ts`, `src/i18n/ja.ts` | Dictionaries; `TranslationKey` derived from `en` |
| `src/i18n/translate.ts` | Pure `translate(lang, key, params)` |
| `src/i18n/index.ts` | `useT`, `useLang`, re-exports (needs the store) |
| `src/data/ingredients.ts` | `PRESET_INGREDIENTS` |
| `src/data/staples.ts` | `COMMON_STAPLE_IDS` |
| `src/data/recipes/{japanese,western,chinese,other,index}.ts` | `PRESET_RECIPES` |
| `src/data/data.test.ts` | Integrity test |
| `src/store/migrations.ts` | `defaultPersistedState`, `detectLanguage`, `migrate` |
| `src/store/exportImport.ts` | `serializeState`, `parseImportedState`, `downloadTextFile` |
| `src/store/useAppStore.ts` | Zustand store + actions + storage fallback |
| `src/store/selectors.ts` | `useAllIngredients`, `useIngredientLookup`, `useAllRecipes`, `useRecipe`, `usePantryIds`, `useIngredientName` |
| `src/components/*` | Shared UI: `Layout`, `BottomNav`, `PageHeader`, `Button`, `Badge`, `Chip`, `Sheet`, `ConfirmDialog`, `SearchInput`, `ServingsStepper`, `EmptyState`, `Toast` |
| `src/features/pantry/*` | `PantryPage`, `groupPantry.ts`, `PantryGroup`, `PantryItemRow`, `PantryItemSheet`, `IngredientPicker`, `NewIngredientForm` |
| `src/features/suggestions/*` | `SuggestionsPage`, `RecipeMatchCard`, `BuyToUnlockList` |
| `src/features/recipes/*` | `RecipesPage`, `RecipeDetailPage`, `RecipeFormPage`, `recipeDraft.ts` |
| `src/features/shopping/ShoppingPage.tsx` | Shopping list |
| `src/features/settings/SettingsPage.tsx` | Settings |
| `src/test/setup.ts`, `src/test/factories.ts`, `src/test/render.tsx` | Test helpers |
| `README.md`, `CLAUDE.md` | Docs |

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev|build|test|lint` scripts; Vitest configured with jsdom and jest-dom matchers.

- [ ] **Step 1: Write package.json and install dependencies**

```json
{
  "name": "grocery-manager",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint ."
  }
}
```

Run:
```bash
npm install react react-dom react-router-dom zustand
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/dom eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals
```

- [ ] **Step 2: Write tooling config**

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

`tsconfig.json`:
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

`eslint.config.js`:
```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
  },
]);
```

`index.html`:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Grocery Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@import "tailwindcss";

:root {
  color-scheme: light;
}
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
```

- [ ] **Step 3: Write the failing smoke test**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the app name', () => {
    render(<App />);
    expect(screen.getByText('Grocery Manager')).toBeInTheDocument();
  });
});
```

Run: `npm test` — Expected: FAIL (cannot resolve `./App`).

- [ ] **Step 4: Write entry and placeholder App**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`:
```tsx
export function App() {
  return <main className="p-4 text-lg font-semibold">Grocery Manager</main>;
}
```

- [ ] **Step 5: Verify tests, build and lint pass**

Run: `npm test && npm run build && npm run lint` — Expected: 1 test passes, `dist/` produced, no lint errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project with Tailwind and Vitest"
```

---

### Task 2: Domain types, localize, dates, ids

**Files:**
- Create: `src/domain/types.ts`, `src/domain/localize.ts`, `src/domain/dates.ts`, `src/domain/ids.ts`
- Test: `src/domain/localize.test.ts`, `src/domain/dates.test.ts`, `src/domain/ids.test.ts`

**Interfaces:**
- Produces: every type in spec §5 plus `PersistedState`, `CURRENT_SCHEMA_VERSION`, constant arrays `INGREDIENT_CATEGORIES`, `UNITS`, `CUISINES`, `RECIPE_CATEGORIES`, `STORAGE_LOCATIONS`; `localize(text, lang): string`; `localizeList(lists, lang): string[]`; `otherLang(lang)`; `todayIso(now?)`, `addDays(iso, n)`, `daysUntil(target, today)`, `isValidIsoDate(iso)`, `expiryStatus(expiresOn, today): 'ok'|'soon'|'expired'`, `EXPIRING_SOON_DAYS`; `newId(prefix)`.

- [ ] **Step 1: Write types**

`src/domain/types.ts`:
```ts
export type Lang = 'ja' | 'en';

/** Text that may exist in one or both languages. Presets always provide both. */
export interface LocalizedText {
  ja?: string;
  en?: string;
}

export type IngredientCategory =
  | 'vegetable'
  | 'fruit'
  | 'mushroom'
  | 'meat'
  | 'seafood'
  | 'egg_dairy'
  | 'tofu_soy'
  | 'grain_noodle_bread'
  | 'seasoning'
  | 'oil_fat'
  | 'canned_dry'
  | 'frozen'
  | 'other';

export const INGREDIENT_CATEGORIES: readonly IngredientCategory[] = [
  'vegetable', 'fruit', 'mushroom', 'meat', 'seafood', 'egg_dairy', 'tofu_soy',
  'grain_noodle_bread', 'seasoning', 'oil_fat', 'canned_dry', 'frozen', 'other',
];

export interface Ingredient {
  id: string;
  name: LocalizedText;
  category: IngredientCategory;
  aliases?: string[];
  isPreset: boolean;
}

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';
export const STORAGE_LOCATIONS: readonly StorageLocation[] = ['fridge', 'freezer', 'pantry'];

export interface PantryItem {
  ingredientId: string;
  quantity?: string;
  expiresOn?: string;
  location?: StorageLocation;
  addedOn: string;
}

export type Unit =
  | 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp' | 'cup'
  | 'clove' | 'slice' | 'bunch' | 'sheet' | 'can' | 'pack' | 'stalk' | 'pinch';

export const UNITS: readonly Unit[] = [
  'g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup',
  'clove', 'slice', 'bunch', 'sheet', 'can', 'pack', 'stalk', 'pinch',
];

export interface RecipeIngredient {
  ingredientId: string;
  amount?: number;
  unit?: Unit;
  note?: LocalizedText;
  optional?: boolean;
}

export type Cuisine = 'japanese' | 'western' | 'chinese' | 'other';
export const CUISINES: readonly Cuisine[] = ['japanese', 'western', 'chinese', 'other'];

export type RecipeCategory = 'main' | 'side' | 'soup' | 'rice' | 'noodle' | 'salad' | 'dessert';
export const RECIPE_CATEGORIES: readonly RecipeCategory[] = ['main', 'side', 'soup', 'rice', 'noodle', 'salad', 'dessert'];

export interface RecipeSteps {
  ja?: string[];
  en?: string[];
}

export interface Recipe {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  cuisine: Cuisine;
  category: RecipeCategory;
  baseServings: number;
  timeMinutes?: number;
  ingredients: RecipeIngredient[];
  steps: RecipeSteps;
  isPreset: boolean;
}

export interface ShoppingItem {
  ingredientId: string;
  addedOn: string;
}

export const CURRENT_SCHEMA_VERSION = 1;

export interface PersistedState {
  schemaVersion: number;
  language: Lang;
  servings: number;
  almostThreshold: number;
  customIngredients: Ingredient[];
  pantry: PantryItem[];
  customRecipes: Recipe[];
  shoppingList: ShoppingItem[];
}
```

- [ ] **Step 2: Write failing tests for localize, dates, ids**

`src/domain/localize.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { localize, localizeList, otherLang } from './localize';

describe('localize', () => {
  it('returns the requested language', () => {
    expect(localize({ ja: '玉ねぎ', en: 'Onion' }, 'ja')).toBe('玉ねぎ');
    expect(localize({ ja: '玉ねぎ', en: 'Onion' }, 'en')).toBe('Onion');
  });
  it('falls back to the other language', () => {
    expect(localize({ en: 'Onion' }, 'ja')).toBe('Onion');
    expect(localize({ ja: '玉ねぎ' }, 'en')).toBe('玉ねぎ');
  });
  it('returns empty string for missing text', () => {
    expect(localize(undefined, 'ja')).toBe('');
    expect(localize({}, 'en')).toBe('');
  });
  it('localizeList falls back when the list is missing or empty', () => {
    expect(localizeList({ ja: ['a'], en: ['b'] }, 'en')).toEqual(['b']);
    expect(localizeList({ ja: ['a'], en: [] }, 'en')).toEqual(['a']);
    expect(localizeList(undefined, 'en')).toEqual([]);
  });
  it('otherLang flips', () => {
    expect(otherLang('ja')).toBe('en');
    expect(otherLang('en')).toBe('ja');
  });
});
```

`src/domain/dates.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { addDays, daysUntil, expiryStatus, isValidIsoDate, todayIso } from './dates';

describe('dates', () => {
  it('formats today as local ISO date', () => {
    expect(todayIso(new Date(2026, 8, 18, 23, 30))).toBe('2026-09-18');
  });
  it('adds days across month boundaries', () => {
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('computes days until a date', () => {
    expect(daysUntil('2026-09-21', '2026-09-18')).toBe(3);
    expect(daysUntil('2026-09-17', '2026-09-18')).toBe(-1);
  });
  it('validates ISO dates', () => {
    expect(isValidIsoDate('2026-09-18')).toBe(true);
    expect(isValidIsoDate('2026-13-40')).toBe(false);
    expect(isValidIsoDate('nope')).toBe(false);
  });
  it('classifies expiry status with a 3-day window', () => {
    const today = '2026-09-18';
    expect(expiryStatus(undefined, today)).toBe('ok');
    expect(expiryStatus('2026-09-22', today)).toBe('ok');
    expect(expiryStatus('2026-09-21', today)).toBe('soon');
    expect(expiryStatus('2026-09-18', today)).toBe('soon');
    expect(expiryStatus('2026-09-17', today)).toBe('expired');
    expect(expiryStatus('garbage', today)).toBe('ok');
  });
});
```

`src/domain/ids.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { newId } from './ids';

describe('newId', () => {
  it('prefixes and never repeats', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId('custom')));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id.startsWith('custom-')).toBe(true);
  });
});
```

Run: `npm test` — Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`src/domain/localize.ts`:
```ts
import type { Lang, LocalizedText, RecipeSteps } from './types';

export function otherLang(lang: Lang): Lang {
  return lang === 'ja' ? 'en' : 'ja';
}

export function localize(text: LocalizedText | undefined, lang: Lang): string {
  if (!text) return '';
  return text[lang] || text[otherLang(lang)] || '';
}

export function localizeList(lists: RecipeSteps | undefined, lang: Lang): string[] {
  if (!lists) return [];
  const primary = lists[lang];
  if (primary && primary.length > 0) return primary;
  return lists[otherLang(lang)] ?? [];
}
```

`src/domain/dates.ts`:
```ts
export const EXPIRING_SOON_DAYS = 3;
const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function isValidIsoDate(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  const ms = parseIso(iso);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === iso;
}

export function addDays(iso: string, days: number): string {
  return new Date(parseIso(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysUntil(target: string, today: string): number {
  return Math.round((parseIso(target) - parseIso(today)) / DAY_MS);
}

export type ExpiryStatus = 'ok' | 'soon' | 'expired';

export function expiryStatus(expiresOn: string | undefined, today: string): ExpiryStatus {
  if (!expiresOn || !isValidIsoDate(expiresOn)) return 'ok';
  const days = daysUntil(expiresOn, today);
  if (days < 0) return 'expired';
  if (days <= EXPIRING_SOON_DAYS) return 'soon';
  return 'ok';
}
```

`src/domain/ids.ts`:
```ts
let counter = 0;

/** Readable, collision-resistant ID: prefix, base36 time, counter and random tail. */
export function newId(prefix: string): string {
  counter = (counter + 1) % 1296;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${time}${counter.toString(36).padStart(2, '0')}${rand}`;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat(domain): add core types, localization, date and id helpers"
```

---

### Task 3: i18n dictionaries and pure translate

**Files:**
- Create: `src/i18n/en.ts`, `src/i18n/ja.ts`, `src/i18n/translate.ts`
- Test: `src/i18n/translate.test.ts`

**Interfaces:**
- Produces: `en` (const dictionary), `TranslationKey = keyof typeof en`, `ja: Record<TranslationKey, string>`, `translate(lang, key, params?)`, `TranslateParams`, `TFunction`.
- The hook `useT` is added in Task 9 (it depends on the store).

- [ ] **Step 1: Write failing test**

`src/i18n/translate.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ja } from './ja';
import { translate } from './translate';

describe('translate', () => {
  it('returns strings in each language', () => {
    expect(translate('en', 'nav.pantry')).toBe('Pantry');
    expect(translate('ja', 'nav.pantry')).toBe('在庫');
  });
  it('interpolates params', () => {
    expect(translate('en', 'servings.label', { count: 3 })).toBe('3 servings');
    expect(translate('ja', 'servings.label', { count: 3 })).toBe('3人分');
  });
  it('leaves unknown placeholders untouched', () => {
    expect(translate('en', 'servings.label', {})).toBe('{count} servings');
  });
  it('has every English key in Japanese', () => {
    for (const key of Object.keys(en)) {
      expect(ja[key as keyof typeof en], key).toBeTruthy();
    }
  });
});
```

Run: `npm test -- translate` — Expected: FAIL.

- [ ] **Step 2: Write the English dictionary**

`src/i18n/en.ts`:
```ts
export const en = {
  'app.name': 'Grocery Manager',
  'nav.pantry': 'Pantry',
  'nav.suggestions': 'Cook',
  'nav.recipes': 'Recipes',
  'nav.shopping': 'Shopping',
  'nav.settings': 'Settings',

  'common.add': 'Add',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.remove': 'Remove',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.optional': 'optional',
  'common.unknownIngredient': '?',

  'servings.label': '{count} servings',
  'servings.decrease': 'Fewer servings',
  'servings.increase': 'More servings',

  'pantry.title': 'Pantry',
  'pantry.searchPlaceholder': 'Search or add an ingredient…',
  'pantry.emptyTitle': 'Your pantry is empty',
  'pantry.emptyBody': 'Search above to add what you have at home, or start with the common staples.',
  'pantry.addStaples': 'Add common staples',
  'pantry.staplesAdded': 'Added {count} staples',
  'pantry.inPantry': 'In pantry',
  'pantry.quantity': 'Quantity',
  'pantry.quantityPlaceholder': 'e.g. 2, 300 g',
  'pantry.expiresOn': 'Best before',
  'pantry.location': 'Location',
  'pantry.locationNone': 'Not set',
  'pantry.editItem': 'Edit item',
  'pantry.expired': 'Expired',
  'pantry.expiresToday': 'Expires today',
  'pantry.expiresIn': 'Expires in {days} d',
  'pantry.itemCount': '{count} items',

  'location.fridge': 'Fridge',
  'location.freezer': 'Freezer',
  'location.pantry': 'Pantry',

  'ingredient.createNew': 'Create "{name}"',
  'ingredient.newTitle': 'New ingredient',
  'ingredient.nameJa': 'Name (Japanese)',
  'ingredient.nameEn': 'Name (English)',
  'ingredient.category': 'Category',
  'ingredient.nameRequired': 'Enter a name in at least one language.',
  'ingredient.noResults': 'No matching ingredients',

  'category.vegetable': 'Vegetables',
  'category.fruit': 'Fruit',
  'category.mushroom': 'Mushrooms',
  'category.meat': 'Meat',
  'category.seafood': 'Seafood',
  'category.egg_dairy': 'Eggs & dairy',
  'category.tofu_soy': 'Tofu & soy',
  'category.grain_noodle_bread': 'Grains, noodles & bread',
  'category.seasoning': 'Seasonings',
  'category.oil_fat': 'Oils & fats',
  'category.canned_dry': 'Canned & dry goods',
  'category.frozen': 'Frozen',
  'category.other': 'Other',

  'suggestions.title': 'What can I cook?',
  'suggestions.ready': 'Ready to cook',
  'suggestions.almost': 'Almost there',
  'suggestions.buyToUnlock': 'Buy this, unlock that',
  'suggestions.readyEmpty': 'Nothing is fully covered yet. Add more to your pantry or check the lists below.',
  'suggestions.almostEmpty': 'No recipes are within reach with a small purchase.',
  'suggestions.buyEmpty': 'Nothing to suggest yet.',
  'suggestions.missingCount': 'Missing {count}',
  'suggestions.unlocks': 'Unlocks {count}',
  'suggestions.helps': 'Helps {count}',
  'suggestions.addToShopping': 'Add to shopping list',
  'suggestions.addedToShopping': 'Added to shopping list',
  'suggestions.usesExpiring': 'Uses expiring items',
  'suggestions.filterAll': 'All',

  'cuisine.japanese': 'Japanese',
  'cuisine.western': 'Western',
  'cuisine.chinese': 'Chinese',
  'cuisine.other': 'Other',

  'recipeCategory.main': 'Main',
  'recipeCategory.side': 'Side',
  'recipeCategory.soup': 'Soup',
  'recipeCategory.rice': 'Rice',
  'recipeCategory.noodle': 'Noodles',
  'recipeCategory.salad': 'Salad',
  'recipeCategory.dessert': 'Dessert',

  'recipes.title': 'Recipes',
  'recipes.searchPlaceholder': 'Search recipes…',
  'recipes.new': 'New recipe',
  'recipes.custom': 'Custom',
  'recipes.empty': 'No recipes match.',
  'recipes.minutes': '{count} min',

  'recipe.ingredients': 'Ingredients',
  'recipe.steps': 'Steps',
  'recipe.toTaste': 'to taste',
  'recipe.have': 'Have',
  'recipe.missing': 'Missing',
  'recipe.addMissingToShopping': 'Add missing to shopping list',
  'recipe.duplicate': 'Duplicate & edit',
  'recipe.deleteConfirmTitle': 'Delete this recipe?',
  'recipe.deleteConfirmBody': 'This cannot be undone.',
  'recipe.notFound': 'Recipe not found.',

  'recipeForm.newTitle': 'New recipe',
  'recipeForm.editTitle': 'Edit recipe',
  'recipeForm.nameJa': 'Name (Japanese)',
  'recipeForm.nameEn': 'Name (English)',
  'recipeForm.descriptionJa': 'Description (Japanese)',
  'recipeForm.descriptionEn': 'Description (English)',
  'recipeForm.cuisine': 'Cuisine',
  'recipeForm.category': 'Category',
  'recipeForm.baseServings': 'Servings the amounts are for',
  'recipeForm.timeMinutes': 'Time (minutes)',
  'recipeForm.ingredients': 'Ingredients',
  'recipeForm.addIngredientPlaceholder': 'Search an ingredient to add…',
  'recipeForm.amount': 'Amount',
  'recipeForm.unit': 'Unit',
  'recipeForm.noUnit': '—',
  'recipeForm.optional': 'Optional',
  'recipeForm.stepsJa': 'Steps (Japanese, one per line)',
  'recipeForm.stepsEn': 'Steps (English, one per line)',
  'recipeForm.errorName': 'Enter a name in at least one language.',
  'recipeForm.errorIngredients': 'Add at least one ingredient.',
  'recipeForm.errorSteps': 'Enter at least one step in either language.',
  'recipeForm.errorServings': 'Servings must be 1 or more.',

  'unit.g': 'g',
  'unit.kg': 'kg',
  'unit.ml': 'ml',
  'unit.l': 'L',
  'unit.pcs': 'pcs',
  'unit.tbsp': 'tbsp',
  'unit.tsp': 'tsp',
  'unit.cup': 'cup',
  'unit.clove': 'clove',
  'unit.slice': 'slice',
  'unit.bunch': 'bunch',
  'unit.sheet': 'sheet',
  'unit.can': 'can',
  'unit.pack': 'pack',
  'unit.stalk': 'stalk',
  'unit.pinch': 'pinch',

  'shopping.title': 'Shopping list',
  'shopping.empty': 'Your shopping list is empty.',
  'shopping.searchPlaceholder': 'Add an ingredient to buy…',
  'shopping.markBought': 'Mark as bought',
  'shopping.bought': 'Moved to pantry',

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.servings': 'Servings',
  'settings.almostThreshold': '"Almost there" threshold',
  'settings.almostThresholdHint': 'Show recipes missing up to this many ingredients.',
  'settings.data': 'Data',
  'settings.export': 'Export JSON',
  'settings.import': 'Import JSON',
  'settings.importConfirmTitle': 'Replace all data?',
  'settings.importConfirmBody': 'Your current pantry, recipes and shopping list will be replaced by the imported file.',
  'settings.importSuccess': 'Data imported',
  'settings.importError': 'Could not import this file.',
  'settings.reset': 'Reset all data',
  'settings.resetConfirmTitle': 'Reset all data?',
  'settings.resetConfirmBody': 'Everything you added will be removed. Preset recipes stay.',
  'settings.about': 'About',
  'settings.version': 'Version {version}',
  'settings.storageWarning': 'Storage is unavailable. Your data will not be saved when you close this tab.',

  'lang.ja': '日本語',
  'lang.en': 'English',
} as const;

export type TranslationKey = keyof typeof en;
```

- [ ] **Step 3: Write the Japanese dictionary**

`src/i18n/ja.ts` — same keys, Japanese values:
```ts
import type { TranslationKey } from './en';

export const ja: Record<TranslationKey, string> = {
  'app.name': '食材マネージャー',
  'nav.pantry': '在庫',
  'nav.suggestions': '作れる料理',
  'nav.recipes': 'レシピ',
  'nav.shopping': '買い物',
  'nav.settings': '設定',

  'common.add': '追加',
  'common.cancel': 'キャンセル',
  'common.save': '保存',
  'common.delete': '削除',
  'common.edit': '編集',
  'common.remove': '取り消す',
  'common.close': '閉じる',
  'common.confirm': '確認',
  'common.back': '戻る',
  'common.optional': '任意',
  'common.unknownIngredient': '?',

  'servings.label': '{count}人分',
  'servings.decrease': '人数を減らす',
  'servings.increase': '人数を増やす',

  'pantry.title': '在庫',
  'pantry.searchPlaceholder': '食材を検索・追加…',
  'pantry.emptyTitle': '在庫はまだありません',
  'pantry.emptyBody': '上の検索から家にある食材を追加するか、基本調味料をまとめて追加しましょう。',
  'pantry.addStaples': '基本調味料をまとめて追加',
  'pantry.staplesAdded': '{count}品を追加しました',
  'pantry.inPantry': '在庫あり',
  'pantry.quantity': '数量',
  'pantry.quantityPlaceholder': '例: 2個、300g',
  'pantry.expiresOn': '賞味期限',
  'pantry.location': '保管場所',
  'pantry.locationNone': '未設定',
  'pantry.editItem': '在庫を編集',
  'pantry.expired': '期限切れ',
  'pantry.expiresToday': '今日まで',
  'pantry.expiresIn': 'あと{days}日',
  'pantry.itemCount': '{count}品',

  'location.fridge': '冷蔵',
  'location.freezer': '冷凍',
  'location.pantry': '常温',

  'ingredient.createNew': '「{name}」を新規登録',
  'ingredient.newTitle': '新しい食材',
  'ingredient.nameJa': '名前（日本語）',
  'ingredient.nameEn': '名前（英語）',
  'ingredient.category': 'カテゴリ',
  'ingredient.nameRequired': 'どちらかの言語で名前を入力してください。',
  'ingredient.noResults': '該当する食材がありません',

  'category.vegetable': '野菜',
  'category.fruit': '果物',
  'category.mushroom': 'きのこ',
  'category.meat': '肉',
  'category.seafood': '魚介',
  'category.egg_dairy': '卵・乳製品',
  'category.tofu_soy': '豆腐・大豆製品',
  'category.grain_noodle_bread': '米・麺・パン・粉',
  'category.seasoning': '調味料',
  'category.oil_fat': '油',
  'category.canned_dry': '缶詰・乾物',
  'category.frozen': '冷凍食品',
  'category.other': 'その他',

  'suggestions.title': '今なに作れる？',
  'suggestions.ready': '今すぐ作れる',
  'suggestions.almost': 'あと少しで作れる',
  'suggestions.buyToUnlock': 'これを買えば作れる',
  'suggestions.readyEmpty': '材料がそろっている料理はまだありません。在庫を追加するか、下のリストを見てみましょう。',
  'suggestions.almostEmpty': '少しの買い足しで作れる料理はありません。',
  'suggestions.buyEmpty': 'まだ提案できるものがありません。',
  'suggestions.missingCount': '不足 {count}品',
  'suggestions.unlocks': '{count}品が作れる',
  'suggestions.helps': '{count}品に近づく',
  'suggestions.addToShopping': '買い物リストに追加',
  'suggestions.addedToShopping': '買い物リストに追加しました',
  'suggestions.usesExpiring': '期限が近い食材を使う',
  'suggestions.filterAll': 'すべて',

  'cuisine.japanese': '和食',
  'cuisine.western': '洋食',
  'cuisine.chinese': '中華',
  'cuisine.other': 'その他',

  'recipeCategory.main': '主菜',
  'recipeCategory.side': '副菜',
  'recipeCategory.soup': '汁物',
  'recipeCategory.rice': 'ご飯もの',
  'recipeCategory.noodle': '麺',
  'recipeCategory.salad': 'サラダ',
  'recipeCategory.dessert': 'デザート',

  'recipes.title': 'レシピ',
  'recipes.searchPlaceholder': 'レシピを検索…',
  'recipes.new': 'レシピを追加',
  'recipes.custom': 'マイレシピ',
  'recipes.empty': '該当するレシピがありません。',
  'recipes.minutes': '{count}分',

  'recipe.ingredients': '材料',
  'recipe.steps': '作り方',
  'recipe.toTaste': '適量',
  'recipe.have': 'あり',
  'recipe.missing': 'なし',
  'recipe.addMissingToShopping': '足りない材料を買い物リストへ',
  'recipe.duplicate': '複製して編集',
  'recipe.deleteConfirmTitle': 'このレシピを削除しますか？',
  'recipe.deleteConfirmBody': 'この操作は取り消せません。',
  'recipe.notFound': 'レシピが見つかりません。',

  'recipeForm.newTitle': 'レシピを追加',
  'recipeForm.editTitle': 'レシピを編集',
  'recipeForm.nameJa': '料理名（日本語）',
  'recipeForm.nameEn': '料理名（英語）',
  'recipeForm.descriptionJa': '説明（日本語）',
  'recipeForm.descriptionEn': '説明（英語）',
  'recipeForm.cuisine': 'ジャンル',
  'recipeForm.category': '分類',
  'recipeForm.baseServings': '分量の基準人数',
  'recipeForm.timeMinutes': '調理時間（分）',
  'recipeForm.ingredients': '材料',
  'recipeForm.addIngredientPlaceholder': '追加する食材を検索…',
  'recipeForm.amount': '分量',
  'recipeForm.unit': '単位',
  'recipeForm.noUnit': '—',
  'recipeForm.optional': 'なくても可',
  'recipeForm.stepsJa': '作り方（日本語、1行1手順）',
  'recipeForm.stepsEn': '作り方（英語、1行1手順）',
  'recipeForm.errorName': 'どちらかの言語で料理名を入力してください。',
  'recipeForm.errorIngredients': '材料を1つ以上追加してください。',
  'recipeForm.errorSteps': 'どちらかの言語で手順を1つ以上入力してください。',
  'recipeForm.errorServings': '人数は1以上にしてください。',

  'unit.g': 'g',
  'unit.kg': 'kg',
  'unit.ml': 'ml',
  'unit.l': 'L',
  'unit.pcs': '個',
  'unit.tbsp': '大さじ',
  'unit.tsp': '小さじ',
  'unit.cup': 'カップ',
  'unit.clove': '片',
  'unit.slice': '枚',
  'unit.bunch': '束',
  'unit.sheet': '枚',
  'unit.can': '缶',
  'unit.pack': 'パック',
  'unit.stalk': '本',
  'unit.pinch': 'つまみ',

  'shopping.title': '買い物リスト',
  'shopping.empty': '買い物リストは空です。',
  'shopping.searchPlaceholder': '買う食材を追加…',
  'shopping.markBought': '購入済みにする',
  'shopping.bought': '在庫に移動しました',

  'settings.title': '設定',
  'settings.language': '言語',
  'settings.servings': '人数',
  'settings.almostThreshold': '「あと少し」の基準',
  'settings.almostThresholdHint': '不足がこの品数までのレシピを「あと少し」に表示します。',
  'settings.data': 'データ',
  'settings.export': 'JSONをエクスポート',
  'settings.import': 'JSONをインポート',
  'settings.importConfirmTitle': 'すべてのデータを置き換えますか？',
  'settings.importConfirmBody': '現在の在庫・レシピ・買い物リストは、読み込んだファイルの内容に置き換わります。',
  'settings.importSuccess': 'データを読み込みました',
  'settings.importError': 'このファイルは読み込めませんでした。',
  'settings.reset': 'すべてのデータを初期化',
  'settings.resetConfirmTitle': 'すべてのデータを初期化しますか？',
  'settings.resetConfirmBody': '追加した内容はすべて削除されます。プリセットのレシピは残ります。',
  'settings.about': 'このアプリについて',
  'settings.version': 'バージョン {version}',
  'settings.storageWarning': 'ストレージが使えません。このタブを閉じるとデータは保存されません。',

  'lang.ja': '日本語',
  'lang.en': 'English',
};
```

- [ ] **Step 4: Write translate**

`src/i18n/translate.ts`:
```ts
import type { Lang } from '../domain/types';
import { en, type TranslationKey } from './en';
import { ja } from './ja';

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, ja };

export type TranslateParams = Record<string, string | number>;
export type TFunction = (key: TranslationKey, params?: TranslateParams) => string;

export function translate(lang: Lang, key: TranslationKey, params?: TranslateParams): string {
  const template = dictionaries[lang][key] ?? en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
```

- [ ] **Step 5: Run tests, commit**

Run: `npm test -- translate` — Expected: PASS.

```bash
git add src/i18n
git commit -m "feat(i18n): add English and Japanese dictionaries with pure translate"
```

---

### Task 4: Servings scaling and amount formatting

**Files:**
- Create: `src/domain/scaling.ts`
- Test: `src/domain/scaling.test.ts`

**Interfaces:**
- Consumes: `TranslationKey` from `src/i18n/en.ts`, `translate` (tests only), `localize`.
- Produces: `scaleAmount(amount, baseServings, targetServings): number`, `formatNumber(n): string`, `formatQuantity(amount, unit, lang, t): string`, `formatIngredientAmount(ri, baseServings, servings, lang, t): string`.

- [ ] **Step 1: Write failing test**

`src/domain/scaling.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { translate } from '../i18n/translate';
import { formatIngredientAmount, formatQuantity, scaleAmount } from './scaling';
import type { TranslationKey } from '../i18n/en';

const tEn = (key: TranslationKey) => translate('en', key);
const tJa = (key: TranslationKey) => translate('ja', key);

describe('scaleAmount', () => {
  it('scales linearly and rounds to one decimal', () => {
    expect(scaleAmount(300, 2, 3)).toBe(450);
    expect(scaleAmount(1, 2, 3)).toBe(1.5);
    expect(scaleAmount(100, 3, 2)).toBe(66.7);
    expect(scaleAmount(2, 2, 2)).toBe(2);
  });
  it('returns the amount unchanged when base servings is invalid', () => {
    expect(scaleAmount(5, 0, 4)).toBe(5);
  });
});

describe('formatQuantity', () => {
  it('formats English with a space', () => {
    expect(formatQuantity(2, 'tbsp', 'en', tEn)).toBe('2 tbsp');
    expect(formatQuantity(200, 'g', 'en', tEn)).toBe('200 g');
    expect(formatQuantity(1.5, 'pcs', 'en', tEn)).toBe('1.5 pcs');
  });
  it('prefixes spoon and cup units in Japanese and suffixes the rest', () => {
    expect(formatQuantity(2, 'tbsp', 'ja', tJa)).toBe('大さじ2');
    expect(formatQuantity(1, 'tsp', 'ja', tJa)).toBe('小さじ1');
    expect(formatQuantity(1.5, 'cup', 'ja', tJa)).toBe('カップ1.5');
    expect(formatQuantity(200, 'g', 'ja', tJa)).toBe('200g');
    expect(formatQuantity(2, 'pcs', 'ja', tJa)).toBe('2個');
  });
  it('prints a bare number without unit', () => {
    expect(formatQuantity(3, undefined, 'en', tEn)).toBe('3');
  });
});

describe('formatIngredientAmount', () => {
  it('scales and formats', () => {
    expect(formatIngredientAmount({ ingredientId: 'x', amount: 300, unit: 'g' }, 2, 4, 'en', tEn)).toBe('600 g');
  });
  it('uses the note or "to taste" when no amount is given', () => {
    expect(formatIngredientAmount({ ingredientId: 'x' }, 2, 2, 'en', tEn)).toBe('to taste');
    expect(formatIngredientAmount({ ingredientId: 'x' }, 2, 2, 'ja', tJa)).toBe('適量');
    expect(formatIngredientAmount({ ingredientId: 'x', note: { ja: '少々', en: 'a little' } }, 2, 2, 'ja', tJa)).toBe('少々');
  });
});
```

Run: `npm test -- scaling` — Expected: FAIL.

- [ ] **Step 2: Implement**

`src/domain/scaling.ts`:
```ts
import type { TranslationKey } from '../i18n/en';
import { localize } from './localize';
import type { Lang, RecipeIngredient, Unit } from './types';

type UnitTranslator = (key: TranslationKey) => string;

const JA_PREFIX_UNITS: ReadonlySet<Unit> = new Set<Unit>(['tbsp', 'tsp', 'cup']);

export function scaleAmount(amount: number, baseServings: number, targetServings: number): number {
  if (baseServings <= 0) return amount;
  return Math.round((amount * targetServings / baseServings) * 10) / 10;
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatQuantity(amount: number, unit: Unit | undefined, lang: Lang, t: UnitTranslator): string {
  const n = formatNumber(amount);
  if (!unit) return n;
  const label = t(`unit.${unit}`);
  if (lang === 'ja') return JA_PREFIX_UNITS.has(unit) ? `${label}${n}` : `${n}${label}`;
  return `${n} ${label}`;
}

export function formatIngredientAmount(
  ri: RecipeIngredient,
  baseServings: number,
  servings: number,
  lang: Lang,
  t: UnitTranslator,
): string {
  if (ri.amount === undefined) return localize(ri.note, lang) || t('recipe.toTaste');
  return formatQuantity(scaleAmount(ri.amount, baseServings, servings), ri.unit, lang, t);
}
```

- [ ] **Step 3: Run tests, commit**

Run: `npm test -- scaling` — Expected: PASS.

```bash
git add src/domain/scaling.ts src/domain/scaling.test.ts
git commit -m "feat(domain): add servings scaling and localized amount formatting"
```

---

### Task 5: Ingredient search

**Files:**
- Create: `src/domain/search.ts`
- Test: `src/domain/search.test.ts`

**Interfaces:**
- Produces: `normalizeForSearch(text): string`, `searchIngredients(all, query, limit?): Ingredient[]`, `hasExactMatch(all, query): boolean`.

- [ ] **Step 1: Write failing test**

`src/domain/search.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { hasExactMatch, normalizeForSearch, searchIngredients } from './search';
import type { Ingredient } from './types';

const ing = (id: string, ja: string, en: string, aliases?: string[]): Ingredient => ({
  id, name: { ja, en }, category: 'vegetable', aliases, isPreset: true,
});

const catalog = [
  ing('onion', '玉ねぎ', 'Onion', ['たまねぎ']),
  ing('green-onion', '長ねぎ', 'Green onion (negi)', ['ねぎ']),
  ing('carrot', 'にんじん', 'Carrot', ['人参']),
  ing('tomato', 'トマト', 'Tomato'),
];

describe('normalizeForSearch', () => {
  it('lowercases, trims, converts full-width and katakana to hiragana', () => {
    expect(normalizeForSearch('  Onion ')).toBe('onion');
    expect(normalizeForSearch('トマト')).toBe('とまと');
    expect(normalizeForSearch('ＴＯＭＡＴＯ')).toBe('tomato');
  });
});

describe('searchIngredients', () => {
  it('returns nothing for an empty query', () => {
    expect(searchIngredients(catalog, '   ')).toEqual([]);
  });
  it('matches English, Japanese and aliases case-insensitively', () => {
    expect(searchIngredients(catalog, 'CARR').map((i) => i.id)).toEqual(['carrot']);
    expect(searchIngredients(catalog, '人参').map((i) => i.id)).toEqual(['carrot']);
    expect(searchIngredients(catalog, 'たまねぎ').map((i) => i.id)).toEqual(['onion']);
  });
  it('treats katakana and hiragana as equivalent', () => {
    expect(searchIngredients(catalog, 'とまと').map((i) => i.id)).toEqual(['tomato']);
  });
  it('ranks exact, then prefix, then substring matches', () => {
    expect(searchIngredients(catalog, 'onion').map((i) => i.id)).toEqual(['onion', 'green-onion']);
    expect(searchIngredients(catalog, 'ねぎ').map((i) => i.id)).toEqual(['green-onion', 'onion']);
  });
  it('respects the limit', () => {
    expect(searchIngredients(catalog, 'n', 2)).toHaveLength(2);
  });
});

describe('hasExactMatch', () => {
  it('detects an exact name or alias match', () => {
    expect(hasExactMatch(catalog, 'onion')).toBe(true);
    expect(hasExactMatch(catalog, 'Onions')).toBe(false);
    expect(hasExactMatch(catalog, '')).toBe(false);
  });
});
```

Run: `npm test -- search` — Expected: FAIL.

- [ ] **Step 2: Implement**

`src/domain/search.ts`:
```ts
import type { Ingredient } from './types';

/** NFKC folds full-width forms; katakana (U+30A1–U+30F6) shifts to hiragana. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function searchTerms(ingredient: Ingredient): string[] {
  return [ingredient.name.ja, ingredient.name.en, ...(ingredient.aliases ?? [])]
    .filter((term): term is string => Boolean(term))
    .map(normalizeForSearch);
}

export function searchIngredients(all: Ingredient[], query: string, limit = 20): Ingredient[] {
  const q = normalizeForSearch(query);
  if (!q) return [];
  const scored: Array<{ ingredient: Ingredient; score: number }> = [];
  for (const ingredient of all) {
    const terms = searchTerms(ingredient);
    if (terms.some((term) => term === q)) scored.push({ ingredient, score: 0 });
    else if (terms.some((term) => term.startsWith(q))) scored.push({ ingredient, score: 1 });
    else if (terms.some((term) => term.includes(q))) scored.push({ ingredient, score: 2 });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((entry) => entry.ingredient);
}

export function hasExactMatch(all: Ingredient[], query: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return false;
  return all.some((ingredient) => searchTerms(ingredient).includes(q));
}
```

- [ ] **Step 3: Run tests, commit**

Run: `npm test -- search` — Expected: PASS.

```bash
git add src/domain/search.ts src/domain/search.test.ts
git commit -m "feat(domain): add bilingual ingredient search"
```

---

### Task 6: Matching engine

**Files:**
- Create: `src/domain/matching.ts`
- Test: `src/domain/matching.test.ts`, `src/test/factories.ts`

**Interfaces:**
- Consumes: `expiryStatus` from `dates.ts`; types.
- Produces: `RecipeStatus`, `RecipeMatch`, `BuyToUnlock`, `SuggestionOptions`, `Suggestions`, `indexPantry(pantry)`, `evaluateRecipe(recipe, pantry, options)`, `buildSuggestions(recipes, pantry, options)`.
- Test factories: `makeIngredient(overrides?)`, `makeRecipe(overrides?)`, `makePantryItem(ingredientId, overrides?)`.

- [ ] **Step 1: Write factories**

`src/test/factories.ts`:
```ts
import type { Ingredient, PantryItem, Recipe } from '../domain/types';

let seq = 0;

export function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  seq += 1;
  return {
    id: `ing-${seq}`,
    name: { ja: `食材${seq}`, en: `Ingredient ${seq}` },
    category: 'vegetable',
    isPreset: true,
    ...overrides,
  };
}

export function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  seq += 1;
  return {
    id: `recipe-${seq}`,
    name: { ja: `レシピ${seq}`, en: `Recipe ${seq}` },
    cuisine: 'japanese',
    category: 'main',
    baseServings: 2,
    timeMinutes: 20,
    ingredients: [],
    steps: { ja: ['手順1'], en: ['Step 1'] },
    isPreset: true,
    ...overrides,
  };
}

export function makePantryItem(ingredientId: string, overrides: Partial<PantryItem> = {}): PantryItem {
  return { ingredientId, addedOn: '2026-09-18', ...overrides };
}
```

- [ ] **Step 2: Write failing test**

`src/domain/matching.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makePantryItem, makeRecipe } from '../test/factories';
import { buildSuggestions, evaluateRecipe } from './matching';

const options = { almostThreshold: 2, today: '2026-09-18' };
const req = (ingredientId: string) => ({ ingredientId });
const opt = (ingredientId: string) => ({ ingredientId, optional: true });

describe('evaluateRecipe', () => {
  it('is ready when every required ingredient is present', () => {
    const recipe = makeRecipe({ ingredients: [req('egg'), req('rice'), opt('nori')] });
    const match = evaluateRecipe(recipe, [makePantryItem('egg'), makePantryItem('rice')], options);
    expect(match.status).toBe('ready');
    expect(match.missingRequired).toEqual([]);
    expect(match.missingOptional).toEqual(['nori']);
  });
  it('is almost when missing up to the threshold', () => {
    const recipe = makeRecipe({ ingredients: [req('a'), req('b'), req('c')] });
    expect(evaluateRecipe(recipe, [makePantryItem('a')], options).status).toBe('almost');
    expect(evaluateRecipe(recipe, [makePantryItem('a')], { ...options, almostThreshold: 1 }).status).toBe('far');
  });
  it('is far when missing more than the threshold', () => {
    const recipe = makeRecipe({ ingredients: [req('a'), req('b'), req('c')] });
    const match = evaluateRecipe(recipe, [], options);
    expect(match.status).toBe('far');
    expect(match.missingRequired).toEqual(['a', 'b', 'c']);
  });
  it('lists pantry items expiring within 3 days that the recipe uses', () => {
    const recipe = makeRecipe({ ingredients: [req('milk'), req('egg'), req('flour')] });
    const pantry = [
      makePantryItem('milk', { expiresOn: '2026-09-19' }),
      makePantryItem('egg', { expiresOn: '2026-09-30' }),
      makePantryItem('flour'),
      makePantryItem('butter', { expiresOn: '2026-09-10' }),
    ];
    expect(evaluateRecipe(recipe, pantry, options).usesExpiring).toEqual(['milk']);
  });
});

describe('buildSuggestions', () => {
  it('partitions recipes and drops far ones', () => {
    const ready = makeRecipe({ id: 'ready', ingredients: [req('a')] });
    const almost = makeRecipe({ id: 'almost', ingredients: [req('a'), req('b')] });
    const far = makeRecipe({ id: 'far', ingredients: [req('x'), req('y'), req('z')] });
    const result = buildSuggestions([far, almost, ready], [makePantryItem('a')], options);
    expect(result.ready.map((m) => m.recipe.id)).toEqual(['ready']);
    expect(result.almost.map((m) => m.recipe.id)).toEqual(['almost']);
  });
  it('sorts ready recipes by expiring usage, then time, then name', () => {
    const slow = makeRecipe({ id: 'slow', name: { en: 'Slow', ja: 'S' }, timeMinutes: 60, ingredients: [req('a')] });
    const fast = makeRecipe({ id: 'fast', name: { en: 'Fast', ja: 'F' }, timeMinutes: 10, ingredients: [req('a')] });
    const usesExpiring = makeRecipe({ id: 'exp', name: { en: 'Zed', ja: 'Z' }, timeMinutes: 90, ingredients: [req('milk')] });
    const noTime = makeRecipe({ id: 'notime', name: { en: 'Alpha', ja: 'A' }, timeMinutes: undefined, ingredients: [req('a')] });
    const pantry = [makePantryItem('a'), makePantryItem('milk', { expiresOn: '2026-09-18' })];
    const result = buildSuggestions([slow, noTime, fast, usesExpiring], pantry, options);
    expect(result.ready.map((m) => m.recipe.id)).toEqual(['exp', 'fast', 'slow', 'notime']);
  });
  it('sorts almost recipes by fewest missing first', () => {
    const missOne = makeRecipe({ id: 'one', ingredients: [req('a'), req('b')] });
    const missTwo = makeRecipe({ id: 'two', ingredients: [req('a'), req('b'), req('c')] });
    const result = buildSuggestions([missTwo, missOne], [makePantryItem('a')], options);
    expect(result.almost.map((m) => m.recipe.id)).toEqual(['one', 'two']);
  });
  it('aggregates buy-to-unlock by ingredient with unlocks before helps', () => {
    const r1 = makeRecipe({ id: 'r1', ingredients: [req('a'), req('b')] });          // missing b only
    const r2 = makeRecipe({ id: 'r2', ingredients: [req('a'), req('b'), req('c')] }); // missing b, c
    const r3 = makeRecipe({ id: 'r3', ingredients: [req('a'), req('c')] });          // missing c only
    const r4 = makeRecipe({ id: 'r4', ingredients: [req('a'), req('c')] });          // missing c only
    const result = buildSuggestions([r1, r2, r3, r4], [makePantryItem('a')], options);
    expect(result.buyToUnlock.map((b) => b.ingredientId)).toEqual(['c', 'b']);
    const c = result.buyToUnlock[0];
    expect(c.unlocks.map((r) => r.id)).toEqual(['r3', 'r4']);
    expect(c.helps.map((r) => r.id)).toEqual(['r2']);
    const b = result.buyToUnlock[1];
    expect(b.unlocks.map((r) => r.id)).toEqual(['r1']);
    expect(b.helps.map((r) => r.id)).toEqual(['r2']);
  });
  it('never lists ingredients missing only from far recipes', () => {
    const far = makeRecipe({ ingredients: [req('x'), req('y'), req('z')] });
    expect(buildSuggestions([far], [], options).buyToUnlock).toEqual([]);
  });
});
```

Run: `npm test -- matching` — Expected: FAIL.

- [ ] **Step 3: Implement**

`src/domain/matching.ts`:
```ts
import { expiryStatus } from './dates';
import type { PantryItem, Recipe } from './types';

export type RecipeStatus = 'ready' | 'almost' | 'far';

export interface RecipeMatch {
  recipe: Recipe;
  status: RecipeStatus;
  missingRequired: string[];
  missingOptional: string[];
  usesExpiring: string[];
}

export interface BuyToUnlock {
  ingredientId: string;
  unlocks: Recipe[];
  helps: Recipe[];
}

export interface SuggestionOptions {
  almostThreshold: number;
  today: string;
}

export interface Suggestions {
  ready: RecipeMatch[];
  almost: RecipeMatch[];
  buyToUnlock: BuyToUnlock[];
}

export function indexPantry(pantry: PantryItem[]): Map<string, PantryItem> {
  return new Map(pantry.map((item) => [item.ingredientId, item]));
}

export function evaluateRecipe(
  recipe: Recipe,
  pantry: PantryItem[] | Map<string, PantryItem>,
  options: SuggestionOptions,
): RecipeMatch {
  const index = pantry instanceof Map ? pantry : indexPantry(pantry);
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const usesExpiring: string[] = [];
  for (const ri of recipe.ingredients) {
    const item = index.get(ri.ingredientId);
    if (!item) {
      (ri.optional ? missingOptional : missingRequired).push(ri.ingredientId);
      continue;
    }
    if (expiryStatus(item.expiresOn, options.today) !== 'ok') usesExpiring.push(ri.ingredientId);
  }
  const status: RecipeStatus =
    missingRequired.length === 0 ? 'ready'
      : missingRequired.length <= options.almostThreshold ? 'almost'
        : 'far';
  return { recipe, status, missingRequired, missingOptional, usesExpiring };
}

function nameKey(recipe: Recipe): string {
  return (recipe.name.en ?? recipe.name.ja ?? '').toLowerCase();
}

function compareReady(a: RecipeMatch, b: RecipeMatch): number {
  return (
    b.usesExpiring.length - a.usesExpiring.length ||
    (a.recipe.timeMinutes ?? Infinity) - (b.recipe.timeMinutes ?? Infinity) ||
    nameKey(a.recipe).localeCompare(nameKey(b.recipe))
  );
}

function compareAlmost(a: RecipeMatch, b: RecipeMatch): number {
  return (
    a.missingRequired.length - b.missingRequired.length ||
    b.usesExpiring.length - a.usesExpiring.length ||
    nameKey(a.recipe).localeCompare(nameKey(b.recipe))
  );
}

export function buildSuggestions(recipes: Recipe[], pantry: PantryItem[], options: SuggestionOptions): Suggestions {
  const index = indexPantry(pantry);
  const ready: RecipeMatch[] = [];
  const almost: RecipeMatch[] = [];
  for (const recipe of recipes) {
    const match = evaluateRecipe(recipe, index, options);
    if (match.status === 'ready') ready.push(match);
    else if (match.status === 'almost') almost.push(match);
  }
  ready.sort(compareReady);
  almost.sort(compareAlmost);

  const byIngredient = new Map<string, BuyToUnlock>();
  for (const match of almost) {
    for (const ingredientId of match.missingRequired) {
      const entry = byIngredient.get(ingredientId) ?? { ingredientId, unlocks: [], helps: [] };
      (match.missingRequired.length === 1 ? entry.unlocks : entry.helps).push(match.recipe);
      byIngredient.set(ingredientId, entry);
    }
  }
  const buyToUnlock = [...byIngredient.values()].sort(
    (a, b) =>
      b.unlocks.length - a.unlocks.length ||
      b.helps.length - a.helps.length ||
      a.ingredientId.localeCompare(b.ingredientId),
  );
  return { ready, almost, buyToUnlock };
}
```

Note on `compareReady`: `Infinity - Infinity` is `NaN`, which is falsy, so two recipes without a time fall through to the name comparison.

- [ ] **Step 4: Run tests, commit**

Run: `npm test -- matching` — Expected: PASS.

```bash
git add src/domain/matching.ts src/domain/matching.test.ts src/test/factories.ts
git commit -m "feat(domain): add recipe matching and buy-to-unlock suggestions"
```

---

### Task 7: Preset ingredient catalog and staples

**Files:**
- Create: `src/data/ingredients.ts`, `src/data/staples.ts`
- Test: `src/data/ingredients.test.ts`

**Interfaces:**
- Produces: `PRESET_INGREDIENTS: Ingredient[]` (164 entries), `PRESET_INGREDIENT_IDS: Set<string>`, `COMMON_STAPLE_IDS: readonly string[]`.

- [ ] **Step 1: Write failing test**

`src/data/ingredients.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { INGREDIENT_CATEGORIES } from '../domain/types';
import { PRESET_INGREDIENTS } from './ingredients';
import { COMMON_STAPLE_IDS } from './staples';

describe('preset ingredients', () => {
  it('has unique kebab-case ids', () => {
    const ids = PRESET_INGREDIENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('has both names, a valid category and isPreset', () => {
    for (const ing of PRESET_INGREDIENTS) {
      expect(ing.name.ja, ing.id).toBeTruthy();
      expect(ing.name.en, ing.id).toBeTruthy();
      expect(INGREDIENT_CATEGORIES).toContain(ing.category);
      expect(ing.isPreset).toBe(true);
    }
  });
  it('has at least 150 entries and covers every category', () => {
    expect(PRESET_INGREDIENTS.length).toBeGreaterThanOrEqual(150);
    const used = new Set(PRESET_INGREDIENTS.map((i) => i.category));
    for (const category of INGREDIENT_CATEGORIES) expect(used.has(category), category).toBe(true);
  });
  it('staples reference existing ingredients and are unique', () => {
    const ids = new Set(PRESET_INGREDIENTS.map((i) => i.id));
    expect(new Set(COMMON_STAPLE_IDS).size).toBe(COMMON_STAPLE_IDS.length);
    for (const id of COMMON_STAPLE_IDS) expect(ids.has(id), id).toBe(true);
  });
});
```

Run: `npm test -- ingredients` — Expected: FAIL.

- [ ] **Step 2: Write the catalog**

`src/data/ingredients.ts` uses a compact helper and lists every row from the table below (id · JA · EN · category · aliases):

```ts
import type { Ingredient, IngredientCategory } from '../domain/types';

function preset(id: string, ja: string, en: string, category: IngredientCategory, aliases?: string[]): Ingredient {
  return { id, name: { ja, en }, category, isPreset: true, ...(aliases ? { aliases } : {}) };
}

export const PRESET_INGREDIENTS: Ingredient[] = [
  // vegetable
  preset('onion', '玉ねぎ', 'Onion', 'vegetable', ['たまねぎ']),
  // ... every row from the table
];

export const PRESET_INGREDIENT_IDS: ReadonlySet<string> = new Set(PRESET_INGREDIENTS.map((i) => i.id));
```

Catalog rows (write each as a `preset(...)` call):

**vegetable (37):** onion 玉ねぎ Onion [たまねぎ] · green-onion 長ねぎ Green onion (negi) [ねぎ, 白ねぎ] · scallion 小ねぎ Scallion [万能ねぎ, あさつき] · carrot にんじん Carrot [人参] · potato じゃがいも Potato [ジャガイモ] · sweet-potato さつまいも Sweet potato · cabbage キャベツ Cabbage · napa-cabbage 白菜 Napa cabbage [はくさい] · lettuce レタス Lettuce · spinach ほうれん草 Spinach [ほうれんそう] · komatsuna 小松菜 Komatsuna [こまつな] · bok-choy チンゲン菜 Bok choy [青梗菜] · tomato トマト Tomato · cherry-tomato ミニトマト Cherry tomato [プチトマト] · cucumber きゅうり Cucumber [胡瓜] · eggplant なす Eggplant [茄子] · bell-pepper ピーマン Green bell pepper · paprika パプリカ Paprika (sweet pepper) · zucchini ズッキーニ Zucchini · broccoli ブロッコリー Broccoli · daikon 大根 Daikon radish [だいこん] · turnip かぶ Turnip · burdock ごぼう Burdock root [牛蒡] · lotus-root れんこん Lotus root [蓮根] · bean-sprouts もやし Bean sprouts · garlic にんにく Garlic [ニンニク] · ginger しょうが Ginger [生姜] · bamboo-shoot たけのこ Bamboo shoot [筍] · green-beans いんげん Green beans [さやいんげん] · asparagus アスパラガス Asparagus · pumpkin かぼちゃ Kabocha squash [南瓜] · okra オクラ Okra · celery セロリ Celery · avocado アボカド Avocado · garlic-chives ニラ Garlic chives (nira) [にら] · shiso 大葉 Shiso leaves [しそ] · corn とうもろこし Sweet corn

**fruit (8):** apple りんご Apple [林檎] · banana バナナ Banana · lemon レモン Lemon · mandarin みかん Mandarin orange · strawberry いちご Strawberry · kiwi キウイ Kiwi · grape ぶどう Grapes · peach 桃 Peach [もも]

**mushroom (6):** shiitake しいたけ Shiitake [椎茸] · shimeji しめじ Shimeji · enoki えのき Enoki · maitake まいたけ Maitake · eringi エリンギ King oyster mushroom · button-mushroom マッシュルーム Button mushroom

**meat (14):** chicken-thigh 鶏もも肉 Chicken thigh · chicken-breast 鶏むね肉 Chicken breast · chicken-wings 手羽先 Chicken wings · ground-chicken 鶏ひき肉 Ground chicken · pork-belly 豚バラ肉 Pork belly (thin-sliced) · pork-loin 豚ロース肉 Pork loin · pork-thin-sliced 豚こま切れ肉 Pork offcuts (thin-sliced) · ground-pork 豚ひき肉 Ground pork · beef-thin-sliced 牛薄切り肉 Thin-sliced beef · ground-beef 牛ひき肉 Ground beef · ground-meat-mix 合いびき肉 Ground beef and pork mix · bacon ベーコン Bacon · ham ハム Ham · sausage ウインナー Sausages [ソーセージ]

**seafood (10):** salmon 鮭 Salmon [さけ, サーモン] · mackerel さば Mackerel [鯖] · cod たら Cod [鱈] · yellowtail ぶり Yellowtail [鰤] · saury さんま Pacific saury · shrimp えび Shrimp [海老, エビ] · squid いか Squid [イカ] · clams あさり Clams · scallop ほたて Scallops · mentaiko 明太子 Spicy cod roe (mentaiko) [たらこ]

**egg_dairy (9):** egg 卵 Egg [たまご, 玉子] · milk 牛乳 Milk · butter バター Butter · shredded-cheese ピザ用チーズ Shredded cheese [とろけるチーズ] · sliced-cheese スライスチーズ Sliced cheese · parmesan 粉チーズ Grated parmesan [パルメザン] · cream-cheese クリームチーズ Cream cheese · yogurt ヨーグルト Yogurt · heavy-cream 生クリーム Heavy cream

**tofu_soy (5):** tofu 豆腐 Tofu [とうふ] · atsuage 厚揚げ Thick fried tofu (atsuage) · aburaage 油揚げ Fried tofu sheet (aburaage) · natto 納豆 Natto · soy-milk 豆乳 Soy milk

**grain_noodle_bread (15):** rice 米 Rice [ご飯, ごはん] · udon うどん Udon noodles · soba そば Soba noodles [蕎麦] · somen そうめん Somen noodles · ramen-noodles 中華麺 Chinese wheat noodles · yakisoba-noodles 焼きそば麺 Yakisoba noodles · spaghetti スパゲッティ Spaghetti [パスタ] · macaroni マカロニ Macaroni · bread 食パン Sliced bread [パン] · flour 薄力粉 Flour (all-purpose) [小麦粉] · bread-crumbs パン粉 Panko bread crumbs · potato-starch 片栗粉 Potato starch [かたくり粉] · mochi 餅 Mochi rice cake · gyoza-wrappers 餃子の皮 Gyoza wrappers · baking-powder ベーキングパウダー Baking powder

**seasoning (35):** soy-sauce しょうゆ Soy sauce [醤油] · salt 塩 Salt · sugar 砂糖 Sugar · miso 味噌 Miso [みそ] · mirin みりん Mirin · sake 料理酒 Cooking sake [酒] · rice-vinegar 酢 Rice vinegar [米酢] · black-pepper こしょう Black pepper [胡椒] · dashi-granules 顆粒だし Dashi granules [だしの素, ほんだし] · mentsuyu めんつゆ Mentsuyu (noodle soup base) · ponzu ポン酢 Ponzu · ketchup ケチャップ Ketchup · mayonnaise マヨネーズ Mayonnaise · worcestershire ウスターソース Worcestershire sauce · tonkatsu-sauce 中濃ソース Tonkatsu sauce (chuno) · oyster-sauce オイスターソース Oyster sauce · sesame-seeds いりごま Toasted sesame seeds [ごま, 白ごま] · sesame-paste 練りごま Sesame paste · doubanjiang 豆板醤 Doubanjiang (chili bean paste) · tianmianjiang 甜麺醤 Tianmianjiang (sweet bean paste) · chicken-stock-powder 鶏ガラスープの素 Chicken stock powder · consomme コンソメ Consommé bouillon [ブイヨン] · curry-roux カレールー Curry roux · curry-powder カレー粉 Curry powder · honey はちみつ Honey [蜂蜜] · karashi 練り辛子 Japanese mustard (karashi) · chili-pepper 鷹の爪 Dried red chili [唐辛子] · shichimi 七味唐辛子 Shichimi pepper · gochujang コチュジャン Gochujang · yakiniku-sauce 焼肉のたれ Yakiniku sauce · dried-herbs 乾燥ハーブ Dried herbs (oregano, basil) [オレガノ, バジル] · white-wine 白ワイン White wine · katsuobushi 鰹節 Bonito flakes (katsuobushi) [かつお節] · nori 焼き海苔 Nori seaweed [のり] · wasabi わさび Wasabi

**oil_fat (4):** cooking-oil サラダ油 Cooking oil [油] · sesame-oil ごま油 Sesame oil · olive-oil オリーブオイル Olive oil · ra-yu ラー油 Chili oil (ra-yu)

**canned_dry (12):** canned-tuna ツナ缶 Canned tuna · canned-tomatoes トマト缶 Canned tomatoes [カットトマト] · canned-corn コーン缶 Canned corn · canned-mackerel さば缶 Canned mackerel · mixed-beans ミックスビーンズ Mixed beans · kombu 昆布 Kombu kelp · wakame 乾燥わかめ Dried wakame · dried-shiitake 干ししいたけ Dried shiitake · harusame 春雨 Glass noodles (harusame) · kiriboshi-daikon 切り干し大根 Dried daikon strips · hijiki ひじき Hijiki seaweed · tempura-bits 天かす Tempura bits (tenkasu) [揚げ玉]

**frozen (2):** edamame 枝豆 Edamame · mixed-vegetables ミックスベジタブル Frozen mixed vegetables

**other (7):** kimchi キムチ Kimchi · chikuwa ちくわ Chikuwa fish cake · crab-stick カニカマ Imitation crab sticks [かにかま] · umeboshi 梅干し Umeboshi · pickled-ginger 紅しょうが Red pickled ginger · konnyaku こんにゃく Konnyaku [蒟蒻] · chocolate チョコレート Chocolate

`src/data/staples.ts`:
```ts
/** Ingredient IDs added by the "Add common staples" action, in display order. */
export const COMMON_STAPLE_IDS: readonly string[] = [
  'soy-sauce', 'salt', 'sugar', 'miso', 'mirin', 'sake', 'rice-vinegar',
  'cooking-oil', 'sesame-oil', 'black-pepper', 'dashi-granules', 'ketchup',
  'mayonnaise', 'flour', 'rice', 'garlic', 'ginger',
];
```

- [ ] **Step 3: Run tests, commit**

Run: `npm test -- ingredients` — Expected: PASS.

```bash
git add src/data
git commit -m "feat(data): add preset ingredient catalog and common staples"
```

---

### Task 8: Preset recipes and data integrity test

**Files:**
- Create: `src/data/recipes/helpers.ts`, `src/data/recipes/japanese.ts`, `src/data/recipes/western.ts`, `src/data/recipes/chinese.ts`, `src/data/recipes/other.ts`, `src/data/recipes/index.ts`
- Test: `src/data/data.test.ts`

**Interfaces:**
- Produces: `PRESET_RECIPES: Recipe[]` (64 entries), helpers `ing(id, amount?, unit?)`, `opt(id, amount?, unit?)`, `toTaste(id, optional?)`, `recipe(def)`.

- [ ] **Step 1: Write failing integrity test**

`src/data/data.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CUISINES, RECIPE_CATEGORIES, UNITS } from '../domain/types';
import { PRESET_INGREDIENT_IDS } from './ingredients';
import { PRESET_RECIPES } from './recipes';

describe('preset recipes', () => {
  it('has at least 60 recipes with unique ids', () => {
    expect(PRESET_RECIPES.length).toBeGreaterThanOrEqual(60);
    const ids = PRESET_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('covers each cuisine', () => {
    const cuisines = new Set(PRESET_RECIPES.map((r) => r.cuisine));
    for (const cuisine of CUISINES) expect(cuisines.has(cuisine), cuisine).toBe(true);
  });
  it('has complete bilingual content and valid fields', () => {
    for (const r of PRESET_RECIPES) {
      expect(r.isPreset, r.id).toBe(true);
      expect(r.baseServings, r.id).toBeGreaterThan(0);
      expect(r.name.ja, r.id).toBeTruthy();
      expect(r.name.en, r.id).toBeTruthy();
      if (r.description) {
        expect(r.description.ja, r.id).toBeTruthy();
        expect(r.description.en, r.id).toBeTruthy();
      }
      expect(CUISINES).toContain(r.cuisine);
      expect(RECIPE_CATEGORIES).toContain(r.category);
      expect(r.steps.ja?.length ?? 0, r.id).toBeGreaterThan(0);
      expect(r.steps.en?.length ?? 0, r.id).toBeGreaterThan(0);
      expect(r.steps.ja?.length, r.id).toBe(r.steps.en?.length);
      expect(r.ingredients.length, r.id).toBeGreaterThan(0);
      if (r.timeMinutes !== undefined) expect(r.timeMinutes, r.id).toBeGreaterThan(0);
    }
  });
  it('references only catalog ingredients, each at most once per recipe', () => {
    for (const r of PRESET_RECIPES) {
      const seen = new Set<string>();
      for (const ri of r.ingredients) {
        expect(PRESET_INGREDIENT_IDS.has(ri.ingredientId), `${r.id} -> ${ri.ingredientId}`).toBe(true);
        expect(seen.has(ri.ingredientId), `${r.id} repeats ${ri.ingredientId}`).toBe(false);
        seen.add(ri.ingredientId);
        if (ri.unit) expect(UNITS).toContain(ri.unit);
        if (ri.amount !== undefined) expect(ri.amount, `${r.id} -> ${ri.ingredientId}`).toBeGreaterThan(0);
        if (ri.note) {
          expect(ri.note.ja, r.id).toBeTruthy();
          expect(ri.note.en, r.id).toBeTruthy();
        }
      }
    }
  });
  it('never lists water as an ingredient', () => {
    for (const r of PRESET_RECIPES) {
      expect(r.ingredients.some((ri) => ri.ingredientId === 'water'), r.id).toBe(false);
    }
  });
});
```

Run: `npm test -- data` — Expected: FAIL.

- [ ] **Step 2: Write helpers**

`src/data/recipes/helpers.ts`:
```ts
import type { Recipe, RecipeIngredient, Unit } from '../../domain/types';

export function ing(ingredientId: string, amount?: number, unit?: Unit, extra: Partial<RecipeIngredient> = {}): RecipeIngredient {
  return {
    ingredientId,
    ...(amount !== undefined ? { amount } : {}),
    ...(unit ? { unit } : {}),
    ...extra,
  };
}

export function opt(ingredientId: string, amount?: number, unit?: Unit): RecipeIngredient {
  return ing(ingredientId, amount, unit, { optional: true });
}

/** No amount: the UI prints the note or "to taste". */
export function toTaste(ingredientId: string, optional = false): RecipeIngredient {
  return optional ? { ingredientId, optional: true } : { ingredientId };
}

type PresetRecipeDef = Omit<Recipe, 'isPreset' | 'baseServings'> & { baseServings?: number };

export function recipe(def: PresetRecipeDef): Recipe {
  return { baseServings: 2, ...def, isPreset: true };
}
```

- [ ] **Step 3: Write the recipes**

Each recipe file exports an array built with `recipe({...})`. Every recipe has: `id`, `name` (ja/en), `description` (ja/en, one sentence), `cuisine`, `category`, `timeMinutes`, `ingredients` from the row below, and `steps` with the same number of steps in `ja` and `en` (3–7 steps, imperative, mention water and heat levels in the steps). Ingredient rows use `id:amount:unit`, `id:*` for to-taste, and a `?` suffix for optional. Amounts are for 2 servings.

Example (first recipe, fully written):
```ts
import { ing, opt, recipe, toTaste } from './helpers';
import type { Recipe } from '../../domain/types';

export const JAPANESE_RECIPES: Recipe[] = [
  recipe({
    id: 'nikujaga',
    name: { ja: '肉じゃが', en: 'Nikujaga (simmered beef and potatoes)' },
    description: { ja: '甘辛い煮汁でじゃがいもと牛肉を煮た定番の家庭料理。', en: 'A home-cooking classic of potatoes and beef simmered in sweet soy broth.' },
    cuisine: 'japanese',
    category: 'main',
    timeMinutes: 35,
    ingredients: [
      ing('beef-thin-sliced', 200, 'g'), ing('potato', 3, 'pcs'), ing('onion', 1, 'pcs'), ing('carrot', 0.5, 'pcs'),
      opt('green-beans', 6, 'pcs'), ing('soy-sauce', 3, 'tbsp'), ing('sugar', 1.5, 'tbsp'), ing('mirin', 2, 'tbsp'),
      ing('sake', 2, 'tbsp'), ing('dashi-granules', 1, 'tsp'), ing('cooking-oil', 1, 'tbsp'),
    ],
    steps: {
      ja: [
        'じゃがいもは大きめの一口大、にんじんは乱切り、玉ねぎはくし形に切る。',
        '鍋に油を熱し、牛肉を炒めて色が変わったら野菜を加えてさっと炒める。',
        '水400mlと顆粒だしを加え、煮立ったらアクを取り、砂糖・酒・みりんを加えて5分煮る。',
        'しょうゆを加え、落とし蓋をして弱めの中火で15分ほど煮る。',
        'いんげんを加えて2〜3分煮、火を止めてしばらく置いて味を含ませる。',
      ],
      en: [
        'Cut the potatoes into large bite-size pieces, the carrot into chunks and the onion into wedges.',
        'Heat the oil in a pot, brown the beef, then add the vegetables and stir briefly.',
        'Add 400 ml water and the dashi granules. Once boiling, skim, then add sugar, sake and mirin and simmer 5 minutes.',
        'Add the soy sauce, cover with a drop lid and simmer over medium-low heat for about 15 minutes.',
        'Add the green beans, cook 2–3 minutes more, then turn off the heat and let it rest so the flavors soak in.',
      ],
    },
  }),
  // ... remaining rows
];
```

**japanese.ts (27):**
1. nikujaga · 肉じゃが · Nikujaga (simmered beef and potatoes) · main · 35 · (above)
2. ginger-pork · 豚の生姜焼き · Ginger pork (shogayaki) · main · 15 · pork-loin:250:g, onion:0.5:pcs, ginger:1:pcs, soy-sauce:2:tbsp, mirin:2:tbsp, sake:1:tbsp, sugar:1:tsp, cooking-oil:1:tbsp, cabbage?:100:g
3. tofu-wakame-miso-soup · 豆腐とわかめの味噌汁 · Tofu and wakame miso soup · soup · 10 · tofu:150:g, wakame:2:tsp, miso:2:tbsp, dashi-granules:1:tsp, scallion?:*
4. teriyaki-chicken · 鶏の照り焼き · Teriyaki chicken · main · 20 · chicken-thigh:300:g, soy-sauce:2:tbsp, mirin:2:tbsp, sake:1:tbsp, sugar:1:tbsp, cooking-oil:1:tsp
5. oyakodon · 親子丼 · Oyakodon (chicken and egg rice bowl) · rice · 20 · chicken-thigh:200:g, egg:3:pcs, onion:0.5:pcs, rice:300:g, soy-sauce:2:tbsp, mirin:2:tbsp, sugar:1:tbsp, dashi-granules:0.5:tsp, scallion?:*
6. japanese-curry · カレーライス · Japanese curry rice · rice · 40 · curry-roux:100:g, pork-thin-sliced:200:g, onion:1:pcs, carrot:0.5:pcs, potato:2:pcs, rice:300:g, cooking-oil:1:tbsp
7. gyudon · 牛丼 · Gyudon (beef rice bowl) · rice · 20 · beef-thin-sliced:250:g, onion:1:pcs, rice:300:g, soy-sauce:3:tbsp, mirin:2:tbsp, sake:2:tbsp, sugar:1:tbsp, dashi-granules:0.5:tsp, pickled-ginger?:*
8. karaage · 鶏の唐揚げ · Karaage (Japanese fried chicken) · main · 30 · chicken-thigh:400:g, soy-sauce:2:tbsp, sake:1:tbsp, ginger:1:pcs, garlic:1:clove, potato-starch:4:tbsp, cooking-oil:* (note ja 揚げ油 / en for deep-frying), lemon?:0.5:pcs
9. tamagoyaki · 卵焼き · Tamagoyaki (rolled omelette) · side · 10 · egg:3:pcs, sugar:1:tbsp, soy-sauce:1:tsp, dashi-granules:0.5:tsp, cooking-oil:1:tsp
10. saba-misoni · さばの味噌煮 · Mackerel simmered in miso · main · 25 · mackerel:2:slice, miso:2:tbsp, sugar:1.5:tbsp, sake:3:tbsp, mirin:2:tbsp, ginger:1:pcs, soy-sauce:1:tsp
11. salmon-shioyaki · 鮭の塩焼き · Salt-grilled salmon · main · 15 · salmon:2:slice, salt:*, daikon?:100:g, lemon?:0.5:pcs
12. hijiki-nimono · ひじきの煮物 · Simmered hijiki · side · 25 · hijiki:15:g, carrot:0.3:pcs, aburaage:1:sheet, soy-sauce:2:tbsp, sugar:1:tbsp, mirin:1:tbsp, dashi-granules:0.5:tsp, cooking-oil:1:tsp
13. kinpira-gobo · きんぴらごぼう · Kinpira burdock · side · 20 · burdock:1:stalk, carrot:0.3:pcs, soy-sauce:1.5:tbsp, sugar:1:tbsp, mirin:1:tbsp, sesame-oil:1:tbsp, sesame-seeds:1:tbsp, chili-pepper?:1:pcs
14. spinach-goma-ae · ほうれん草のごま和え · Spinach with sesame dressing · side · 10 · spinach:1:bunch, sesame-seeds:2:tbsp, soy-sauce:1:tbsp, sugar:1:tbsp
15. buta-kimchi · 豚キムチ · Pork and kimchi stir-fry · main · 15 · pork-belly:200:g, kimchi:150:g, onion:0.5:pcs, soy-sauce:1:tsp, sesame-oil:1:tbsp, scallion?:*
16. tonjiru · 豚汁 · Tonjiru (pork miso soup) · soup · 30 · pork-thin-sliced:100:g, daikon:150:g, carrot:0.3:pcs, burdock?:0.5:stalk, konnyaku?:100:g, tofu?:100:g, miso:2.5:tbsp, dashi-granules:1:tsp, sesame-oil:1:tsp, scallion?:*
17. okonomiyaki · お好み焼き · Okonomiyaki · main · 25 · cabbage:200:g, flour:100:g, egg:2:pcs, pork-belly:100:g, dashi-granules:1:tsp, tonkatsu-sauce:*, mayonnaise:*, katsuobushi?:*, tempura-bits?:2:tbsp, cooking-oil:1:tbsp
18. yakisoba · 焼きそば · Yakisoba · noodle · 15 · yakisoba-noodles:2:pack, pork-thin-sliced:100:g, cabbage:150:g, carrot:0.3:pcs, bean-sprouts:100:g, worcestershire:3:tbsp, cooking-oil:1:tbsp, pickled-ginger?:*, nori?:*
19. kitsune-udon · きつねうどん · Kitsune udon · noodle · 15 · udon:2:pack, aburaage:2:sheet, mentsuyu:100:ml, soy-sauce:1:tbsp, sugar:1:tbsp, mirin:1:tbsp, scallion:*
20. zaru-soba · ざるそば · Zaru soba (cold soba) · noodle · 10 · soba:200:g, mentsuyu:100:ml, scallion:*, nori?:*, wasabi?:*
21. daikon-soboro-ni · 大根のそぼろ煮 · Daikon with ground chicken sauce · side · 25 · daikon:300:g, ground-chicken:100:g, ginger:1:pcs, soy-sauce:2:tbsp, mirin:2:tbsp, sugar:1:tbsp, dashi-granules:1:tsp, potato-starch:1:tbsp
22. niratama · ニラ玉 · Garlic chive omelette (niratama) · side · 10 · garlic-chives:1:bunch, egg:3:pcs, soy-sauce:1:tsp, sesame-oil:1:tbsp, salt:*
23. cucumber-wakame-sunomono · きゅうりとわかめの酢の物 · Cucumber and wakame vinegar salad · salad · 10 · cucumber:1:pcs, wakame:2:tsp, rice-vinegar:2:tbsp, sugar:1:tbsp, soy-sauce:1:tsp, salt:*, sesame-seeds?:1:tsp
24. agedashi-tofu · 揚げ出し豆腐 · Agedashi tofu · side · 20 · tofu:300:g, potato-starch:3:tbsp, mentsuyu:80:ml, cooking-oil:3:tbsp, scallion:*, ginger?:1:pcs
25. katsudon · カツ丼 · Katsudon (pork cutlet rice bowl) · rice · 35 · pork-loin:2:slice, egg:3:pcs, onion:0.5:pcs, flour:3:tbsp, bread-crumbs:50:g, rice:300:g, soy-sauce:2:tbsp, mirin:2:tbsp, sugar:1:tbsp, dashi-granules:0.5:tsp, cooking-oil:* (for deep-frying)
26. takikomi-gohan · 炊き込みご飯 · Takikomi gohan (mixed rice) · rice · 60 · rice:2:cup, chicken-thigh:150:g, carrot:0.3:pcs, shiitake:3:pcs, aburaage?:1:sheet, soy-sauce:2:tbsp, sake:1:tbsp, mirin:1:tbsp, dashi-granules:1:tsp
27. nasu-miso-itame · なすと豚肉の味噌炒め · Eggplant and pork miso stir-fry · main · 15 · eggplant:2:pcs, pork-thin-sliced:150:g, miso:1.5:tbsp, sugar:1:tbsp, sake:1:tbsp, soy-sauce:1:tsp, cooking-oil:2:tbsp, shiso?:*

**western.ts (21):**
1. hamburg-steak · ハンバーグ · Hamburg steak · main · 30 · ground-meat-mix:300:g, onion:0.5:pcs, egg:1:pcs, bread-crumbs:30:g, milk:2:tbsp, salt:*, black-pepper:*, ketchup:2:tbsp, worcestershire:2:tbsp, cooking-oil:1:tbsp
2. omurice · オムライス · Omurice · rice · 20 · rice:300:g, egg:4:pcs, chicken-thigh:100:g, onion:0.5:pcs, ketchup:4:tbsp, butter:10:g, salt:*, black-pepper:*
3. carbonara · カルボナーラ · Carbonara · noodle · 20 · spaghetti:200:g, bacon:80:g, egg:2:pcs, parmesan:4:tbsp, black-pepper:*, garlic?:1:clove, heavy-cream?:50:ml
4. napolitan · ナポリタン · Napolitan spaghetti · noodle · 20 · spaghetti:200:g, sausage:4:pcs, onion:0.5:pcs, bell-pepper:1:pcs, ketchup:5:tbsp, butter:10:g, button-mushroom?:4:pcs, parmesan?:*
5. peperoncino · ペペロンチーノ · Spaghetti aglio e olio · noodle · 15 · spaghetti:200:g, garlic:2:clove, olive-oil:3:tbsp, chili-pepper:1:pcs, salt:*
6. tomato-pasta · トマトソースパスタ · Tomato sauce pasta · noodle · 25 · spaghetti:200:g, canned-tomatoes:1:can, garlic:1:clove, onion:0.5:pcs, olive-oil:2:tbsp, salt:*, parmesan?:*, bacon?:50:g
7. mentaiko-pasta · 明太子パスタ · Mentaiko pasta · noodle · 15 · spaghetti:200:g, mentaiko:60:g, butter:20:g, soy-sauce:1:tsp, nori?:*, shiso?:2:pcs
8. cream-stew · クリームシチュー · Cream stew · soup · 40 · chicken-thigh:250:g, potato:2:pcs, carrot:0.5:pcs, onion:1:pcs, milk:300:ml, butter:20:g, flour:3:tbsp, consomme:1:tsp, salt:*, broccoli?:80:g
9. minestrone · ミネストローネ · Minestrone · soup · 30 · canned-tomatoes:1:can, onion:0.5:pcs, carrot:0.5:pcs, bacon:50:g, potato?:1:pcs, celery?:0.5:stalk, consomme:1:tsp, olive-oil:1:tbsp, salt:*
10. potato-salad · ポテトサラダ · Potato salad · salad · 25 · potato:3:pcs, cucumber:0.5:pcs, carrot:0.3:pcs, ham:2:slice, mayonnaise:3:tbsp, salt:*, black-pepper:*, egg?:1:pcs
11. coleslaw · コールスロー · Coleslaw · salad · 15 · cabbage:200:g, carrot:0.3:pcs, canned-corn:50:g, mayonnaise:3:tbsp, rice-vinegar:1:tbsp, sugar:1:tsp, salt:*
12. herb-chicken-saute · 鶏もものハーブソテー · Herb chicken sauté · main · 20 · chicken-thigh:300:g, salt:*, black-pepper:*, garlic:1:clove, olive-oil:1:tbsp, dried-herbs?:1:tsp, lemon?:0.5:pcs
13. french-toast · フレンチトースト · French toast · dessert · 15 · bread:2:slice, egg:1:pcs, milk:100:ml, sugar:1:tbsp, butter:10:g, honey?:*
14. pancakes · パンケーキ · Pancakes · dessert · 20 · flour:150:g, egg:1:pcs, milk:120:ml, sugar:2:tbsp, baking-powder:1:tsp, butter:10:g, honey?:*
15. macaroni-gratin · マカロニグラタン · Macaroni gratin · main · 40 · macaroni:100:g, chicken-thigh:150:g, onion:0.5:pcs, milk:400:ml, butter:30:g, flour:3:tbsp, shredded-cheese:60:g, consomme:0.5:tsp, salt:*
16. pizza-toast · ピザトースト · Pizza toast · main · 10 · bread:2:slice, ketchup:2:tbsp, shredded-cheese:60:g, bell-pepper?:0.5:pcs, onion?:0.25:pcs, bacon?:1:slice
17. ratatouille · ラタトゥイユ · Ratatouille · side · 35 · eggplant:1:pcs, zucchini:1:pcs, paprika:1:pcs, canned-tomatoes:1:can, onion:0.5:pcs, garlic:1:clove, olive-oil:2:tbsp, salt:*
18. egg-sandwich · たまごサンド · Egg salad sandwich · main · 15 · bread:4:slice, egg:3:pcs, mayonnaise:3:tbsp, salt:*, black-pepper:*
19. corn-potage · コーンポタージュ · Corn potage · soup · 20 · canned-corn:200:g, milk:300:ml, butter:10:g, onion:0.25:pcs, consomme:0.5:tsp, salt:*
20. chicken-tomato-stew · 鶏肉のトマト煮 · Chicken in tomato sauce · main · 30 · chicken-thigh:300:g, canned-tomatoes:1:can, onion:1:pcs, garlic:1:clove, olive-oil:1:tbsp, consomme:1:tsp, salt:*, shredded-cheese?:40:g
21. garlic-shrimp · ガーリックシュリンプ · Garlic shrimp · main · 15 · shrimp:200:g, garlic:2:clove, butter:15:g, olive-oil:1:tbsp, salt:*, black-pepper:*, lemon?:0.5:pcs

**chinese.ts (15):**
1. mapo-tofu · 麻婆豆腐 · Mapo tofu · main · 20 · tofu:300:g, ground-pork:150:g, doubanjiang:1:tbsp, tianmianjiang?:1:tbsp, garlic:1:clove, ginger:1:pcs, soy-sauce:1:tbsp, chicken-stock-powder:1:tsp, potato-starch:1:tbsp, sesame-oil:1:tsp, scallion:*
2. gyoza · 餃子 · Gyoza · main · 40 · gyoza-wrappers:24:sheet, ground-pork:200:g, cabbage:150:g, garlic-chives:0.5:bunch, garlic:1:clove, ginger:1:pcs, soy-sauce:1:tbsp, sesame-oil:1:tbsp, salt:*, cooking-oil:1:tbsp
3. fried-rice · チャーハン · Fried rice · rice · 15 · rice:300:g, egg:2:pcs, scallion:*, ham:2:slice, soy-sauce:1:tbsp, salt:*, chicken-stock-powder:1:tsp, cooking-oil:2:tbsp
4. hoikoro · 回鍋肉 · Twice-cooked pork (hoikoro) · main · 20 · pork-belly:200:g, cabbage:200:g, bell-pepper:1:pcs, tianmianjiang:1.5:tbsp, doubanjiang:1:tsp, soy-sauce:1:tbsp, sake:1:tbsp, garlic:1:clove, cooking-oil:1:tbsp
5. chinjao-rosu · 青椒肉絲 · Pepper steak (chinjao rosu) · main · 20 · beef-thin-sliced:200:g, bell-pepper:3:pcs, bamboo-shoot:100:g, oyster-sauce:1:tbsp, soy-sauce:1:tbsp, sake:1:tbsp, potato-starch:1:tbsp, garlic:1:clove, cooking-oil:1:tbsp
6. ebi-chili · エビチリ · Chili shrimp (ebi chili) · main · 20 · shrimp:250:g, ketchup:3:tbsp, doubanjiang:1:tsp, garlic:1:clove, ginger:1:pcs, scallion:*, sake:1:tbsp, sugar:1:tsp, chicken-stock-powder:1:tsp, potato-starch:1:tbsp, cooking-oil:1:tbsp
7. chinese-egg-soup · 中華風たまごスープ · Chinese egg drop soup · soup · 10 · egg:1:pcs, chicken-stock-powder:2:tsp, soy-sauce:1:tsp, sesame-oil:1:tsp, scallion?:*, wakame?:1:tsp, potato-starch?:1:tsp
8. bean-sprout-stir-fry · もやし炒め · Bean sprout stir-fry · side · 10 · bean-sprouts:200:g, garlic-chives?:0.5:bunch, pork-thin-sliced?:80:g, soy-sauce:1:tsp, salt:*, black-pepper:*, sesame-oil:1:tbsp, chicken-stock-powder:0.5:tsp
9. bang-bang-ji · 棒棒鶏 · Bang bang chicken · salad · 25 · chicken-breast:1:pcs, cucumber:1:pcs, tomato?:1:pcs, sesame-paste:2:tbsp, soy-sauce:1.5:tbsp, rice-vinegar:1:tbsp, sugar:1:tbsp, sesame-oil:1:tsp, ra-yu?:*
10. sweet-and-sour-pork · 酢豚 · Sweet and sour pork · main · 35 · pork-loin:250:g, onion:0.5:pcs, bell-pepper:1:pcs, carrot:0.5:pcs, ketchup:3:tbsp, rice-vinegar:2:tbsp, sugar:2:tbsp, soy-sauce:1:tbsp, potato-starch:3:tbsp, cooking-oil:* (for frying)
11. tenshinhan · 天津飯 · Tenshinhan (crab omelette rice) · rice · 15 · rice:300:g, egg:4:pcs, crab-stick:6:pcs, scallion:*, chicken-stock-powder:1:tsp, soy-sauce:1:tbsp, rice-vinegar:1:tbsp, sugar:1:tbsp, potato-starch:1:tbsp, sesame-oil:1:tsp
12. chuka-don · 中華丼 · Chuka-don (stir-fry rice bowl) · rice · 20 · rice:300:g, pork-thin-sliced:120:g, napa-cabbage:200:g, carrot:0.3:pcs, shiitake:2:pcs, bean-sprouts?:100:g, chicken-stock-powder:1:tsp, soy-sauce:1:tbsp, oyster-sauce:1:tbsp, potato-starch:1.5:tbsp, sesame-oil:1:tsp, cooking-oil:1:tbsp
13. harusame-salad · 春雨サラダ · Glass noodle salad · salad · 15 · harusame:50:g, cucumber:0.5:pcs, ham:2:slice, egg?:1:pcs, soy-sauce:2:tbsp, rice-vinegar:2:tbsp, sugar:1:tbsp, sesame-oil:1:tbsp, sesame-seeds:1:tsp
14. tomato-egg-stir-fry · トマトと卵の中華炒め · Tomato and egg stir-fry · side · 10 · tomato:2:pcs, egg:3:pcs, salt:*, sugar:0.5:tsp, chicken-stock-powder:0.5:tsp, sesame-oil:1:tbsp, scallion?:*
15. chinese-corn-soup · 中華風コーンスープ · Chinese corn soup · soup · 10 · canned-corn:150:g, egg:1:pcs, chicken-stock-powder:2:tsp, potato-starch:1:tsp, salt:*, sesame-oil:0.5:tsp, scallion?:*

**other.ts (1):**
1. kimchi-fried-rice · キムチチャーハン · Kimchi fried rice · cuisine other · rice · 15 · rice:300:g, kimchi:150:g, pork-belly:100:g, egg:2:pcs, sesame-oil:1:tbsp, soy-sauce:1:tsp, scallion?:*

`src/data/recipes/index.ts`:
```ts
import type { Recipe } from '../../domain/types';
import { CHINESE_RECIPES } from './chinese';
import { JAPANESE_RECIPES } from './japanese';
import { OTHER_RECIPES } from './other';
import { WESTERN_RECIPES } from './western';

export const PRESET_RECIPES: Recipe[] = [
  ...JAPANESE_RECIPES,
  ...WESTERN_RECIPES,
  ...CHINESE_RECIPES,
  ...OTHER_RECIPES,
];
```

- [ ] **Step 4: Run tests, commit**

Run: `npm test -- data` — Expected: PASS (all integrity checks).

```bash
git add src/data
git commit -m "feat(data): add 64 bilingual preset recipes with integrity test"
```

---

### Task 9: Store, persistence, selectors, i18n hooks

**Files:**
- Create: `src/store/migrations.ts`, `src/store/exportImport.ts`, `src/store/useAppStore.ts`, `src/store/selectors.ts`, `src/i18n/index.ts`
- Test: `src/store/migrations.test.ts`, `src/store/exportImport.test.ts`, `src/store/useAppStore.test.ts`

**Interfaces:**
- Produces:
  - `defaultPersistedState(language?)`, `detectLanguage(navLang)`, `migrate(raw, fromVersion): PersistedState`, `clamp(n, min, max)`.
  - `serializeState(state)`, `parseImportedState(json)` (throws `Error` on invalid), `exportFilename(today)`, `downloadTextFile(filename, text)`.
  - `useAppStore` (Zustand) with `AppStore = PersistedState & AppActions`; `STORAGE_KEY`; `isStorageAvailable()`; `pickPersisted(store)`.
  - `AppActions`: `setLanguage(lang)`, `setServings(n)`, `setAlmostThreshold(n)`, `addPantryItem(ingredientId, fields?)`, `updatePantryItem(ingredientId, patch)`, `removePantryItem(ingredientId)`, `addCommonStaples(): number`, `createIngredient(input): Ingredient`, `addCustomRecipe(input): Recipe`, `updateCustomRecipe(id, input)`, `deleteCustomRecipe(id)`, `duplicateRecipe(source): Recipe`, `addToShopping(ingredientId)`, `removeFromShopping(ingredientId)`, `markBought(ingredientId)`, `importState(state)`, `resetAll()`.
  - Hooks: `useAllIngredients()`, `useIngredientLookup()`, `useIngredientName()`, `useAllRecipes()`, `useRecipe(id)`, `usePantryIds()`.
  - `useT(): TFunction`, `useLang(): Lang`; `src/i18n/index.ts` re-exports `translate`, `TranslationKey`, `TFunction`.

- [ ] **Step 1: Write failing tests**

`src/store/migrations.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { defaultPersistedState, detectLanguage, migrate } from './migrations';

describe('migrations', () => {
  it('detects Japanese from the browser language', () => {
    expect(detectLanguage('ja-JP')).toBe('ja');
    expect(detectLanguage('en-US')).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });
  it('fills missing keys with defaults for version 1', () => {
    const migrated = migrate({ schemaVersion: 1, pantry: [{ ingredientId: 'egg', addedOn: '2026-01-01' }] }, 1);
    expect(migrated.pantry).toHaveLength(1);
    expect(migrated.customRecipes).toEqual([]);
    expect(migrated.servings).toBe(2);
    expect(migrated.schemaVersion).toBe(1);
  });
  it('rejects versions from the future', () => {
    expect(() => migrate({}, 99)).toThrow();
  });
  it('default state is complete', () => {
    expect(defaultPersistedState('ja')).toEqual({
      schemaVersion: 1, language: 'ja', servings: 2, almostThreshold: 2,
      customIngredients: [], pantry: [], customRecipes: [], shoppingList: [],
    });
  });
});
```

`src/store/exportImport.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { defaultPersistedState } from './migrations';
import { exportFilename, parseImportedState, serializeState } from './exportImport';

describe('export/import', () => {
  it('round-trips state', () => {
    const state = { ...defaultPersistedState('ja'), pantry: [{ ingredientId: 'egg', addedOn: '2026-09-18' }] };
    expect(parseImportedState(serializeState(state))).toEqual(state);
  });
  it('rejects invalid JSON and wrong shapes', () => {
    expect(() => parseImportedState('not json')).toThrow();
    expect(() => parseImportedState('[]')).toThrow();
    expect(() => parseImportedState(JSON.stringify({ schemaVersion: 1 }))).toThrow();
    expect(() => parseImportedState(JSON.stringify({ ...defaultPersistedState(), pantry: 'nope' }))).toThrow();
    expect(() => parseImportedState(JSON.stringify({ ...defaultPersistedState(), pantry: [{ nope: 1 }] }))).toThrow();
    expect(() => parseImportedState(JSON.stringify({ ...defaultPersistedState(), language: 'fr' }))).toThrow();
  });
  it('clamps servings and threshold', () => {
    const parsed = parseImportedState(JSON.stringify({ ...defaultPersistedState(), servings: 99, almostThreshold: 0 }));
    expect(parsed.servings).toBe(12);
    expect(parsed.almostThreshold).toBe(1);
  });
  it('builds a dated filename', () => {
    expect(exportFilename('2026-09-18')).toBe('grocery-manager-2026-09-18.json');
  });
});
```

`src/store/useAppStore.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { makeRecipe } from '../test/factories';
import { defaultPersistedState } from './migrations';
import { STORAGE_KEY, useAppStore } from './useAppStore';

beforeEach(() => {
  window.localStorage.clear();
  useAppStore.setState(defaultPersistedState('en'));
});

describe('pantry actions', () => {
  it('adds, updates, removes and dedupes pantry items', () => {
    const s = useAppStore.getState();
    s.addPantryItem('egg');
    s.addPantryItem('egg', { quantity: '6' });
    expect(useAppStore.getState().pantry).toHaveLength(1);
    expect(useAppStore.getState().pantry[0].quantity).toBe('6');
    s.updatePantryItem('egg', { expiresOn: '2026-09-20', location: 'fridge' });
    expect(useAppStore.getState().pantry[0]).toMatchObject({ expiresOn: '2026-09-20', location: 'fridge' });
    s.removePantryItem('egg');
    expect(useAppStore.getState().pantry).toHaveLength(0);
  });
  it('adds common staples once', () => {
    const s = useAppStore.getState();
    s.addPantryItem('salt');
    const added = s.addCommonStaples();
    expect(added).toBe(16);
    expect(useAppStore.getState().addCommonStaples()).toBe(0);
  });
  it('persists to localStorage', () => {
    useAppStore.getState().addPantryItem('egg');
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toContain('"egg"');
  });
});

describe('ingredients and recipes', () => {
  it('creates custom ingredients with generated ids', () => {
    const ing = useAppStore.getState().createIngredient({ name: { ja: 'ザーサイ' }, category: 'other' });
    expect(ing.id.startsWith('custom-')).toBe(true);
    expect(ing.isPreset).toBe(false);
    expect(useAppStore.getState().customIngredients).toEqual([ing]);
  });
  it('adds, updates and deletes custom recipes', () => {
    const s = useAppStore.getState();
    const base = makeRecipe({ name: { en: 'Mine' }, ingredients: [{ ingredientId: 'egg' }] });
    const { id: _ignored, isPreset: _p, ...input } = base;
    const created = s.addCustomRecipe(input);
    expect(created.isPreset).toBe(false);
    s.updateCustomRecipe(created.id, { ...input, name: { en: 'Renamed' } });
    expect(useAppStore.getState().customRecipes[0].name.en).toBe('Renamed');
    s.deleteCustomRecipe(created.id);
    expect(useAppStore.getState().customRecipes).toHaveLength(0);
  });
  it('duplicates a preset into an editable copy with a localized suffix', () => {
    const preset = makeRecipe({ id: 'nikujaga', name: { ja: '肉じゃが', en: 'Nikujaga' }, isPreset: true });
    const copy = useAppStore.getState().duplicateRecipe(preset);
    expect(copy.isPreset).toBe(false);
    expect(copy.id).not.toBe('nikujaga');
    expect(copy.name).toEqual({ ja: '肉じゃが（コピー）', en: 'Nikujaga (copy)' });
    expect(copy.ingredients).not.toBe(preset.ingredients);
  });
});

describe('shopping', () => {
  it('adds once, removes, and marks bought into the pantry', () => {
    const s = useAppStore.getState();
    s.addToShopping('milk');
    s.addToShopping('milk');
    s.addToShopping('egg');
    expect(useAppStore.getState().shoppingList.map((i) => i.ingredientId)).toEqual(['milk', 'egg']);
    s.removeFromShopping('egg');
    s.markBought('milk');
    expect(useAppStore.getState().shoppingList).toEqual([]);
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['milk']);
  });
});

describe('settings and data', () => {
  it('clamps servings and threshold', () => {
    const s = useAppStore.getState();
    s.setServings(0);
    expect(useAppStore.getState().servings).toBe(1);
    s.setServings(50);
    expect(useAppStore.getState().servings).toBe(12);
    s.setAlmostThreshold(9);
    expect(useAppStore.getState().almostThreshold).toBe(3);
  });
  it('imports and resets while keeping the language', () => {
    const s = useAppStore.getState();
    s.setLanguage('ja');
    s.importState({ ...defaultPersistedState('ja'), pantry: [{ ingredientId: 'egg', addedOn: '2026-09-18' }] });
    expect(useAppStore.getState().pantry).toHaveLength(1);
    s.resetAll();
    expect(useAppStore.getState().pantry).toHaveLength(0);
    expect(useAppStore.getState().language).toBe('ja');
  });
});
```

Run: `npm test -- store` — Expected: FAIL.

- [ ] **Step 2: Implement migrations**

`src/store/migrations.ts`:
```ts
import { CURRENT_SCHEMA_VERSION, type Lang, type PersistedState } from '../domain/types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function detectLanguage(navLang: string | undefined): Lang {
  return navLang?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function defaultPersistedState(language: Lang = 'en'): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    language,
    servings: 2,
    almostThreshold: 2,
    customIngredients: [],
    pantry: [],
    customRecipes: [],
    shoppingList: [],
  };
}

/**
 * Upgrade a persisted blob from `fromVersion` to the current schema.
 * Version 1 is current: fill any missing keys with defaults.
 * Future versions add a `case` per step and fall through.
 */
export function migrate(raw: unknown, fromVersion: number): PersistedState {
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version ${fromVersion}`);
  }
  const partial = (raw && typeof raw === 'object' ? raw : {}) as Partial<PersistedState>;
  return { ...defaultPersistedState(partial.language), ...partial, schemaVersion: CURRENT_SCHEMA_VERSION };
}
```

- [ ] **Step 3: Implement export/import**

`src/store/exportImport.ts`:
```ts
import type { PersistedState } from '../domain/types';
import { clamp, migrate } from './migrations';

const LANGS = ['ja', 'en'];
const ARRAY_KEYS = ['customIngredients', 'pantry', 'customRecipes', 'shoppingList'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function serializeState(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}

export function exportFilename(today: string): string {
  return `grocery-manager-${today}.json`;
}

export function parseImportedState(json: string): PersistedState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('invalid-json');
  }
  assert(isRecord(raw), 'invalid-shape');
  const version = raw.schemaVersion;
  assert(typeof version === 'number' && Number.isInteger(version) && version >= 1, 'invalid-version');
  assert(typeof raw.language === 'string' && LANGS.includes(raw.language), 'invalid-language');
  for (const key of ARRAY_KEYS) assert(Array.isArray(raw[key]), `invalid-${key}`);
  for (const item of raw.pantry as unknown[]) assert(isRecord(item) && typeof item.ingredientId === 'string', 'invalid-pantry-item');
  for (const item of raw.shoppingList as unknown[]) assert(isRecord(item) && typeof item.ingredientId === 'string', 'invalid-shopping-item');
  for (const item of raw.customIngredients as unknown[]) {
    assert(isRecord(item) && typeof item.id === 'string' && isRecord(item.name) && typeof item.category === 'string', 'invalid-ingredient');
  }
  for (const item of raw.customRecipes as unknown[]) {
    assert(isRecord(item) && typeof item.id === 'string' && isRecord(item.name) && Array.isArray(item.ingredients), 'invalid-recipe');
  }
  const migrated = migrate(raw, version);
  return {
    ...migrated,
    servings: clamp(Number(migrated.servings) || 2, 1, 12),
    almostThreshold: clamp(Number(migrated.almostThreshold) || 2, 1, 3),
  };
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Implement the store**

`src/store/useAppStore.ts`:
```ts
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { COMMON_STAPLE_IDS } from '../data/staples';
import { todayIso } from '../domain/dates';
import { newId } from '../domain/ids';
import {
  CURRENT_SCHEMA_VERSION,
  type Ingredient,
  type Lang,
  type LocalizedText,
  type PantryItem,
  type PersistedState,
  type Recipe,
} from '../domain/types';
import { clamp, defaultPersistedState, detectLanguage, migrate } from './migrations';

export const STORAGE_KEY = 'grocery-manager';

let storageAvailable = true;
const memory = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => { memory.set(name, value); },
  removeItem: (name) => { memory.delete(name); },
};

function resolveStorage(): StateStorage {
  try {
    const probe = '__grocery_manager_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    storageAvailable = false;
    return memoryStorage;
  }
}

export function isStorageAvailable(): boolean {
  return storageAvailable;
}

export type PantryItemFields = Omit<PantryItem, 'ingredientId' | 'addedOn'>;
export type IngredientInput = Omit<Ingredient, 'id' | 'isPreset'>;
export type RecipeInput = Omit<Recipe, 'id' | 'isPreset'>;

export interface AppActions {
  setLanguage: (language: Lang) => void;
  setServings: (servings: number) => void;
  setAlmostThreshold: (threshold: number) => void;
  addPantryItem: (ingredientId: string, fields?: PantryItemFields) => void;
  updatePantryItem: (ingredientId: string, patch: PantryItemFields) => void;
  removePantryItem: (ingredientId: string) => void;
  addCommonStaples: () => number;
  createIngredient: (input: IngredientInput) => Ingredient;
  addCustomRecipe: (input: RecipeInput) => Recipe;
  updateCustomRecipe: (id: string, input: RecipeInput) => void;
  deleteCustomRecipe: (id: string) => void;
  duplicateRecipe: (source: Recipe) => Recipe;
  addToShopping: (ingredientId: string) => void;
  removeFromShopping: (ingredientId: string) => void;
  markBought: (ingredientId: string) => void;
  importState: (state: PersistedState) => void;
  resetAll: () => void;
}

export type AppStore = PersistedState & AppActions;

const PERSISTED_KEYS: readonly (keyof PersistedState)[] = [
  'schemaVersion', 'language', 'servings', 'almostThreshold',
  'customIngredients', 'pantry', 'customRecipes', 'shoppingList',
];

export function pickPersisted(store: AppStore): PersistedState {
  const out: Record<string, unknown> = {};
  for (const key of PERSISTED_KEYS) out[key] = store[key];
  return out as unknown as PersistedState;
}

const COPY_SUFFIX: Record<Lang, string> = { ja: '（コピー）', en: ' (copy)' };

function withCopySuffix(name: LocalizedText): LocalizedText {
  return {
    ...(name.ja ? { ja: name.ja + COPY_SUFFIX.ja } : {}),
    ...(name.en ? { en: name.en + COPY_SUFFIX.en } : {}),
  };
}

const initialLanguage = detectLanguage(typeof navigator !== 'undefined' ? navigator.language : undefined);

export const useAppStore = create<AppStore>()(
  persist<AppStore, [], [], PersistedState>(
    (set, get) => ({
      ...defaultPersistedState(initialLanguage),

      setLanguage: (language) => set({ language }),
      setServings: (servings) => set({ servings: clamp(Math.round(servings), 1, 12) }),
      setAlmostThreshold: (threshold) => set({ almostThreshold: clamp(Math.round(threshold), 1, 3) }),

      addPantryItem: (ingredientId, fields = {}) =>
        set((state) => {
          const exists = state.pantry.some((item) => item.ingredientId === ingredientId);
          if (exists) {
            return { pantry: state.pantry.map((item) => (item.ingredientId === ingredientId ? { ...item, ...fields } : item)) };
          }
          return { pantry: [...state.pantry, { ingredientId, addedOn: todayIso(), ...fields }] };
        }),
      updatePantryItem: (ingredientId, patch) =>
        set((state) => ({
          pantry: state.pantry.map((item) => (item.ingredientId === ingredientId ? { ...item, ...patch } : item)),
        })),
      removePantryItem: (ingredientId) =>
        set((state) => ({ pantry: state.pantry.filter((item) => item.ingredientId !== ingredientId) })),
      addCommonStaples: () => {
        const have = new Set(get().pantry.map((item) => item.ingredientId));
        const missing = COMMON_STAPLE_IDS.filter((id) => !have.has(id));
        if (missing.length > 0) {
          const addedOn = todayIso();
          set((state) => ({ pantry: [...state.pantry, ...missing.map((ingredientId) => ({ ingredientId, addedOn }))] }));
        }
        return missing.length;
      },

      createIngredient: (input) => {
        const ingredient: Ingredient = { ...input, id: newId('custom'), isPreset: false };
        set((state) => ({ customIngredients: [...state.customIngredients, ingredient] }));
        return ingredient;
      },

      addCustomRecipe: (input) => {
        const created: Recipe = { ...input, id: newId('custom'), isPreset: false };
        set((state) => ({ customRecipes: [...state.customRecipes, created] }));
        return created;
      },
      updateCustomRecipe: (id, input) =>
        set((state) => ({
          customRecipes: state.customRecipes.map((r) => (r.id === id ? { ...input, id, isPreset: false } : r)),
        })),
      deleteCustomRecipe: (id) =>
        set((state) => ({ customRecipes: state.customRecipes.filter((r) => r.id !== id) })),
      duplicateRecipe: (source) => {
        const copy: Recipe = {
          ...source,
          id: newId('custom'),
          isPreset: false,
          name: withCopySuffix(source.name),
          ingredients: source.ingredients.map((ri) => ({ ...ri })),
          steps: {
            ...(source.steps.ja ? { ja: [...source.steps.ja] } : {}),
            ...(source.steps.en ? { en: [...source.steps.en] } : {}),
          },
        };
        set((state) => ({ customRecipes: [...state.customRecipes, copy] }));
        return copy;
      },

      addToShopping: (ingredientId) =>
        set((state) =>
          state.shoppingList.some((item) => item.ingredientId === ingredientId)
            ? {}
            : { shoppingList: [...state.shoppingList, { ingredientId, addedOn: todayIso() }] },
        ),
      removeFromShopping: (ingredientId) =>
        set((state) => ({ shoppingList: state.shoppingList.filter((item) => item.ingredientId !== ingredientId) })),
      markBought: (ingredientId) => {
        get().removeFromShopping(ingredientId);
        get().addPantryItem(ingredientId);
      },

      importState: (state) => set({ ...state, schemaVersion: CURRENT_SCHEMA_VERSION }),
      resetAll: () => set({ ...defaultPersistedState(get().language) }),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_SCHEMA_VERSION,
      storage: createJSONStorage(resolveStorage),
      partialize: (store) => pickPersisted(store),
      migrate: (persisted, version) => migrate(persisted, version),
    },
  ),
);
```

- [ ] **Step 5: Implement selectors and i18n hooks**

`src/store/selectors.ts`:
```ts
import { useCallback, useMemo } from 'react';
import { PRESET_INGREDIENTS } from '../data/ingredients';
import { PRESET_RECIPES } from '../data/recipes';
import { localize } from '../domain/localize';
import type { Ingredient, Recipe } from '../domain/types';
import { useAppStore } from './useAppStore';

export function useAllIngredients(): Ingredient[] {
  const custom = useAppStore((s) => s.customIngredients);
  return useMemo(() => [...PRESET_INGREDIENTS, ...custom], [custom]);
}

export function useIngredientLookup(): (id: string) => Ingredient | undefined {
  const all = useAllIngredients();
  return useMemo(() => {
    const byId = new Map(all.map((ingredient) => [ingredient.id, ingredient]));
    return (id: string) => byId.get(id);
  }, [all]);
}

/** Localized ingredient name; unknown IDs render as "?" so a bad import never crashes the UI. */
export function useIngredientName(): (id: string) => string {
  const lookup = useIngredientLookup();
  const lang = useAppStore((s) => s.language);
  return useCallback((id: string) => {
    const ingredient = lookup(id);
    return ingredient ? localize(ingredient.name, lang) : '?';
  }, [lookup, lang]);
}

export function useAllRecipes(): Recipe[] {
  const custom = useAppStore((s) => s.customRecipes);
  return useMemo(() => [...PRESET_RECIPES, ...custom], [custom]);
}

export function useRecipe(id: string | undefined): Recipe | undefined {
  const all = useAllRecipes();
  return useMemo(() => (id ? all.find((recipe) => recipe.id === id) : undefined), [all, id]);
}

export function usePantryIds(): Set<string> {
  const pantry = useAppStore((s) => s.pantry);
  return useMemo(() => new Set(pantry.map((item) => item.ingredientId)), [pantry]);
}
```

`src/i18n/index.ts`:
```ts
import { useCallback } from 'react';
import type { Lang } from '../domain/types';
import { useAppStore } from '../store/useAppStore';
import { translate, type TFunction, type TranslateParams } from './translate';

export { translate } from './translate';
export type { TFunction, TranslateParams } from './translate';
export type { TranslationKey } from './en';

export function useLang(): Lang {
  return useAppStore((s) => s.language);
}

export function useT(): TFunction {
  const lang = useLang();
  return useCallback((key, params?: TranslateParams) => translate(lang, key, params), [lang]);
}
```

- [ ] **Step 6: Run tests, build, commit**

Run: `npm test && npm run build` — Expected: PASS; no type errors.

```bash
git add src/store src/i18n/index.ts
git commit -m "feat(store): add persisted Zustand store, import/export, selectors and i18n hooks"
```

---

### Task 10: Shared UI components, layout, router and page stubs

**Files:**
- Create: `src/components/Button.tsx`, `src/components/Badge.tsx`, `src/components/Chip.tsx`, `src/components/Sheet.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/SearchInput.tsx`, `src/components/ServingsStepper.tsx`, `src/components/EmptyState.tsx`, `src/components/PageHeader.tsx`, `src/components/Toast.tsx`, `src/components/BottomNav.tsx`, `src/components/Layout.tsx`, `src/features/pantry/PantryPage.tsx` (stub), `src/features/suggestions/SuggestionsPage.tsx` (stub), `src/features/recipes/RecipesPage.tsx` (stub), `src/features/recipes/RecipeDetailPage.tsx` (stub), `src/features/recipes/RecipeFormPage.tsx` (stub), `src/features/shopping/ShoppingPage.tsx` (stub), `src/features/settings/SettingsPage.tsx` (stub), `src/test/render.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/components/Layout.test.tsx`, `src/components/ServingsStepper.test.tsx`

**Interfaces:**
- Produces: `Button({variant?: 'primary'|'secondary'|'danger'|'ghost', size?: 'sm'|'md', ...button props})`, `Badge({tone?: 'neutral'|'amber'|'red'|'green'|'blue'})`, `Chip({selected, onClick, children})`, `Sheet({open, onClose, title, children})`, `ConfirmDialog({open, title, body, confirmLabel, danger?, onConfirm, onCancel})`, `SearchInput({value, onChange, placeholder, autoFocus?})`, `ServingsStepper({value, onChange})`, `EmptyState({title, body, action?})`, `PageHeader({title, action?, backTo?})`, `useToastStore` + `ToastHost`, `BottomNav`, `Layout` (Outlet + nav + toast + lang sync + storage warning), `renderWithProviders(ui, { route? })` for tests.
- Page stubs export the same component names later tasks overwrite.

- [ ] **Step 1: Write failing tests**

`src/test/render.tsx`:
```tsx
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

interface Options {
  route?: string;
  path?: string;
}

/** Render a page inside a memory router so `useParams`/`Link` work. */
export function renderWithRouter(ui: ReactElement, { route = '/', path = '*' }: Options = {}): RenderResult {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}
```

`src/components/Layout.test.tsx`:
```tsx
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
```

`src/components/ServingsStepper.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { defaultPersistedState } from '../store/migrations';
import { ServingsStepper } from './ServingsStepper';

describe('ServingsStepper', () => {
  it('shows the count and clamps at the bounds', async () => {
    useAppStore.setState(defaultPersistedState('en'));
    const onChange = vi.fn();
    render(<ServingsStepper value={12} onChange={onChange} />);
    expect(screen.getByText('12 servings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More servings' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Fewer servings' }));
    expect(onChange).toHaveBeenCalledWith(11);
  });
});
```

Run: `npm test -- components` — Expected: FAIL.

- [ ] **Step 2: Write shared components**

`src/components/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
  secondary: 'bg-white text-stone-800 border border-stone-300 hover:bg-stone-100 disabled:text-stone-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'bg-transparent text-emerald-700 hover:bg-emerald-50 disabled:text-stone-400',
};
const SIZE: Record<Size, string> = { sm: 'px-2.5 py-1 text-sm', md: 'px-4 py-2 text-sm' };

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    />
  );
}
```

`src/components/Badge.tsx`:
```tsx
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'amber' | 'red' | 'green' | 'blue';
const TONE: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-sky-100 text-sky-800',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>{children}</span>;
}
```

`src/components/Chip.tsx`:
```tsx
import type { ReactNode } from 'react';

interface Props {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function Chip({ selected, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors ${
        selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  );
}
```

`src/components/Sheet.tsx`:
```tsx
import { useEffect, type ReactNode } from 'react';
import { useT } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Bottom sheet on phones, centered dialog on wider screens. */
export function Sheet({ open, onClose, title, children }: Props) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="rounded-full p-1 text-stone-500 hover:bg-stone-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

`src/components/ConfirmDialog.tsx`:
```tsx
import { Button } from './Button';
import { Sheet } from './Sheet';
import { useT } from '../i18n';

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel, danger = false, onConfirm, onCancel }: Props) {
  const t = useT();
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="mb-4 text-sm text-stone-700">{body}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Sheet>
  );
}
```

`src/components/SearchInput.tsx`:
```tsx
interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  label?: string;
}

export function SearchInput({ value, onChange, placeholder, autoFocus = false, label }: Props) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label ?? placeholder}
      autoFocus={autoFocus}
      autoComplete="off"
      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-base shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
    />
  );
}
```

`src/components/ServingsStepper.tsx`:
```tsx
import { useT } from '../i18n';

const MIN = 1;
const MAX = 12;

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function ServingsStepper({ value, onChange }: Props) {
  const t = useT();
  const buttonClass = 'h-9 w-9 rounded-full border border-stone-300 bg-white text-lg leading-none text-stone-700 disabled:text-stone-300';
  return (
    <div className="inline-flex items-center gap-3">
      <button type="button" className={buttonClass} aria-label={t('servings.decrease')} disabled={value <= MIN} onClick={() => onChange(value - 1)}>−</button>
      <span className="min-w-[6rem] text-center text-sm font-medium">{t('servings.label', { count: value })}</span>
      <button type="button" className={buttonClass} aria-label={t('servings.increase')} disabled={value >= MAX} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
```

`src/components/EmptyState.tsx`:
```tsx
import type { ReactNode } from 'react';

interface Props {
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="my-10 flex flex-col items-center gap-3 text-center">
      <p className="text-base font-semibold text-stone-800">{title}</p>
      <p className="max-w-xs text-sm text-stone-600">{body}</p>
      {action}
    </div>
  );
}
```

`src/components/PageHeader.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';

interface Props {
  title: string;
  action?: ReactNode;
  backTo?: string;
}

export function PageHeader({ title, action, backTo }: Props) {
  const t = useT();
  return (
    <header className="mb-4 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {backTo && (
          <Link to={backTo} aria-label={t('common.back')} className="rounded-full p-1 text-stone-600 hover:bg-stone-100">
            ←
          </Link>
        )}
        <h1 className="truncate text-xl font-bold text-stone-900">{title}</h1>
      </div>
      {action}
    </header>
  );
}
```

`src/components/Toast.tsx`:
```tsx
import { useEffect } from 'react';
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}));

export function ToastHost() {
  const message = useToastStore((s) => s.message);
  const clear = useToastStore((s) => s.clear);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(clear, 2500);
    return () => window.clearTimeout(timer);
  }, [message, clear]);
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}
```

`src/components/BottomNav.tsx`:
```tsx
import { NavLink } from 'react-router-dom';
import { useT, type TranslationKey } from '../i18n';

const TABS: Array<{ to: string; key: TranslationKey; icon: string }> = [
  { to: '/', key: 'nav.pantry', icon: '🧺' },
  { to: '/suggestions', key: 'nav.suggestions', icon: '🍳' },
  { to: '/recipes', key: 'nav.recipes', icon: '📖' },
  { to: '/shopping', key: 'nav.shopping', icon: '🛒' },
  { to: '/settings', key: 'nav.settings', icon: '⚙️' },
];

export function BottomNav() {
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur" aria-label="Main">
      <ul className="mx-auto flex max-w-2xl justify-around">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`
              }
            >
              <span aria-hidden="true" className="text-xl leading-none">{tab.icon}</span>
              {t(tab.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

`src/components/Layout.tsx`:
```tsx
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useLang, useT } from '../i18n';
import { isStorageAvailable } from '../store/useAppStore';
import { BottomNav } from './BottomNav';
import { ToastHost, useToastStore } from './Toast';

export function Layout() {
  const lang = useLang();
  const t = useT();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!isStorageAvailable()) showToast(t('settings.storageWarning'));
    // Run once on mount; the warning text uses the language active at that time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-2xl pb-24">
        <Outlet />
      </div>
      <BottomNav />
      <ToastHost />
    </div>
  );
}
```

- [ ] **Step 3: Write page stubs and the router**

Each stub (overwritten in later tasks), e.g. `src/features/pantry/PantryPage.tsx`:
```tsx
import { PageHeader } from '../../components/PageHeader';
import { useT } from '../../i18n';

export function PantryPage() {
  const t = useT();
  return <div className="p-4"><PageHeader title={t('pantry.title')} /></div>;
}
```
Same shape for `SuggestionsPage` (`suggestions.title`), `RecipesPage` (`recipes.title`), `RecipeDetailPage` (`recipes.title`), `RecipeFormPage` (`recipeForm.newTitle`), `ShoppingPage` (`shopping.title`), `SettingsPage` (`settings.title`).

`src/App.tsx`:
```tsx
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PantryPage } from './features/pantry/PantryPage';
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
      { path: 'recipes/:id', element: <RecipeDetailPage /> },
      { path: 'recipes/:id/edit', element: <RecipeFormPage /> },
      { path: 'shopping', element: <ShoppingPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

Update `src/App.test.tsx` so the smoke test checks the pantry heading instead:
```tsx
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
```

- [ ] **Step 4: Run tests, build, lint, commit**

Run: `npm test && npm run build && npm run lint` — Expected: PASS.

```bash
git add -A src
git commit -m "feat(ui): add shared components, layout, bottom navigation and hash router"
```

---

### Task 11: Ingredient picker and new-ingredient form

**Files:**
- Create: `src/features/pantry/IngredientPicker.tsx`, `src/features/pantry/NewIngredientForm.tsx`
- Test: `src/features/pantry/IngredientPicker.test.tsx`

**Interfaces:**
- Produces: `IngredientPicker({ onPick(ingredientId), placeholder, disabledIds?, disabledLabel?, allowCreate? (default true), autoFocus? })` — search box + result list (max 8) + "Create" row; `NewIngredientForm({ open, initialName, onClose, onCreated(ingredient) })`.

- [ ] **Step 1: Write failing test**

`src/features/pantry/IngredientPicker.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { IngredientPicker } from './IngredientPicker';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('IngredientPicker', () => {
  it('searches the catalog and picks a result', async () => {
    const onPick = vi.fn();
    render(<IngredientPicker onPick={onPick} placeholder="Search" />);
    await userEvent.type(screen.getByRole('searchbox'), 'oni');
    await userEvent.click(screen.getByRole('button', { name: /^Onion/ }));
    expect(onPick).toHaveBeenCalledWith('onion');
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
  it('marks disabled ids', async () => {
    render(<IngredientPicker onPick={vi.fn()} placeholder="Search" disabledIds={new Set(['onion'])} disabledLabel="In pantry" />);
    await userEvent.type(screen.getByRole('searchbox'), 'onion');
    expect(screen.getByRole('button', { name: /Onion.*In pantry/ })).toBeDisabled();
  });
  it('creates a new ingredient when there is no exact match', async () => {
    const onPick = vi.fn();
    render(<IngredientPicker onPick={onPick} placeholder="Search" />);
    await userEvent.type(screen.getByRole('searchbox'), 'Dragon fruit');
    await userEvent.click(screen.getByRole('button', { name: 'Create "Dragon fruit"' }));
    expect(screen.getByRole('dialog', { name: 'New ingredient' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name (English)')).toHaveValue('Dragon fruit');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'fruit');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const created = useAppStore.getState().customIngredients[0];
    expect(created).toMatchObject({ name: { en: 'Dragon fruit' }, category: 'fruit', isPreset: false });
    expect(onPick).toHaveBeenCalledWith(created.id);
  });
});
```

Run: `npm test -- IngredientPicker` — Expected: FAIL.

- [ ] **Step 2: Implement**

`src/features/pantry/NewIngredientForm.tsx`:
```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory } from '../../domain/types';
import { useLang, useT } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (ingredient: Ingredient) => void;
}

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';

export function NewIngredientForm({ open, initialName, onClose, onCreated }: Props) {
  const t = useT();
  const lang = useLang();
  const createIngredient = useAppStore((s) => s.createIngredient);
  const [nameJa, setNameJa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('other');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNameJa(lang === 'ja' ? initialName : '');
    setNameEn(lang === 'en' ? initialName : '');
    setCategory('other');
    setError(null);
  }, [open, initialName, lang]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const ja = nameJa.trim();
    const en = nameEn.trim();
    if (!ja && !en) {
      setError(t('ingredient.nameRequired'));
      return;
    }
    const ingredient = createIngredient({
      name: { ...(ja ? { ja } : {}), ...(en ? { en } : {}) },
      category,
    });
    onCreated(ingredient);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('ingredient.newTitle')}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('ingredient.nameJa')}</span>
          <input className={inputClass} value={nameJa} onChange={(e) => setNameJa(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('ingredient.nameEn')}</span>
          <input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('ingredient.category')}</span>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)}>
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`category.${c}`)}</option>
            ))}
          </select>
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Sheet>
  );
}
```

`src/features/pantry/IngredientPicker.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { SearchInput } from '../../components/SearchInput';
import { localize } from '../../domain/localize';
import { hasExactMatch, searchIngredients } from '../../domain/search';
import { useLang, useT } from '../../i18n';
import { useAllIngredients } from '../../store/selectors';
import { NewIngredientForm } from './NewIngredientForm';

interface Props {
  onPick: (ingredientId: string) => void;
  placeholder: string;
  disabledIds?: Set<string>;
  disabledLabel?: string;
  allowCreate?: boolean;
  autoFocus?: boolean;
}

const MAX_RESULTS = 8;

export function IngredientPicker({ onPick, placeholder, disabledIds, disabledLabel, allowCreate = true, autoFocus = false }: Props) {
  const t = useT();
  const lang = useLang();
  const all = useAllIngredients();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const results = useMemo(() => searchIngredients(all, query, MAX_RESULTS), [all, query]);
  const trimmed = query.trim();
  const canCreate = allowCreate && trimmed.length > 0 && !hasExactMatch(all, trimmed);

  const pick = (id: string) => {
    onPick(id);
    setQuery('');
  };

  return (
    <div className="relative">
      <SearchInput value={query} onChange={setQuery} placeholder={placeholder} autoFocus={autoFocus} />
      {trimmed.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm" role="list">
          {results.map((ingredient) => {
            const disabled = disabledIds?.has(ingredient.id) ?? false;
            return (
              <li key={ingredient.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(ingredient.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-stone-50 disabled:cursor-default disabled:text-stone-400"
                >
                  <span>{localize(ingredient.name, lang)}</span>
                  <span className="text-xs text-stone-500">{disabled && disabledLabel ? disabledLabel : t(`category.${ingredient.category}`)}</span>
                </button>
              </li>
            );
          })}
          {results.length === 0 && !canCreate && (
            <li className="px-4 py-2.5 text-sm text-stone-500">{t('ingredient.noResults')}</li>
          )}
          {canCreate && (
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                {t('ingredient.createNew', { name: trimmed })}
              </button>
            </li>
          )}
        </ul>
      )}
      <NewIngredientForm
        open={creating}
        initialName={trimmed}
        onClose={() => setCreating(false)}
        onCreated={(ingredient) => pick(ingredient.id)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run tests, commit**

Run: `npm test -- IngredientPicker` — Expected: PASS.

```bash
git add src/features/pantry
git commit -m "feat(pantry): add ingredient picker with inline ingredient creation"
```

---

### Task 12: Pantry page

**Files:**
- Create: `src/features/pantry/groupPantry.ts`, `src/features/pantry/PantryGroup.tsx`, `src/features/pantry/PantryItemRow.tsx`, `src/features/pantry/PantryItemSheet.tsx`
- Modify: `src/features/pantry/PantryPage.tsx` (replace stub)
- Test: `src/features/pantry/groupPantry.test.ts`, `src/features/pantry/PantryPage.test.tsx`

**Interfaces:**
- Produces: `groupPantryByCategory(pantry, lookup, lang): PantryGroupData[]` where `PantryGroupData = { category, rows: Array<{ item: PantryItem; ingredient?: Ingredient }> }`, rows sorted by localized name; `PantryGroup`, `PantryItemRow({ row, today, onSelect })`, `PantryItemSheet({ ingredientId: string | null, onClose })`, `PantryPage`.

- [ ] **Step 1: Write failing tests**

`src/features/pantry/groupPantry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeIngredient, makePantryItem } from '../../test/factories';
import { groupPantryByCategory } from './groupPantry';

describe('groupPantryByCategory', () => {
  it('groups by category in canonical order, sorts by name, and routes unknowns to other', () => {
    const egg = makeIngredient({ id: 'egg', category: 'egg_dairy', name: { ja: '卵', en: 'Egg' } });
    const onion = makeIngredient({ id: 'onion', category: 'vegetable', name: { ja: '玉ねぎ', en: 'Onion' } });
    const carrot = makeIngredient({ id: 'carrot', category: 'vegetable', name: { ja: 'にんじん', en: 'Carrot' } });
    const lookup = (id: string) => [egg, onion, carrot].find((i) => i.id === id);
    const groups = groupPantryByCategory(
      [makePantryItem('egg'), makePantryItem('onion'), makePantryItem('ghost'), makePantryItem('carrot')],
      lookup,
      'en',
    );
    expect(groups.map((g) => g.category)).toEqual(['vegetable', 'egg_dairy', 'other']);
    expect(groups[0].rows.map((r) => r.item.ingredientId)).toEqual(['carrot', 'onion']);
    expect(groups[2].rows[0].ingredient).toBeUndefined();
  });
});
```

`src/features/pantry/PantryPage.test.tsx`:
```tsx
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
  it('adds an ingredient from search and edits it', async () => {
    renderWithRouter(<PantryPage />);
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    await userEvent.click(screen.getByRole('button', { name: /^Egg/ }));
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['egg']);
    await userEvent.click(screen.getByRole('button', { name: /^Egg/ }));
    const dialog = screen.getByRole('dialog', { name: 'Edit item' });
    await userEvent.type(within(dialog).getByLabelText('Quantity'), '6');
    await userEvent.selectOptions(within(dialog).getByLabelText('Location'), 'fridge');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(useAppStore.getState().pantry[0]).toMatchObject({ quantity: '6', location: 'fridge' });
    expect(screen.getByText('Fridge')).toBeInTheDocument();
  });
  it('removes an item from the edit sheet', async () => {
    useAppStore.getState().addPantryItem('milk');
    renderWithRouter(<PantryPage />);
    await userEvent.click(screen.getByRole('button', { name: /^Milk/ }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    expect(useAppStore.getState().pantry).toHaveLength(0);
  });
});
```

Run: `npm test -- pantry` — Expected: FAIL.

- [ ] **Step 2: Implement grouping**

`src/features/pantry/groupPantry.ts`:
```ts
import { localize } from '../../domain/localize';
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory, type Lang, type PantryItem } from '../../domain/types';

export interface PantryRow {
  item: PantryItem;
  ingredient: Ingredient | undefined;
}

export interface PantryGroupData {
  category: IngredientCategory;
  rows: PantryRow[];
}

export function groupPantryByCategory(
  pantry: PantryItem[],
  lookup: (id: string) => Ingredient | undefined,
  lang: Lang,
): PantryGroupData[] {
  const byCategory = new Map<IngredientCategory, PantryRow[]>();
  for (const item of pantry) {
    const ingredient = lookup(item.ingredientId);
    const category = ingredient?.category ?? 'other';
    const rows = byCategory.get(category) ?? [];
    rows.push({ item, ingredient });
    byCategory.set(category, rows);
  }
  const nameOf = (row: PantryRow) => (row.ingredient ? localize(row.ingredient.name, lang) : row.item.ingredientId);
  return INGREDIENT_CATEGORIES
    .filter((category) => byCategory.has(category))
    .map((category) => ({
      category,
      rows: byCategory.get(category)!.sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang)),
    }));
}
```

- [ ] **Step 3: Implement row, group, sheet, page**

`src/features/pantry/PantryItemRow.tsx`:
```tsx
import { Badge } from '../../components/Badge';
import { daysUntil, expiryStatus } from '../../domain/dates';
import { localize } from '../../domain/localize';
import { useLang, useT } from '../../i18n';
import type { PantryRow } from './groupPantry';

interface Props {
  row: PantryRow;
  today: string;
  onSelect: (ingredientId: string) => void;
}

export function PantryItemRow({ row, today, onSelect }: Props) {
  const t = useT();
  const lang = useLang();
  const { item, ingredient } = row;
  const name = ingredient ? localize(ingredient.name, lang) : t('common.unknownIngredient');
  const status = expiryStatus(item.expiresOn, today);
  const days = item.expiresOn ? daysUntil(item.expiresOn, today) : null;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item.ingredientId)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-stone-50"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-stone-900">{name}</span>
          {item.quantity && <span className="text-xs text-stone-500">{item.quantity}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {item.location && <Badge tone="blue">{t(`location.${item.location}`)}</Badge>}
          {status === 'expired' && <Badge tone="red">{t('pantry.expired')}</Badge>}
          {status === 'soon' && days !== null && (
            <Badge tone="amber">{days === 0 ? t('pantry.expiresToday') : t('pantry.expiresIn', { days })}</Badge>
          )}
        </span>
      </button>
    </li>
  );
}
```

`src/features/pantry/PantryGroup.tsx`:
```tsx
import { useState } from 'react';
import { useT } from '../../i18n';
import type { PantryGroupData } from './groupPantry';
import { PantryItemRow } from './PantryItemRow';

interface Props {
  group: PantryGroupData;
  today: string;
  onSelect: (ingredientId: string) => void;
}

export function PantryGroup({ group, today, onSelect }: Props) {
  const t = useT();
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between bg-stone-100 px-4 py-2 text-left text-sm font-semibold text-stone-700"
        >
          <span>{t(`category.${group.category}`)}</span>
          <span className="text-xs font-normal text-stone-500">{t('pantry.itemCount', { count: group.rows.length })} {open ? '▾' : '▸'}</span>
        </button>
      </h2>
      {open && (
        <ul className="divide-y divide-stone-100">
          {group.rows.map((row) => (
            <PantryItemRow key={row.item.ingredientId} row={row} today={today} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </section>
  );
}
```

`src/features/pantry/PantryItemSheet.tsx`:
```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { STORAGE_LOCATIONS, type StorageLocation } from '../../domain/types';
import { useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  ingredientId: string | null;
  onClose: () => void;
}

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';

export function PantryItemSheet({ ingredientId, onClose }: Props) {
  const t = useT();
  const nameOf = useIngredientName();
  const item = useAppStore((s) => s.pantry.find((p) => p.ingredientId === ingredientId));
  const updatePantryItem = useAppStore((s) => s.updatePantryItem);
  const removePantryItem = useAppStore((s) => s.removePantryItem);
  const [quantity, setQuantity] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [location, setLocation] = useState<StorageLocation | ''>('');

  useEffect(() => {
    setQuantity(item?.quantity ?? '');
    setExpiresOn(item?.expiresOn ?? '');
    setLocation(item?.location ?? '');
  }, [item]);

  if (!ingredientId) return null;

  const save = (event: FormEvent) => {
    event.preventDefault();
    updatePantryItem(ingredientId, {
      quantity: quantity.trim() || undefined,
      expiresOn: expiresOn || undefined,
      location: location || undefined,
    });
    onClose();
  };

  const remove = () => {
    removePantryItem(ingredientId);
    onClose();
  };

  return (
    <Sheet open={item !== undefined} onClose={onClose} title={t('pantry.editItem')}>
      <p className="mb-3 text-base font-semibold">{nameOf(ingredientId)}</p>
      <form onSubmit={save} className="flex flex-col gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.quantity')}</span>
          <input className={inputClass} value={quantity} placeholder={t('pantry.quantityPlaceholder')} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.expiresOn')}</span>
          <input className={inputClass} type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.location')}</span>
          <select className={inputClass} value={location} onChange={(e) => setLocation(e.target.value as StorageLocation | '')}>
            <option value="">{t('pantry.locationNone')}</option>
            {STORAGE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{t(`location.${loc}`)}</option>
            ))}
          </select>
        </label>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Button variant="danger" onClick={remove}>{t('common.remove')}</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}
```

`src/features/pantry/PantryPage.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useToastStore } from '../../components/Toast';
import { todayIso } from '../../domain/dates';
import { useLang, useT } from '../../i18n';
import { useIngredientLookup, usePantryIds } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { groupPantryByCategory } from './groupPantry';
import { IngredientPicker } from './IngredientPicker';
import { PantryGroup } from './PantryGroup';
import { PantryItemSheet } from './PantryItemSheet';

export function PantryPage() {
  const t = useT();
  const lang = useLang();
  const pantry = useAppStore((s) => s.pantry);
  const addPantryItem = useAppStore((s) => s.addPantryItem);
  const addCommonStaples = useAppStore((s) => s.addCommonStaples);
  const showToast = useToastStore((s) => s.show);
  const lookup = useIngredientLookup();
  const pantryIds = usePantryIds();
  const [editing, setEditing] = useState<string | null>(null);
  const today = todayIso();

  const groups = useMemo(() => groupPantryByCategory(pantry, lookup, lang), [pantry, lookup, lang]);

  const handleStaples = () => {
    const count = addCommonStaples();
    showToast(t('pantry.staplesAdded', { count }));
  };

  return (
    <div className="p-4">
      <PageHeader
        title={t('pantry.title')}
        action={pantry.length > 0 ? <Button variant="ghost" size="sm" onClick={handleStaples}>{t('pantry.addStaples')}</Button> : undefined}
      />
      <IngredientPicker
        onPick={(id) => addPantryItem(id)}
        placeholder={t('pantry.searchPlaceholder')}
        disabledIds={pantryIds}
        disabledLabel={t('pantry.inPantry')}
      />
      <div className="mt-4">
        {pantry.length === 0 ? (
          <EmptyState
            title={t('pantry.emptyTitle')}
            body={t('pantry.emptyBody')}
            action={<Button onClick={handleStaples}>{t('pantry.addStaples')}</Button>}
          />
        ) : (
          groups.map((group) => <PantryGroup key={group.category} group={group} today={today} onSelect={setEditing} />)
        )}
      </div>
      <PantryItemSheet ingredientId={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests, commit**

Run: `npm test -- pantry` — Expected: PASS.

```bash
git add src/features/pantry
git commit -m "feat(pantry): add grouped pantry page with add, edit and remove"
```

---

### Task 13: Suggestions page

**Files:**
- Create: `src/features/suggestions/RecipeMatchCard.tsx`, `src/features/suggestions/BuyToUnlockList.tsx`
- Modify: `src/features/suggestions/SuggestionsPage.tsx` (replace stub)
- Test: `src/features/suggestions/SuggestionsPage.test.tsx`

**Interfaces:**
- Consumes: `buildSuggestions`, `useAllRecipes`, `useIngredientName`, store `servings`, `almostThreshold`, `addToShopping`.
- Produces: `RecipeMatchCard({ match, onAddToShopping })`, `BuyToUnlockList({ entries, onAddToShopping })`, `SuggestionsPage`.

- [ ] **Step 1: Write failing test**

`src/features/suggestions/SuggestionsPage.test.tsx`:
```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { SuggestionsPage } from './SuggestionsPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

function stock(...ids: string[]) {
  for (const id of ids) useAppStore.getState().addPantryItem(id);
}

describe('SuggestionsPage', () => {
  it('lists ready and almost recipes from the pantry', async () => {
    // Tamagoyaki needs egg, sugar, soy-sauce, dashi-granules, cooking-oil.
    stock('egg', 'sugar', 'soy-sauce', 'dashi-granules', 'cooking-oil');
    renderWithRouter(<SuggestionsPage />);
    const ready = screen.getByRole('region', { name: 'Ready to cook' });
    expect(within(ready).getByText('Tamagoyaki (rolled omelette)')).toBeInTheDocument();
    // Spinach goma-ae needs spinach, sesame-seeds, soy-sauce, sugar -> missing 2 -> almost.
    const almost = screen.getByRole('region', { name: 'Almost there' });
    expect(within(almost).getByText('Spinach with sesame dressing')).toBeInTheDocument();
  });
  it('adds a missing ingredient to the shopping list from the buy-to-unlock section', async () => {
    stock('egg', 'sugar', 'soy-sauce', 'dashi-granules', 'cooking-oil', 'spinach');
    renderWithRouter(<SuggestionsPage />);
    const buy = screen.getByRole('region', { name: 'Buy this, unlock that' });
    const row = within(buy).getByText('Toasted sesame seeds').closest('li')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Add to shopping list' }));
    expect(useAppStore.getState().shoppingList.map((i) => i.ingredientId)).toEqual(['sesame-seeds']);
  });
  it('changes servings and filters by cuisine', async () => {
    stock('egg', 'sugar', 'soy-sauce', 'dashi-granules', 'cooking-oil');
    renderWithRouter(<SuggestionsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'More servings' }));
    expect(useAppStore.getState().servings).toBe(3);
    await userEvent.click(screen.getByRole('button', { name: 'Western' }));
    expect(screen.queryByText('Tamagoyaki (rolled omelette)')).not.toBeInTheDocument();
  });
});
```

Run: `npm test -- Suggestions` — Expected: FAIL.

- [ ] **Step 2: Implement**

`src/features/suggestions/RecipeMatchCard.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { localize } from '../../domain/localize';
import type { RecipeMatch } from '../../domain/matching';
import { useLang, useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';

interface Props {
  match: RecipeMatch;
  onAddToShopping: (ingredientId: string) => void;
}

export function RecipeMatchCard({ match, onAddToShopping }: Props) {
  const t = useT();
  const lang = useLang();
  const nameOf = useIngredientName();
  const { recipe } = match;
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-3">
      <Link to={`/recipes/${recipe.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <span className="text-base font-semibold text-stone-900">{localize(recipe.name, lang)}</span>
          {recipe.timeMinutes !== undefined && <span className="shrink-0 text-xs text-stone-500">{t('recipes.minutes', { count: recipe.timeMinutes })}</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge>{t(`cuisine.${recipe.cuisine}`)}</Badge>
          <Badge>{t(`recipeCategory.${recipe.category}`)}</Badge>
          {match.usesExpiring.length > 0 && <Badge tone="amber">{t('suggestions.usesExpiring')}</Badge>}
          {match.missingRequired.length > 0 && <Badge tone="red">{t('suggestions.missingCount', { count: match.missingRequired.length })}</Badge>}
        </div>
      </Link>
      {match.missingRequired.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {match.missingRequired.map((id) => (
            <li key={id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-stone-700">{nameOf(id)}</span>
              <Button variant="ghost" size="sm" onClick={() => onAddToShopping(id)}>+ {t('suggestions.addToShopping')}</Button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
```

`src/features/suggestions/BuyToUnlockList.tsx`:
```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { localize } from '../../domain/localize';
import type { BuyToUnlock } from '../../domain/matching';
import { useLang, useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';

interface Props {
  entries: BuyToUnlock[];
  onAddToShopping: (ingredientId: string) => void;
}

export function BuyToUnlockList({ entries, onAddToShopping }: Props) {
  const t = useT();
  const lang = useLang();
  const nameOf = useIngredientName();
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => {
        const isOpen = expanded === entry.ingredientId;
        return (
          <li key={entry.ingredientId} className="rounded-xl border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : entry.ingredientId)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-base font-semibold text-stone-900">{nameOf(entry.ingredientId)}</span>
                <span className="text-xs text-stone-600">
                  {t('suggestions.unlocks', { count: entry.unlocks.length })} · {t('suggestions.helps', { count: entry.helps.length })}
                </span>
              </button>
              <Button variant="ghost" size="sm" onClick={() => onAddToShopping(entry.ingredientId)}>+ {t('suggestions.addToShopping')}</Button>
            </div>
            {isOpen && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {[...entry.unlocks, ...entry.helps].map((recipe) => (
                  <li key={recipe.id}>
                    <Link to={`/recipes/${recipe.id}`} className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 hover:bg-stone-200">
                      {localize(recipe.name, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

`src/features/suggestions/SuggestionsPage.tsx`:
```tsx
import { useMemo, useState, type ReactNode } from 'react';
import { Chip } from '../../components/Chip';
import { PageHeader } from '../../components/PageHeader';
import { ServingsStepper } from '../../components/ServingsStepper';
import { useToastStore } from '../../components/Toast';
import { todayIso } from '../../domain/dates';
import { buildSuggestions } from '../../domain/matching';
import { CUISINES, type Cuisine } from '../../domain/types';
import { useT } from '../../i18n';
import { useAllRecipes } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { BuyToUnlockList } from './BuyToUnlockList';
import { RecipeMatchCard } from './RecipeMatchCard';

function Section({ title, empty, children }: { title: string; empty: string | null; children: ReactNode }) {
  return (
    <section aria-label={title} className="mb-6">
      <h2 className="mb-2 text-base font-semibold text-stone-800">{title}</h2>
      {empty ? <p className="text-sm text-stone-500">{empty}</p> : children}
    </section>
  );
}

export function SuggestionsPage() {
  const t = useT();
  const recipes = useAllRecipes();
  const pantry = useAppStore((s) => s.pantry);
  const servings = useAppStore((s) => s.servings);
  const setServings = useAppStore((s) => s.setServings);
  const almostThreshold = useAppStore((s) => s.almostThreshold);
  const addToShopping = useAppStore((s) => s.addToShopping);
  const showToast = useToastStore((s) => s.show);
  const [cuisine, setCuisine] = useState<Cuisine | 'all'>('all');
  const today = todayIso();

  const suggestions = useMemo(() => {
    const filtered = cuisine === 'all' ? recipes : recipes.filter((r) => r.cuisine === cuisine);
    return buildSuggestions(filtered, pantry, { almostThreshold, today });
  }, [recipes, pantry, almostThreshold, cuisine, today]);

  const handleAdd = (ingredientId: string) => {
    addToShopping(ingredientId);
    showToast(t('suggestions.addedToShopping'));
  };

  return (
    <div className="p-4">
      <PageHeader title={t('suggestions.title')} action={<ServingsStepper value={servings} onChange={setServings} />} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Chip selected={cuisine === 'all'} onClick={() => setCuisine('all')}>{t('suggestions.filterAll')}</Chip>
        {CUISINES.map((c) => (
          <Chip key={c} selected={cuisine === c} onClick={() => setCuisine(c)}>{t(`cuisine.${c}`)}</Chip>
        ))}
      </div>

      <Section title={t('suggestions.ready')} empty={suggestions.ready.length === 0 ? t('suggestions.readyEmpty') : null}>
        <ul className="flex flex-col gap-2">
          {suggestions.ready.map((match) => <RecipeMatchCard key={match.recipe.id} match={match} onAddToShopping={handleAdd} />)}
        </ul>
      </Section>

      <Section title={t('suggestions.almost')} empty={suggestions.almost.length === 0 ? t('suggestions.almostEmpty') : null}>
        <ul className="flex flex-col gap-2">
          {suggestions.almost.map((match) => <RecipeMatchCard key={match.recipe.id} match={match} onAddToShopping={handleAdd} />)}
        </ul>
      </Section>

      <Section title={t('suggestions.buyToUnlock')} empty={suggestions.buyToUnlock.length === 0 ? t('suggestions.buyEmpty') : null}>
        <BuyToUnlockList entries={suggestions.buyToUnlock} onAddToShopping={handleAdd} />
      </Section>
    </div>
  );
}
```

- [ ] **Step 3: Run tests, commit**

Run: `npm test -- Suggestions` — Expected: PASS.

```bash
git add src/features/suggestions
git commit -m "feat(suggestions): add ready, almost and buy-to-unlock sections with servings and cuisine filter"
```

---

### Task 14: Recipes list and detail pages

**Files:**
- Modify: `src/features/recipes/RecipesPage.tsx`, `src/features/recipes/RecipeDetailPage.tsx` (replace stubs)
- Test: `src/features/recipes/RecipesPage.test.tsx`, `src/features/recipes/RecipeDetailPage.test.tsx`

**Interfaces:**
- Consumes: `useAllRecipes`, `useRecipe`, `usePantryIds`, `useIngredientName`, `formatIngredientAmount`, `localize`, `localizeList`, `normalizeForSearch`, store actions `setServings`, `addToShopping`, `duplicateRecipe`, `deleteCustomRecipe`.
- Produces: `RecipesPage`, `RecipeDetailPage`.

- [ ] **Step 1: Write failing tests**

`src/features/recipes/RecipesPage.test.tsx`:
```tsx
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
      name: { en: 'My stew' }, cuisine: 'other', category: 'main', baseServings: 2,
      ingredients: [{ ingredientId: 'egg' }], steps: { en: ['Cook'] },
    });
    renderWithRouter(<RecipesPage />);
    expect(screen.getByRole('link', { name: /My stew.*Custom/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New recipe' })).toHaveAttribute('href', '/recipes/new');
  });
});
```

`src/features/recipes/RecipeDetailPage.test.tsx`:
```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { RecipeDetailPage } from './RecipeDetailPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

const render = (id: string) => renderWithRouter(<RecipeDetailPage />, { route: `/recipes/${id}`, path: '/recipes/:id' });

describe('RecipeDetailPage', () => {
  it('scales ingredient amounts with the servings stepper', async () => {
    render('teriyaki-chicken');
    expect(screen.getByText('300 g')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More servings' }));
    expect(screen.getByText('450 g')).toBeInTheDocument();
  });
  it('marks have and missing ingredients and adds missing to shopping', async () => {
    useAppStore.getState().addPantryItem('chicken-thigh');
    render('teriyaki-chicken');
    const list = screen.getByRole('list', { name: 'Ingredients' });
    expect(within(list).getAllByText('Have')).toHaveLength(1);
    expect(within(list).getAllByText('Missing')).toHaveLength(5);
    await userEvent.click(screen.getByRole('button', { name: 'Add missing to shopping list' }));
    expect(useAppStore.getState().shoppingList).toHaveLength(5);
  });
  it('duplicates a preset into a custom recipe', async () => {
    render('teriyaki-chicken');
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate & edit' }));
    expect(useAppStore.getState().customRecipes[0].name.en).toBe('Teriyaki chicken (copy)');
  });
  it('deletes a custom recipe after confirmation', async () => {
    const created = useAppStore.getState().addCustomRecipe({
      name: { en: 'Mine' }, cuisine: 'other', category: 'main', baseServings: 2,
      ingredients: [{ ingredientId: 'egg' }], steps: { en: ['Cook'] },
    });
    render(created.id);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(useAppStore.getState().customRecipes).toHaveLength(0);
  });
  it('shows not found for unknown ids', () => {
    render('nope');
    expect(screen.getByText('Recipe not found.')).toBeInTheDocument();
  });
});
```

Run: `npm test -- recipes` — Expected: FAIL.

- [ ] **Step 2: Implement RecipesPage**

`src/features/recipes/RecipesPage.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { localize } from '../../domain/localize';
import { normalizeForSearch } from '../../domain/search';
import { CUISINES, type Cuisine } from '../../domain/types';
import { useLang, useT } from '../../i18n';
import { useAllRecipes } from '../../store/selectors';

export function RecipesPage() {
  const t = useT();
  const lang = useLang();
  const recipes = useAllRecipes();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | 'all'>('all');

  const visible = useMemo(() => {
    const q = normalizeForSearch(query);
    return recipes.filter((recipe) => {
      if (cuisine !== 'all' && recipe.cuisine !== cuisine) return false;
      if (!q) return true;
      return [recipe.name.ja, recipe.name.en].some((name) => name && normalizeForSearch(name).includes(q));
    });
  }, [recipes, query, cuisine]);

  return (
    <div className="p-4">
      <PageHeader
        title={t('recipes.title')}
        action={<Link to="/recipes/new" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">{t('recipes.new')}</Link>}
      />
      <SearchInput value={query} onChange={setQuery} placeholder={t('recipes.searchPlaceholder')} />
      <div className="my-3 flex gap-2 overflow-x-auto pb-1">
        <Chip selected={cuisine === 'all'} onClick={() => setCuisine('all')}>{t('suggestions.filterAll')}</Chip>
        {CUISINES.map((c) => (
          <Chip key={c} selected={cuisine === c} onClick={() => setCuisine(c)}>{t(`cuisine.${c}`)}</Chip>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-stone-500">{t('recipes.empty')}</p>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {visible.map((recipe) => (
            <li key={recipe.id}>
              <Link to={`/recipes/${recipe.id}`} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-stone-50">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-stone-900">{localize(recipe.name, lang)}</span>
                  <span className="text-xs text-stone-500">
                    {t(`cuisine.${recipe.cuisine}`)} · {t(`recipeCategory.${recipe.category}`)}
                    {recipe.timeMinutes !== undefined && ` · ${t('recipes.minutes', { count: recipe.timeMinutes })}`}
                  </span>
                </span>
                {!recipe.isPreset && <Badge tone="green">{t('recipes.custom')}</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement RecipeDetailPage**

`src/features/recipes/RecipeDetailPage.tsx`:
```tsx
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { ServingsStepper } from '../../components/ServingsStepper';
import { useToastStore } from '../../components/Toast';
import { localize, localizeList } from '../../domain/localize';
import { formatIngredientAmount } from '../../domain/scaling';
import { useLang, useT } from '../../i18n';
import { useIngredientName, usePantryIds, useRecipe } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const recipe = useRecipe(id);
  const pantryIds = usePantryIds();
  const nameOf = useIngredientName();
  const servings = useAppStore((s) => s.servings);
  const setServings = useAppStore((s) => s.setServings);
  const addToShopping = useAppStore((s) => s.addToShopping);
  const duplicateRecipe = useAppStore((s) => s.duplicateRecipe);
  const deleteCustomRecipe = useAppStore((s) => s.deleteCustomRecipe);
  const showToast = useToastStore((s) => s.show);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!recipe) {
    return (
      <div className="p-4">
        <PageHeader title={t('recipes.title')} backTo="/recipes" />
        <p className="text-sm text-stone-600">{t('recipe.notFound')}</p>
      </div>
    );
  }

  const missing = recipe.ingredients.filter((ri) => !ri.optional && !pantryIds.has(ri.ingredientId)).map((ri) => ri.ingredientId);
  const steps = localizeList(recipe.steps, lang);

  const addMissing = () => {
    for (const ingredientId of missing) addToShopping(ingredientId);
    showToast(t('suggestions.addedToShopping'));
  };
  const duplicate = () => {
    const copy = duplicateRecipe(recipe);
    navigate(`/recipes/${copy.id}/edit`);
  };
  const remove = () => {
    deleteCustomRecipe(recipe.id);
    navigate('/recipes');
  };

  return (
    <div className="p-4">
      <PageHeader title={localize(recipe.name, lang)} backTo="/recipes" />
      <div className="mb-3 flex flex-wrap items-center gap-1">
        <Badge>{t(`cuisine.${recipe.cuisine}`)}</Badge>
        <Badge>{t(`recipeCategory.${recipe.category}`)}</Badge>
        {recipe.timeMinutes !== undefined && <Badge>{t('recipes.minutes', { count: recipe.timeMinutes })}</Badge>}
        {!recipe.isPreset && <Badge tone="green">{t('recipes.custom')}</Badge>}
      </div>
      {recipe.description && <p className="mb-4 text-sm text-stone-700">{localize(recipe.description, lang)}</p>}

      <div className="mb-4">
        <ServingsStepper value={servings} onChange={setServings} />
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">{t('recipe.ingredients')}</h2>
        <ul aria-label={t('recipe.ingredients')} className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {recipe.ingredients.map((ri) => {
            const have = pantryIds.has(ri.ingredientId);
            return (
              <li key={ri.ingredientId} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">
                    {nameOf(ri.ingredientId)}
                    {ri.optional && <span className="ml-1 text-xs text-stone-500">({t('common.optional')})</span>}
                  </span>
                  {ri.amount !== undefined && ri.note && <span className="text-xs text-stone-500">{localize(ri.note, lang)}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-stone-700">{formatIngredientAmount(ri, recipe.baseServings, servings, lang, t)}</span>
                  {have ? <Badge tone="green">{t('recipe.have')}</Badge> : <Badge tone={ri.optional ? 'neutral' : 'red'}>{t('recipe.missing')}</Badge>}
                </span>
              </li>
            );
          })}
        </ul>
        {missing.length > 0 && (
          <div className="mt-2">
            <Button variant="secondary" size="sm" onClick={addMissing}>{t('recipe.addMissingToShopping')}</Button>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">{t('recipe.steps')}</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-stone-800">
          {steps.map((step, index) => <li key={index}>{step}</li>)}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        {recipe.isPreset ? (
          <Button variant="secondary" onClick={duplicate}>{t('recipe.duplicate')}</Button>
        ) : (
          <>
            <Link to={`/recipes/${recipe.id}/edit`} className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100">{t('common.edit')}</Link>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>{t('common.delete')}</Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={t('recipe.deleteConfirmTitle')}
        body={t('recipe.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests, commit**

Run: `npm test -- recipes` — Expected: PASS.

```bash
git add src/features/recipes
git commit -m "feat(recipes): add recipe list with search and scaled detail view"
```

---

### Task 15: Recipe form

**Files:**
- Create: `src/features/recipes/recipeDraft.ts`
- Modify: `src/features/recipes/RecipeFormPage.tsx` (replace stub)
- Test: `src/features/recipes/recipeDraft.test.ts`, `src/features/recipes/RecipeFormPage.test.tsx`

**Interfaces:**
- Produces: `RecipeDraft`, `DraftIngredient`, `emptyDraft()`, `draftFromRecipe(recipe)`, `recipeFromDraft(draft): { recipe: RecipeInput } | { errors: RecipeDraftError[] }`, `RecipeDraftError = 'name' | 'ingredients' | 'steps' | 'servings'`; `RecipeFormPage` (new at `/recipes/new`, edit at `/recipes/:id/edit`).

- [ ] **Step 1: Write failing tests**

`src/features/recipes/recipeDraft.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../../test/factories';
import { draftFromRecipe, emptyDraft, recipeFromDraft } from './recipeDraft';

describe('recipeDraft', () => {
  it('round-trips a recipe through a draft', () => {
    const recipe = makeRecipe({
      name: { ja: '卵焼き', en: 'Tamagoyaki' },
      description: { ja: '甘い', en: 'Sweet' },
      timeMinutes: 10,
      ingredients: [{ ingredientId: 'egg', amount: 3, unit: 'pcs' }, { ingredientId: 'salt', optional: true }],
      steps: { ja: ['混ぜる', '焼く'], en: ['Mix', 'Cook'] },
    });
    const result = recipeFromDraft(draftFromRecipe(recipe));
    expect('recipe' in result && result.recipe).toEqual({
      name: { ja: '卵焼き', en: 'Tamagoyaki' },
      description: { ja: '甘い', en: 'Sweet' },
      cuisine: 'japanese',
      category: 'main',
      baseServings: 2,
      timeMinutes: 10,
      ingredients: [{ ingredientId: 'egg', amount: 3, unit: 'pcs' }, { ingredientId: 'salt', optional: true }],
      steps: { ja: ['混ぜる', '焼く'], en: ['Mix', 'Cook'] },
    });
  });
  it('reports every validation error', () => {
    const result = recipeFromDraft({ ...emptyDraft(), baseServings: '0' });
    expect('errors' in result && result.errors).toEqual(['name', 'ingredients', 'steps', 'servings']);
  });
  it('drops blank optional fields and blank step lines', () => {
    const draft = {
      ...emptyDraft(),
      nameEn: 'Toast',
      timeMinutes: '',
      ingredients: [{ ingredientId: 'bread', amount: '', unit: '' as const, optional: false }],
      stepsEn: 'Toast it\n\n  \nEat',
    };
    const result = recipeFromDraft(draft);
    expect('recipe' in result && result.recipe).toEqual({
      name: { en: 'Toast' },
      cuisine: 'japanese',
      category: 'main',
      baseServings: 2,
      ingredients: [{ ingredientId: 'bread' }],
      steps: { en: ['Toast it', 'Eat'] },
    });
  });
});
```

`src/features/recipes/RecipeFormPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { RecipeFormPage } from './RecipeFormPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('RecipeFormPage', () => {
  it('shows validation errors and then saves a new recipe', async () => {
    renderWithRouter(<RecipeFormPage />, { route: '/recipes/new', path: '/recipes/new' });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a name in at least one language.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name (English)'), 'Egg on rice');
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    await userEvent.click(screen.getByRole('button', { name: /^Egg/ }));
    await userEvent.type(screen.getByLabelText('Amount'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Unit'), 'pcs');
    await userEvent.type(screen.getByLabelText('Steps (English, one per line)'), 'Crack egg over rice');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const saved = useAppStore.getState().customRecipes[0];
    expect(saved).toMatchObject({ name: { en: 'Egg on rice' }, ingredients: [{ ingredientId: 'egg', amount: 1, unit: 'pcs' }], steps: { en: ['Crack egg over rice'] } });
  });
  it('edits an existing custom recipe', async () => {
    const created = useAppStore.getState().addCustomRecipe({
      name: { en: 'Mine' }, cuisine: 'other', category: 'main', baseServings: 2,
      ingredients: [{ ingredientId: 'egg' }], steps: { en: ['Cook'] },
    });
    renderWithRouter(<RecipeFormPage />, { route: `/recipes/${created.id}/edit`, path: '/recipes/:id/edit' });
    expect(screen.getByRole('heading', { name: 'Edit recipe' })).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Name (English)'));
    await userEvent.type(screen.getByLabelText('Name (English)'), 'Renamed');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(useAppStore.getState().customRecipes[0].name.en).toBe('Renamed');
  });
});
```

Run: `npm test -- recipeDraft RecipeForm` — Expected: FAIL.

- [ ] **Step 2: Implement draft helpers**

`src/features/recipes/recipeDraft.ts`:
```ts
import type { Cuisine, LocalizedText, Recipe, RecipeCategory, RecipeIngredient, Unit } from '../../domain/types';
import type { RecipeInput } from '../../store/useAppStore';

export interface DraftIngredient {
  ingredientId: string;
  amount: string;
  unit: Unit | '';
  optional: boolean;
}

export interface RecipeDraft {
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  descriptionEn: string;
  cuisine: Cuisine;
  category: RecipeCategory;
  baseServings: string;
  timeMinutes: string;
  ingredients: DraftIngredient[];
  stepsJa: string;
  stepsEn: string;
}

export type RecipeDraftError = 'name' | 'ingredients' | 'steps' | 'servings';

export function emptyDraft(): RecipeDraft {
  return {
    nameJa: '', nameEn: '', descriptionJa: '', descriptionEn: '',
    cuisine: 'japanese', category: 'main', baseServings: '2', timeMinutes: '',
    ingredients: [], stepsJa: '', stepsEn: '',
  };
}

export function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return {
    nameJa: recipe.name.ja ?? '',
    nameEn: recipe.name.en ?? '',
    descriptionJa: recipe.description?.ja ?? '',
    descriptionEn: recipe.description?.en ?? '',
    cuisine: recipe.cuisine,
    category: recipe.category,
    baseServings: String(recipe.baseServings),
    timeMinutes: recipe.timeMinutes === undefined ? '' : String(recipe.timeMinutes),
    ingredients: recipe.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId,
      amount: ri.amount === undefined ? '' : String(ri.amount),
      unit: ri.unit ?? '',
      optional: ri.optional ?? false,
    })),
    stepsJa: (recipe.steps.ja ?? []).join('\n'),
    stepsEn: (recipe.steps.en ?? []).join('\n'),
  };
}

function localized(ja: string, en: string): LocalizedText | undefined {
  const j = ja.trim();
  const e = en.trim();
  if (!j && !e) return undefined;
  return { ...(j ? { ja: j } : {}), ...(e ? { en: e } : {}) };
}

function lines(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
}

export function recipeFromDraft(draft: RecipeDraft): { recipe: RecipeInput } | { errors: RecipeDraftError[] } {
  const errors: RecipeDraftError[] = [];
  const name = localized(draft.nameJa, draft.nameEn);
  if (!name) errors.push('name');
  if (draft.ingredients.length === 0) errors.push('ingredients');
  const stepsJa = lines(draft.stepsJa);
  const stepsEn = lines(draft.stepsEn);
  if (stepsJa.length === 0 && stepsEn.length === 0) errors.push('steps');
  const baseServings = Number(draft.baseServings);
  if (!Number.isFinite(baseServings) || baseServings < 1) errors.push('servings');
  if (errors.length > 0 || !name) return { errors };

  const timeMinutes = Number(draft.timeMinutes);
  const description = localized(draft.descriptionJa, draft.descriptionEn);
  const ingredients: RecipeIngredient[] = draft.ingredients.map((di) => {
    const amount = Number(di.amount);
    return {
      ingredientId: di.ingredientId,
      ...(di.amount.trim() && Number.isFinite(amount) && amount > 0 ? { amount } : {}),
      ...(di.unit ? { unit: di.unit } : {}),
      ...(di.optional ? { optional: true } : {}),
    };
  });
  return {
    recipe: {
      name,
      ...(description ? { description } : {}),
      cuisine: draft.cuisine,
      category: draft.category,
      baseServings: Math.round(baseServings),
      ...(draft.timeMinutes.trim() && Number.isFinite(timeMinutes) && timeMinutes > 0 ? { timeMinutes: Math.round(timeMinutes) } : {}),
      ingredients,
      steps: { ...(stepsJa.length ? { ja: stepsJa } : {}), ...(stepsEn.length ? { en: stepsEn } : {}) },
    },
  };
}
```

- [ ] **Step 3: Implement the form page**

`src/features/recipes/RecipeFormPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { CUISINES, RECIPE_CATEGORIES, UNITS, type Cuisine, type RecipeCategory, type Unit } from '../../domain/types';
import { useT, type TranslationKey } from '../../i18n';
import { useIngredientName, useRecipe } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { IngredientPicker } from '../pantry/IngredientPicker';
import { draftFromRecipe, emptyDraft, recipeFromDraft, type DraftIngredient, type RecipeDraft, type RecipeDraftError } from './recipeDraft';

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';
const ERROR_KEY: Record<RecipeDraftError, TranslationKey> = {
  name: 'recipeForm.errorName',
  ingredients: 'recipeForm.errorIngredients',
  steps: 'recipeForm.errorSteps',
  servings: 'recipeForm.errorServings',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone-600">{label}</span>
      {children}
    </label>
  );
}

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const navigate = useNavigate();
  const existing = useRecipe(id);
  const nameOf = useIngredientName();
  const addCustomRecipe = useAppStore((s) => s.addCustomRecipe);
  const updateCustomRecipe = useAppStore((s) => s.updateCustomRecipe);
  const [draft, setDraft] = useState<RecipeDraft>(() => (existing && !existing.isPreset ? draftFromRecipe(existing) : emptyDraft()));
  const [errors, setErrors] = useState<RecipeDraftError[]>([]);
  const isEdit = Boolean(existing && !existing.isPreset);

  const patch = (changes: Partial<RecipeDraft>) => setDraft((d) => ({ ...d, ...changes }));
  const patchIngredient = (index: number, changes: Partial<DraftIngredient>) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.map((ri, i) => (i === index ? { ...ri, ...changes } : ri)) }));
  const addIngredient = (ingredientId: string) =>
    setDraft((d) => (d.ingredients.some((ri) => ri.ingredientId === ingredientId) ? d : { ...d, ingredients: [...d.ingredients, { ingredientId, amount: '', unit: '', optional: false }] }));
  const removeIngredient = (index: number) => setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, i) => i !== index) }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = recipeFromDraft(draft);
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }
    if (isEdit && existing) {
      updateCustomRecipe(existing.id, result.recipe);
      navigate(`/recipes/${existing.id}`);
    } else {
      const created = addCustomRecipe(result.recipe);
      navigate(`/recipes/${created.id}`);
    }
  };

  return (
    <div className="p-4">
      <PageHeader title={isEdit ? t('recipeForm.editTitle') : t('recipeForm.newTitle')} backTo={isEdit && existing ? `/recipes/${existing.id}` : '/recipes'} />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('recipeForm.nameJa')}><input className={inputClass} value={draft.nameJa} onChange={(e) => patch({ nameJa: e.target.value })} /></Field>
          <Field label={t('recipeForm.nameEn')}><input className={inputClass} value={draft.nameEn} onChange={(e) => patch({ nameEn: e.target.value })} /></Field>
          <Field label={t('recipeForm.descriptionJa')}><input className={inputClass} value={draft.descriptionJa} onChange={(e) => patch({ descriptionJa: e.target.value })} /></Field>
          <Field label={t('recipeForm.descriptionEn')}><input className={inputClass} value={draft.descriptionEn} onChange={(e) => patch({ descriptionEn: e.target.value })} /></Field>
          <Field label={t('recipeForm.cuisine')}>
            <select className={inputClass} value={draft.cuisine} onChange={(e) => patch({ cuisine: e.target.value as Cuisine })}>
              {CUISINES.map((c) => <option key={c} value={c}>{t(`cuisine.${c}`)}</option>)}
            </select>
          </Field>
          <Field label={t('recipeForm.category')}>
            <select className={inputClass} value={draft.category} onChange={(e) => patch({ category: e.target.value as RecipeCategory })}>
              {RECIPE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`recipeCategory.${c}`)}</option>)}
            </select>
          </Field>
          <Field label={t('recipeForm.baseServings')}><input className={inputClass} type="number" min={1} value={draft.baseServings} onChange={(e) => patch({ baseServings: e.target.value })} /></Field>
          <Field label={t('recipeForm.timeMinutes')}><input className={inputClass} type="number" min={1} value={draft.timeMinutes} onChange={(e) => patch({ timeMinutes: e.target.value })} /></Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t('recipeForm.ingredients')}</legend>
          <IngredientPicker onPick={addIngredient} placeholder={t('recipeForm.addIngredientPlaceholder')} />
          <ul className="mt-2 flex flex-col gap-2">
            {draft.ingredients.map((ri, index) => (
              <li key={ri.ingredientId} className="rounded-xl border border-stone-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{nameOf(ri.ingredientId)}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeIngredient(index)}>{t('common.remove')}</Button>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <Field label={t('recipeForm.amount')}>
                    <input className={inputClass} type="number" min={0} step="any" value={ri.amount} onChange={(e) => patchIngredient(index, { amount: e.target.value })} />
                  </Field>
                  <Field label={t('recipeForm.unit')}>
                    <select className={inputClass} value={ri.unit} onChange={(e) => patchIngredient(index, { unit: e.target.value as Unit | '' })}>
                      <option value="">{t('recipeForm.noUnit')}</option>
                      {UNITS.map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
                    </select>
                  </Field>
                  <label className="flex items-center gap-1 pb-2 text-sm">
                    <input type="checkbox" checked={ri.optional} onChange={(e) => patchIngredient(index, { optional: e.target.checked })} />
                    {t('recipeForm.optional')}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </fieldset>

        <Field label={t('recipeForm.stepsJa')}><textarea className={inputClass} rows={5} value={draft.stepsJa} onChange={(e) => patch({ stepsJa: e.target.value })} /></Field>
        <Field label={t('recipeForm.stepsEn')}><textarea className={inputClass} rows={5} value={draft.stepsEn} onChange={(e) => patch({ stepsEn: e.target.value })} /></Field>

        {errors.length > 0 && (
          <ul role="alert" className="flex flex-col gap-1 text-sm text-red-700">
            {errors.map((error) => <li key={error}>{t(ERROR_KEY[error])}</li>)}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}
```

Note: the only place `ingredientId` uniqueness matters within a recipe is this form, which refuses duplicates.

- [ ] **Step 4: Run tests, commit**

Run: `npm test -- recipe` — Expected: PASS.

```bash
git add src/features/recipes
git commit -m "feat(recipes): add bilingual recipe form for creating and editing custom recipes"
```

---

### Task 16: Shopping page

**Files:**
- Modify: `src/features/shopping/ShoppingPage.tsx` (replace stub)
- Test: `src/features/shopping/ShoppingPage.test.tsx`

- [ ] **Step 1: Write failing test**

`src/features/shopping/ShoppingPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { ShoppingPage } from './ShoppingPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('ShoppingPage', () => {
  it('shows the empty state, adds via search, buys and removes', async () => {
    renderWithRouter(<ShoppingPage />);
    expect(screen.getByText('Your shopping list is empty.')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'milk');
    await userEvent.click(screen.getByRole('button', { name: /^Milk/ }));
    await userEvent.type(screen.getByRole('searchbox'), 'egg');
    await userEvent.click(screen.getByRole('button', { name: /^Egg/ }));
    expect(useAppStore.getState().shoppingList).toHaveLength(2);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mark as bought' + ' Milk' }));
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['milk']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Egg' }));
    expect(useAppStore.getState().shoppingList).toHaveLength(0);
  });
});
```

Run: `npm test -- Shopping` — Expected: FAIL.

- [ ] **Step 2: Implement**

`src/features/shopping/ShoppingPage.tsx`:
```tsx
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useToastStore } from '../../components/Toast';
import { useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { IngredientPicker } from '../pantry/IngredientPicker';

export function ShoppingPage() {
  const t = useT();
  const nameOf = useIngredientName();
  const shoppingList = useAppStore((s) => s.shoppingList);
  const addToShopping = useAppStore((s) => s.addToShopping);
  const removeFromShopping = useAppStore((s) => s.removeFromShopping);
  const markBought = useAppStore((s) => s.markBought);
  const showToast = useToastStore((s) => s.show);
  const listedIds = new Set(shoppingList.map((item) => item.ingredientId));

  const buy = (ingredientId: string) => {
    markBought(ingredientId);
    showToast(t('shopping.bought'));
  };

  return (
    <div className="p-4">
      <PageHeader title={t('shopping.title')} />
      <IngredientPicker onPick={addToShopping} placeholder={t('shopping.searchPlaceholder')} disabledIds={listedIds} />
      <div className="mt-4">
        {shoppingList.length === 0 ? (
          <EmptyState title={t('shopping.title')} body={t('shopping.empty')} />
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
            {shoppingList.map((item) => {
              const name = nameOf(item.ingredientId);
              return (
                <li key={item.ingredientId} className="flex items-center justify-between gap-2 px-4 py-3">
                  <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-emerald-600"
                      aria-label={`${t('shopping.markBought')} ${name}`}
                      checked={false}
                      onChange={() => buy(item.ingredientId)}
                    />
                    <span className="truncate">{name}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`${t('common.remove')} ${name}`}
                    onClick={() => removeFromShopping(item.ingredientId)}
                    className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests, commit**

Run: `npm test -- Shopping` — Expected: PASS.

```bash
git add src/features/shopping
git commit -m "feat(shopping): add shopping list with buy-to-pantry"
```

---

### Task 17: Settings page

**Files:**
- Modify: `src/features/settings/SettingsPage.tsx` (replace stub)
- Test: `src/features/settings/SettingsPage.test.tsx`

- [ ] **Step 1: Write failing test**

`src/features/settings/SettingsPage.test.tsx`:
```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(useAppStore.getState().almostThreshold).toBe(3);
  });
  it('exports a JSON file', async () => {
    const spy = vi.spyOn(exportImport, 'downloadTextFile').mockImplementation(() => {});
    renderWithRouter(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^grocery-manager-\d{4}-\d{2}-\d{2}\.json$/), expect.stringContaining('"schemaVersion": 1'));
    spy.mockRestore();
  });
  it('imports a valid file after confirmation and rejects an invalid one', async () => {
    renderWithRouter(<SettingsPage />);
    const input = screen.getByLabelText('Import JSON') as HTMLInputElement;
    const good = new File([JSON.stringify({ ...defaultPersistedState('en'), pantry: [{ ingredientId: 'egg', addedOn: '2026-09-18' }] })], 'data.json', { type: 'application/json' });
    await userEvent.upload(input, good);
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm' }));
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['egg']);
    const bad = new File(['nope'], 'bad.json', { type: 'application/json' });
    await userEvent.upload(input, bad);
    expect(await screen.findByRole('status')).toHaveTextContent('Could not import this file.');
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
```

Run: `npm test -- Settings` — Expected: FAIL.

- [ ] **Step 2: Implement**

`src/features/settings/SettingsPage.tsx`:
```tsx
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { ServingsStepper } from '../../components/ServingsStepper';
import { useToastStore } from '../../components/Toast';
import { todayIso } from '../../domain/dates';
import type { Lang, PersistedState } from '../../domain/types';
import { useT } from '../../i18n';
import { downloadTextFile, exportFilename, parseImportedState, serializeState } from '../../store/exportImport';
import { pickPersisted, useAppStore } from '../../store/useAppStore';

const APP_VERSION = '0.1.0';
const LANGS: Lang[] = ['ja', 'en'];
const THRESHOLDS = [1, 2, 3];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-stone-700">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const t = useT();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const servings = useAppStore((s) => s.servings);
  const setServings = useAppStore((s) => s.setServings);
  const almostThreshold = useAppStore((s) => s.almostThreshold);
  const setAlmostThreshold = useAppStore((s) => s.setAlmostThreshold);
  const importState = useAppStore((s) => s.importState);
  const resetAll = useAppStore((s) => s.resetAll);
  const showToast = useToastStore((s) => s.show);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const exportData = () => {
    downloadTextFile(exportFilename(todayIso()), serializeState(pickPersisted(useAppStore.getState())));
  };

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setPendingImport(parseImportedState(await file.text()));
    } catch {
      showToast(t('settings.importError'));
    }
  };

  const confirmImport = () => {
    if (pendingImport) importState(pendingImport);
    setPendingImport(null);
    showToast(t('settings.importSuccess'));
  };

  return (
    <div className="p-4">
      <PageHeader title={t('settings.title')} />

      <Section title={t('settings.language')}>
        <div className="flex gap-2">
          {LANGS.map((lang) => (
            <Chip key={lang} selected={language === lang} onClick={() => setLanguage(lang)}>{t(`lang.${lang}`)}</Chip>
          ))}
        </div>
      </Section>

      <Section title={t('settings.servings')}>
        <ServingsStepper value={servings} onChange={setServings} />
      </Section>

      <Section title={t('settings.almostThreshold')}>
        <p className="text-xs text-stone-500">{t('settings.almostThresholdHint')}</p>
        <div className="flex gap-2">
          {THRESHOLDS.map((n) => (
            <Chip key={n} selected={almostThreshold === n} onClick={() => setAlmostThreshold(n)}>{String(n)}</Chip>
          ))}
        </div>
      </Section>

      <Section title={t('settings.data')}>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportData}>{t('settings.export')}</Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>{t('settings.import')}</Button>
          <input ref={fileInput} type="file" accept="application/json,.json" aria-label={t('settings.import')} className="sr-only" onChange={onFileChosen} />
          <Button variant="danger" onClick={() => setConfirmingReset(true)}>{t('settings.reset')}</Button>
        </div>
      </Section>

      <Section title={t('settings.about')}>
        <p className="text-sm text-stone-700">{t('app.name')} · {t('settings.version', { version: APP_VERSION })}</p>
      </Section>

      <ConfirmDialog
        open={pendingImport !== null}
        title={t('settings.importConfirmTitle')}
        body={t('settings.importConfirmBody')}
        confirmLabel={t('common.confirm')}
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
      <ConfirmDialog
        open={confirmingReset}
        title={t('settings.resetConfirmTitle')}
        body={t('settings.resetConfirmBody')}
        confirmLabel={t('settings.reset')}
        danger
        onConfirm={() => { resetAll(); setConfirmingReset(false); }}
        onCancel={() => setConfirmingReset(false)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run tests, commit**

Run: `npm test -- Settings` — Expected: PASS.

```bash
git add src/features/settings
git commit -m "feat(settings): add language, servings, threshold, export/import and reset"
```

---

### Task 18: Docs and final verification

**Files:**
- Create: `README.md`, `CLAUDE.md`
- Verify: `npm test`, `npm run build`, `npm run lint`, manual smoke in the browser via `npm run dev`.

- [ ] **Step 1: Write README.md**

Sections: what the app does (bilingual, pantry, suggestions, buy-to-unlock, servings), screenshots placeholder omitted, quick start (`npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run lint`), how data is stored (localStorage key `grocery-manager`, export/import JSON), project structure (the table from this plan's File Structure), how to add preset content (edit `src/data/ingredients.ts` / `src/data/recipes/*.ts`, run `npm test` for the integrity test), how suggestions are computed (status rules, threshold, buy-to-unlock definition), out-of-scope list, license note (MIT, no LICENSE file unless the user asks).

- [ ] **Step 2: Write CLAUDE.md**

Contents:
- Project summary and stack in three lines.
- Commands: `npm run dev`, `npm test`, `npm run build`, `npm run lint`.
- Conventions: English everywhere except i18n dictionaries and preset content; every UI string via `t()`; `import type` under `verbatimModuleSyntax`; pure domain functions in `src/domain` with unit tests; preset IDs are kebab-case slugs; water is never an ingredient; both languages required for presets; commit per task, no remote push.
- Where things live (short pointer list).
- Spec and plan paths.
- The task-observer activation block (from `references/environments.md`) with the pinned log path `C:/Users/uenoh/.claude/projects/C--avatar/memory/skill-observations`.

- [ ] **Step 3: Full verification**

Run: `npm test && npm run build && npm run lint` — Expected: all tests pass, build succeeds, no lint errors.

Then start `npm run dev`, open the app in the browser, and walk through: add staples → add egg → Cook tab shows Tamagoyaki under Ready → Buy-this section lists an ingredient → add to shopping → Shopping tab check → pantry gains it → switch language to English → export JSON.

- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: add README and CLAUDE.md"
```
