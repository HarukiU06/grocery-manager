# Grocery Manager — Design Spec

**Date:** 2026-09-18
**Status:** Approved by the user (design presented in chat and approved before this document was written).

## 1. Purpose

A web app for managing the groceries and seasonings a household has on hand,
and for answering two questions from that inventory:

1. "What can I cook right now?"
2. "What would I need to buy to unlock more dishes?"

Recipes come from a built-in preset library and from recipes the user adds.
The UI is bilingual (Japanese / English) and every recipe can be scaled to
any number of servings.

## 2. Decisions made with the user

| Topic | Decision |
|---|---|
| Architecture | Single-page app, no backend. Data lives in the browser (localStorage). JSON export/import for moving data between devices. |
| Suggestion engine | Rule-based only. Deterministic ingredient matching; no LLM calls. |
| Inventory granularity | Presence-based matching. Quantity, expiry date and storage location are optional metadata. No automatic deduction after cooking. |
| Preset scope | Mixed cuisine, about 60 recipes (roughly 25 Japanese, 20 Western, 15 Chinese) and about 150 ingredients. |
| Language of the codebase | Everything (code, comments, commits, README, CLAUDE.md, this spec) is in English. Only UI strings and preset content carry Japanese. |
| Git | Local repository only. No remote is pushed unless the user asks. |

## 3. Tech stack

- **React 19 + TypeScript (strict)** on **Vite**.
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (no PostCSS config).
- **Zustand v5** with the `persist` middleware for state and localStorage persistence.
- **react-router-dom v7** (library mode, hash router) so each tab has a URL, the mobile back button works, and the built app runs on any static host without rewrite rules.
- **Vitest + @testing-library/react + jsdom** for tests. ESLint from the Vite template.
- No component library. Mobile-first layout; on wide screens the app is centered at a max width.

## 4. Screens

Bottom navigation with five tabs. Route paths in parentheses.

### 4.1 Pantry (`/`)
- Items grouped by ingredient category, each group collapsible.
- Search box at the top. Typing filters the ingredient catalog (preset + custom) by Japanese name, English name or alias, case-insensitive substring. Selecting a result adds it to the pantry. If nothing matches, a "Create new ingredient" action opens a small form (name in the current language required, the other language optional, category required) and adds the new ingredient to the pantry.
- Each row: localized name, optional quantity text, optional expiry date with a badge (amber when within 3 days, red when past), optional location (fridge / freezer / pantry). Tapping a row opens an edit sheet for those fields plus a remove button.
- Empty state offers a one-tap "Add common staples" action that adds a curated list of basic seasonings (soy sauce, salt, sugar, cooking oil, etc.). The same action is available from a menu when the pantry is not empty; it skips items already present.

### 4.2 Suggestions (`/suggestions`)
- Servings selector at the top (stepper, 1–12). This is the single global `servings` value.
- Cuisine filter chips (All / Japanese / Western / Chinese / Other).
- Three sections:
  1. **Ready to cook** — recipes with every required ingredient present.
  2. **Almost there** — recipes missing 1..`almostThreshold` required ingredients (default threshold 2). Each card lists the missing ingredients with an "Add to shopping list" action per ingredient.
  3. **Buy this, unlock that** — one row per missing ingredient aggregated across "almost" recipes, showing how many recipes it fully unlocks and how many it helps. Tapping shows the recipe names; each row has "Add to shopping list".
- Recipe cards link to the recipe detail page.

### 4.3 Recipes (`/recipes`, `/recipes/:id`, `/recipes/new`, `/recipes/:id/edit`)
- List of all recipes (preset + custom) with search, cuisine filter, and a badge for custom recipes.
- Detail page: name, description, cuisine, time, servings selector (same global value), ingredient list scaled to the selected servings with a have / missing mark per ingredient, steps. Actions: "Add missing to shopping list"; for custom recipes "Edit" and "Delete" (with confirm); for preset recipes "Duplicate" which creates an editable custom copy named "<name> (copy)".
- Form page (new / edit): name JA and EN (at least one required), description JA/EN (optional), cuisine, category, base servings, time in minutes, ingredient rows (ingredient picker with the same search/create behaviour as the pantry, amount, unit, optional flag), steps as one textarea per language (one step per line; at least one language required).

### 4.4 Shopping (`/shopping`)
- Checklist of ingredients. Checking an item marks it bought: it is removed from the list and added to the pantry (no quantity). An "Undo" toast for the last action is out of scope.
- Items can be added from Suggestions and Recipe detail, or via a search box on this page (same picker).
- Items can be removed without buying.

### 4.5 Settings (`/settings`)
- Language: Japanese / English.
- Servings (same global value).
- "Almost there" threshold: 1, 2 or 3.
- Export data (downloads a JSON file) / Import data (file picker; validates shape and schema version; asks for confirmation; replaces all state).
- Reset all data (confirm dialog).
- About: app name, version, link to the README.

## 5. Domain model

All types live in `src/domain/types.ts`.

```ts
export type Lang = 'ja' | 'en';

/** Text that may exist in one or both languages. Presets always provide both. */
export interface LocalizedText { ja?: string; en?: string }

export type IngredientCategory =
  | 'vegetable' | 'fruit' | 'mushroom' | 'meat' | 'seafood' | 'egg_dairy'
  | 'tofu_soy' | 'grain_noodle_bread' | 'seasoning' | 'oil_fat'
  | 'canned_dry' | 'frozen' | 'other';

export interface Ingredient {
  id: string;                 // kebab-case, e.g. 'soy-sauce'
  name: LocalizedText;
  category: IngredientCategory;
  aliases?: string[];         // extra search terms in any language
  isPreset: boolean;
}

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export interface PantryItem {
  ingredientId: string;
  quantity?: string;          // free text, e.g. '2', '300g'
  expiresOn?: string;         // ISO date 'YYYY-MM-DD'
  location?: StorageLocation;
  addedOn: string;            // ISO date
}

export type Unit =
  | 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp' | 'cup'
  | 'clove' | 'slice' | 'bunch' | 'sheet' | 'can' | 'pack' | 'stalk' | 'pinch';

export interface RecipeIngredient {
  ingredientId: string;
  amount?: number;            // for baseServings; undefined means "to taste"
  unit?: Unit;
  note?: LocalizedText;       // e.g. 'thinly sliced'
  optional?: boolean;         // ignored by matching
}

export type Cuisine = 'japanese' | 'western' | 'chinese' | 'other';
export type RecipeCategory = 'main' | 'side' | 'soup' | 'rice' | 'noodle' | 'salad' | 'dessert';

export interface Recipe {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  cuisine: Cuisine;
  category: RecipeCategory;
  baseServings: number;       // presets use 2
  timeMinutes?: number;
  ingredients: RecipeIngredient[];
  steps: { ja?: string[]; en?: string[] };
  isPreset: boolean;
}

export interface ShoppingItem {
  ingredientId: string;
  addedOn: string;
}
```

Rules:
- Ingredient and recipe IDs are unique across presets and custom items. Custom IDs are `custom-<random>`; preset IDs are readable slugs.
- Water is never an ingredient; recipes mention it in steps.
- Presets must supply both `ja` and `en` for every localized field. A data integrity test enforces this.
- `localize(text, lang)` returns `text[lang]`, falling back to the other language, then to an empty string.

## 6. Matching engine (`src/domain/matching.ts`)

Pure functions, no React, fully unit-tested.

```ts
export type RecipeStatus = 'ready' | 'almost' | 'far';

export interface RecipeMatch {
  recipe: Recipe;
  status: RecipeStatus;
  missingRequired: string[];   // ingredient IDs, in recipe order
  missingOptional: string[];
  usesExpiring: string[];      // pantry ingredient IDs expiring within EXPIRING_SOON_DAYS that the recipe uses
}

export interface BuyToUnlock {
  ingredientId: string;
  unlocks: Recipe[];           // 'almost' recipes whose only missing ingredient is this one
  helps: Recipe[];             // 'almost' recipes missing this one plus others
}

export interface SuggestionOptions {
  almostThreshold: number;     // default 2
  today: string;               // ISO date, injected for testability
}

export function evaluateRecipe(recipe, pantry: PantryItem[], options): RecipeMatch;
export function buildSuggestions(recipes, pantry, options): {
  ready: RecipeMatch[]; almost: RecipeMatch[]; buyToUnlock: BuyToUnlock[];
};
```

- `EXPIRING_SOON_DAYS = 3`. An item is "expiring" when `expiresOn <= today + 3 days` (this includes already-expired items).
- Status: `missingRequired.length === 0` → `ready`; `1..almostThreshold` → `almost`; otherwise `far`.
- Sorting:
  - `ready`: `usesExpiring.length` desc, then `timeMinutes` asc (undefined last), then English name asc (stable regardless of UI language; the UI does not re-sort).
  - `almost`: `missingRequired.length` asc, then `usesExpiring.length` desc, then English name.
  - `buyToUnlock`: `unlocks.length` desc, then `helps.length` desc, then ingredient ID asc (preset IDs are English slugs). Ingredients with zero unlocks and zero helps never appear.
- `far` recipes are not shown on the Suggestions page; they are visible in the Recipes tab.

## 7. Servings scaling (`src/domain/scaling.ts`)

- `scaleAmount(amount, baseServings, targetServings)` = `amount * target / base`, rounded to one decimal.
- `formatAmount(amount, unit, lang)`:
  - Integers print without a decimal (`450`), otherwise one decimal (`1.5`).
  - English: `"<amount> <unit label>"`, e.g. `2 tbsp`, `200 g`, `1 clove`.
  - Japanese: units `tbsp`, `tsp`, `cup` are prefixed (`大さじ2`, `小さじ1`, `カップ1.5`); all other units are suffixed without a space (`200g`, `2個`, `1片`).
  - `amount === undefined` prints the note if present, otherwise `適量` / `to taste`.
- Unit labels are part of the i18n dictionaries.

## 8. State and persistence (`src/store/`)

Single Zustand store with `persist` under the localStorage key `grocery-manager`.

```ts
interface PersistedState {
  schemaVersion: 1;
  language: Lang;
  servings: number;            // 1..12, default 2
  almostThreshold: number;     // 1..3, default 2
  customIngredients: Ingredient[];
  pantry: PantryItem[];
  customRecipes: Recipe[];
  shoppingList: ShoppingItem[];
}
```

- Actions: `setLanguage`, `setServings`, `setAlmostThreshold`, `addPantryItem`, `updatePantryItem`, `removePantryItem`, `addCommonStaples`, `createIngredient`, `addCustomRecipe`, `updateCustomRecipe`, `deleteCustomRecipe`, `duplicateRecipe`, `addToShopping`, `removeFromShopping`, `markBought`, `importState`, `resetAll`.
- Derived selectors (memoized helpers, not stored): `allIngredients`, `ingredientById`, `allRecipes`, `pantryIndex`.
- Initial language: `ja` if `navigator.language` starts with `ja`, else `en`.
- `migrations.ts` exports `migrate(raw, fromVersion): PersistedState`; version 1 is the identity. Zustand `persist`'s `version` and `migrate` options call into it.
- Export writes `PersistedState` as pretty JSON to `grocery-manager-<date>.json`. Import parses, validates required keys and array shapes, runs `migrate`, then replaces state after user confirmation. Invalid files show an error toast and change nothing.
- Deleting a custom ingredient is not offered in v1 (a recipe might reference it). Removing an item from the pantry only removes the pantry entry.

## 9. Internationalisation (`src/i18n/`)

- `ja.ts` and `en.ts` export `Record<TranslationKey, string>`; `TranslationKey` is derived from the English dictionary so a missing Japanese key is a type error.
- `useT()` returns `t(key, params?)` with `{name}`-style interpolation.
- All user-visible UI strings go through `t()`. Preset content (ingredient and recipe text) uses `LocalizedText` and `localize()` instead.
- `document.documentElement.lang` is kept in sync with the selected language.

## 10. Preset content (`src/data/`)

- `ingredients.ts`: about 150 ingredients across all categories, each with `id`, `name.ja`, `name.en`, `category`, and aliases where useful (e.g. hiragana readings, common English variants).
- `recipes/japanese.ts`, `recipes/western.ts`, `recipes/chinese.ts`, `recipes/index.ts`: about 60 recipes total, each with both languages, `baseServings: 2`, time, 3–8 ingredients and 3–7 steps.
- `staples.ts`: ordered list of ingredient IDs used by "Add common staples" (soy sauce, salt, sugar, miso, mirin, sake, rice vinegar, cooking oil, sesame oil, pepper, dashi granules, ketchup, mayonnaise, flour, rice, garlic, ginger).
- `data.test.ts` asserts: unique IDs; every recipe ingredient ID exists; every localized field has both languages; every recipe has at least one ingredient and one step per language; `baseServings > 0`; staples IDs exist.

## 11. Project layout

```
src/
  main.tsx, App.tsx, index.css
  components/        shared UI: BottomNav, Button, Badge, Chip, Sheet, SearchInput,
                     ServingsStepper, EmptyState, ConfirmDialog, Toast
  features/
    pantry/          PantryPage, PantryGroup, PantryItemRow, PantryItemSheet, IngredientPicker, NewIngredientForm
    suggestions/     SuggestionsPage, RecipeMatchCard, BuyToUnlockList
    recipes/         RecipesPage, RecipeDetailPage, RecipeFormPage, RecipeIngredientRow
    shopping/        ShoppingPage
    settings/        SettingsPage
  domain/            types.ts, matching.ts, scaling.ts, localize.ts, dates.ts, ids.ts
  data/              ingredients.ts, staples.ts, recipes/{japanese,western,chinese,index}.ts
  store/             useAppStore.ts, migrations.ts, exportImport.ts, selectors.ts
  i18n/              en.ts, ja.ts, index.ts
  test/              setup.ts, factories.ts
```

## 12. Error handling

- Import: any parse or validation error results in a toast with a generic message and no state change.
- localStorage unavailable (private mode quota, etc.): the app still runs in memory; a one-time warning toast says data will not persist.
- Recipe form validation: at least one name, at least one ingredient, at least one step, `baseServings >= 1`. Errors are shown inline in the current language.
- Unknown ingredient IDs (e.g. a custom recipe referencing an ingredient removed by a bad import) render as `?` in the UI and count as missing in matching; nothing crashes.

## 13. Testing strategy

- Unit: `matching`, `scaling`, `localize`, `dates`, `migrations`, `exportImport`, store actions.
- Data integrity: `data.test.ts` as described in section 10.
- Component (Testing Library): Pantry add-and-create flow, Suggestions sections render from a seeded store, Recipe detail scales amounts when servings change, language toggle changes visible strings, Shopping "bought" moves item to pantry.
- Tests run with `npm test`; `npm run build` must pass with no type errors.

## 14. Out of scope for v1

PWA install / offline manifest, multi-device sync, automatic inventory deduction after cooking, LLM-based ideas, nutrition data, photos, barcode scanning, deleting custom ingredients.
