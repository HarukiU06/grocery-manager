# Grocery Manager v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ingredient filtering, an expiry off-switch, selective data clearing, a weekly cooking log, structured quantities with gram conversion, nutrition with daily targets, and recipe import from a URL or pasted text.

**Architecture:** Storage moves to schema version 2, converting the pantry's free-text quantity into a number plus unit. A new pure `units` layer converts any recipe or pantry amount to grams; `nutrition` sits on top of it and needs nothing else. The cooking log stores snapshots so history survives recipe edits. Recipe import is parse-only: it never writes a recipe, it prefills the existing form.

**Tech Stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4, Zustand v5 (`persist`), react-router-dom v7 (hash router), Vitest + Testing Library, ESLint flat config.

**Spec:** `docs/superpowers/specs/2026-09-19-grocery-manager-v2-design.md`

## Global Constraints

- All code, comments, commit messages and docs in English. Japanese only in `src/i18n/ja.ts` and preset content under `src/data/`.
- Every user-visible string goes through `t()`. Add the key to `src/i18n/en.ts` first (it defines `TranslationKey`), then `ja.ts`.
- `verbatimModuleSyntax` is on: type-only imports use `import type`. `noUnusedLocals` and `noUnusedParameters` are on.
- Never sync props into state with `useEffect`; mount a keyed child instead. The `react-hooks/set-state-in-effect` lint rule enforces it.
- Tests reset the store with `useAppStore.setState(defaultPersistedState('en'))` in `beforeEach`; page tests render through `renderWithRouter`.
- `CURRENT_SCHEMA_VERSION` is `2`. Import accepts versions 1 and 2.
- Nutrition values are per 100 g edible portion and are estimates. Every nutrition surface says so.
- `toGrams` returns `null` for anything it cannot convert. Callers report it, never guess.
- Only required recipe ingredients count toward nutrition. Optional ones are reported as excluded.
- Weeks start Monday. Weekly averages divide by recorded days, not by seven.
- Recipe import never saves a recipe; it prefills the form.
- `npm test`, `npm run build` and `npm run lint` must pass before a task is done.
- Commit per task. Push to `origin main` only at the end of Task 15.
- Bulk data tasks specify a schema, the row values or the file that lists them, and an integrity test that fails until every row exists. Filling the table is the task; the plan does not restate values it can point to.

---

## File Structure

| Path | Responsibility | Task |
|---|---|---|
| `src/domain/types.ts` | MODIFY: `Quantity`, `PantryItem.quantity`/`note`, `CookEntry`, `AmountDisplay`, `NutritionTargetKey`, new `PersistedState` fields, version 2 | 1 |
| `src/domain/unitAliases.ts` | NEW: alias table, `parseQuantityText`, `unitFromAlias`, `toAsciiDigits` | 1 |
| `src/store/migrations.ts` | MODIFY: v1 to v2 pantry conversion | 1 |
| `src/store/useAppStore.ts` | MODIFY: new fields, `setTrackExpiry`, `setAmountDisplay`, `setNutritionTarget`, `logCook`, `deleteCookEntry`, `clearData` | 1 |
| `src/store/exportImport.ts` | MODIFY: accept versions 1 and 2 | 1 |
| `src/domain/units.ts` | NEW: `toGrams` | 2 |
| `src/data/conversions.ts` | NEW: `CONVERSIONS` | 2 |
| `src/features/pantry/PantryItemSheet.tsx` | MODIFY: number plus unit, note field, expiry gating | 3 |
| `src/features/pantry/PantryItemRow.tsx` | MODIFY: formatted quantity, note, expiry gating | 3 |
| `src/components/IngredientFilterSheet.tsx` | NEW: shared multi-select filter | 4 |
| `src/features/suggestions/SuggestionsPage.tsx` | MODIFY: filter, `considerExpiry` | 4, 5 |
| `src/features/recipes/RecipesPage.tsx` | MODIFY: filter, import button | 4, 14 |
| `src/domain/matching.ts` | MODIFY: `considerExpiry` option | 5 |
| `src/features/settings/SettingsPage.tsx` | MODIFY: expiry switch, nutrition target, clear-data entry | 5, 6, 8 |
| `src/features/settings/ClearDataSheet.tsx` | NEW | 6 |
| `src/domain/nutrition.ts` | NEW: keys, directions, `computeRecipeNutrition` | 7 |
| `src/data/nutrition.ts` | NEW: `NUTRITION` rows | 7 |
| `src/data/targets.ts` | NEW: `DAILY_TARGETS` | 8 |
| `src/domain/targets.ts` | NEW: `percentOfTarget` | 8 |
| `src/components/NutritionPanel.tsx` | NEW: shared by recipe detail and log | 9 |
| `src/features/recipes/RecipeDetailPage.tsx` | MODIFY: display toggle, nutrition, cook button | 9, 11 |
| `src/domain/cookingLog.ts` | NEW: `weekStart`, `groupByWeek` | 10 |
| `src/features/recipes/CookSheet.tsx` | NEW | 11 |
| `src/features/log/LogPage.tsx`, `LogWeekCard.tsx` | NEW | 12 |
| `src/components/BottomNav.tsx`, `src/App.tsx` | MODIFY: sixth tab, two routes | 12, 14 |
| `src/domain/recipeImport/{types,parseJsonLd,parseText,fetchRecipe}.ts` | NEW | 13 |
| `src/features/recipes/ImportRecipePage.tsx` | NEW | 14 |
| `src/features/recipes/RecipeFormPage.tsx` | MODIFY: accept a prefilled draft from router state | 14 |
| `src/data/data.test.ts` | MODIFY: nutrition and conversion integrity | 2, 7, 8 |
| `README.md`, `CLAUDE.md` | MODIFY | 15 |

---

### Task 1: Schema version 2

**Files:**
- Create: `src/domain/unitAliases.ts`
- Modify: `src/domain/types.ts`, `src/store/migrations.ts`, `src/store/useAppStore.ts`, `src/store/exportImport.ts`
- Test: `src/domain/unitAliases.test.ts`, `src/store/migrations.test.ts`, `src/store/useAppStore.test.ts`, `src/store/exportImport.test.ts`

**Interfaces:**
- Produces: `Quantity`, `AmountDisplay`, `NutritionTargetKey`, `CookEntry`, `ClearSelection`; `parseQuantityText(text: string): Quantity | null`, `unitFromAlias(text: string): Unit | null`, `toAsciiDigits(text: string): string`; store actions `setTrackExpiry(value: boolean)`, `setAmountDisplay(value: AmountDisplay)`, `setNutritionTarget(value: NutritionTargetKey)`, `logCook(entry: Omit<CookEntry, 'id'>): CookEntry`, `deleteCookEntry(id: string)`, `clearData(selection: ClearSelection)`.
- Note: `NutritionTotals` is referenced by `CookEntry` and defined in Task 7. To keep Task 1 self-contained, `types.ts` declares it here and Task 7 imports it from `types.ts`.

- [ ] **Step 1: Write the failing test for the alias parser**

`src/domain/unitAliases.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseQuantityText, toAsciiDigits, unitFromAlias } from './unitAliases';

describe('toAsciiDigits', () => {
  it('converts full-width digits and period', () => {
    expect(toAsciiDigits('１２.５')).toBe('12.5');
    expect(toAsciiDigits('３．５')).toBe('3.5');
    expect(toAsciiDigits('12')).toBe('12');
  });
});

describe('unitFromAlias', () => {
  it('maps Japanese and English aliases', () => {
    expect(unitFromAlias('g')).toBe('g');
    expect(unitFromAlias('グラム')).toBe('g');
    expect(unitFromAlias('個')).toBe('pcs');
    expect(unitFromAlias('大さじ')).toBe('tbsp');
    expect(unitFromAlias('本')).toBe('stalk');
    expect(unitFromAlias('枚')).toBe('slice');
    expect(unitFromAlias('パック')).toBe('pack');
    expect(unitFromAlias('cc')).toBe('ml');
  });
  it('is case-insensitive and trims', () => {
    expect(unitFromAlias(' KG ')).toBe('kg');
  });
  it('returns null for anything else', () => {
    expect(unitFromAlias('ざる')).toBeNull();
    expect(unitFromAlias('')).toBeNull();
  });
});

describe('parseQuantityText', () => {
  it('parses a number with a unit', () => {
    expect(parseQuantityText('300g')).toEqual({ amount: 300, unit: 'g' });
    expect(parseQuantityText('2 個')).toEqual({ amount: 2, unit: 'pcs' });
    expect(parseQuantityText('1.5カップ')).toEqual({ amount: 1.5, unit: 'cup' });
    expect(parseQuantityText('１２枚')).toEqual({ amount: 12, unit: 'slice' });
  });
  it('defaults a bare number to pieces', () => {
    expect(parseQuantityText('2')).toEqual({ amount: 2, unit: 'pcs' });
  });
  it('returns null when there is no number or the unit is unknown', () => {
    expect(parseQuantityText('たくさん')).toBeNull();
    expect(parseQuantityText('2ざる')).toBeNull();
    expect(parseQuantityText('   ')).toBeNull();
  });
});
```

Run: `npx vitest run src/domain/unitAliases` — Expected: FAIL, module not found.

- [ ] **Step 2: Implement the alias parser**

`src/domain/unitAliases.ts`:
```ts
import type { Quantity, Unit } from './types';

/** Full-width digits and period to ASCII, so pasted text parses like typed text. */
export function toAsciiDigits(text: string): string {
  return text
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/．/g, '.');
}

const UNIT_ALIASES: ReadonlyArray<readonly [Unit, readonly string[]]> = [
  ['g', ['g', 'グラム', 'ｇ']],
  ['kg', ['kg', 'キロ', 'キログラム']],
  ['ml', ['ml', 'cc', 'ミリリットル']],
  ['l', ['l', 'リットル']],
  ['pcs', ['個', 'こ', 'コ', 'pcs', 'piece', 'pieces']],
  ['tbsp', ['大さじ', '大匙', 'tbsp']],
  ['tsp', ['小さじ', '小匙', 'tsp']],
  ['cup', ['カップ', 'cup']],
  ['clove', ['片', 'かけ', 'clove']],
  ['slice', ['枚', 'まい', 'slice', 'slices']],
  ['bunch', ['束', 'たば', 'bunch']],
  ['sheet', ['sheet']],
  ['can', ['缶', 'かん', 'can']],
  ['pack', ['パック', '袋', 'pack']],
  ['stalk', ['本', 'ほん', 'stalk']],
  ['pinch', ['つまみ', 'ひとつまみ', 'pinch']],
];

const ALIAS_TO_UNIT = new Map<string, Unit>(
  UNIT_ALIASES.flatMap(([unit, aliases]) => aliases.map((alias) => [alias.toLowerCase(), unit] as const)),
);

export function unitFromAlias(text: string): Unit | null {
  return ALIAS_TO_UNIT.get(text.trim().toLowerCase()) ?? null;
}

/** "300g" and "2 個" become a Quantity; a bare number means pieces; anything else is null. */
export function parseQuantityText(text: string): Quantity | null {
  const normalized = toAsciiDigits(text).trim();
  const match = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(normalized);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unitText = match[2].trim();
  if (!unitText) return { amount, unit: 'pcs' };
  const unit = unitFromAlias(unitText);
  return unit ? { amount, unit } : null;
}
```

Run: `npx vitest run src/domain/unitAliases` — Expected: PASS.

- [ ] **Step 3: Extend the domain types**

In `src/domain/types.ts`, change `CURRENT_SCHEMA_VERSION` to `2` and add:
```ts
export interface Quantity {
  amount: number;
  unit: Unit;
}

export type AmountDisplay = 'recipe' | 'grams';
export type NutritionTargetKey = 'off' | 'adult_male' | 'adult_female';

export const NUTRIENT_KEYS = [
  'energy', 'protein', 'fat', 'carbs', 'fiber', 'salt',
  'calcium', 'iron', 'potassium',
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminC', 'vitaminD',
] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type NutritionTotals = Record<NutrientKey, number>;

export interface CookEntry {
  id: string;
  recipeId: string;
  recipeName: LocalizedText;
  servings: number;
  cookedOn: string;
  nutrition?: NutritionTotals;
}
```
Replace `PantryItem.quantity?: string` with `quantity?: Quantity` and add `note?: string`. Extend `PersistedState` with `trackExpiry: boolean`, `amountDisplay: AmountDisplay`, `nutritionTarget: NutritionTargetKey`, `cookingLog: CookEntry[]`.

- [ ] **Step 4: Write the failing migration test**

Replace the version-1 case in `src/store/migrations.test.ts` and add:
```ts
import { describe, expect, it } from 'vitest';
import { defaultPersistedState, detectLanguage, migrate } from './migrations';

describe('migrations', () => {
  it('detects Japanese from the browser language', () => {
    expect(detectLanguage('ja-JP')).toBe('ja');
    expect(detectLanguage('en-US')).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });
  it('default state carries the version 2 fields', () => {
    expect(defaultPersistedState('ja')).toEqual({
      schemaVersion: 2,
      language: 'ja',
      servings: 2,
      almostThreshold: 2,
      trackExpiry: true,
      amountDisplay: 'recipe',
      nutritionTarget: 'off',
      customIngredients: [],
      pantry: [],
      customRecipes: [],
      shoppingList: [],
      cookingLog: [],
    });
  });
  it('converts version 1 pantry quantities', () => {
    const migrated = migrate(
      {
        schemaVersion: 1,
        pantry: [
          { ingredientId: 'flour', quantity: '300g', addedOn: '2026-01-01' },
          { ingredientId: 'egg', quantity: '6', addedOn: '2026-01-01' },
          { ingredientId: 'miso', quantity: '大さじ2', addedOn: '2026-01-01' },
          { ingredientId: 'rice', quantity: 'たっぷり', addedOn: '2026-01-01' },
          { ingredientId: 'salt', addedOn: '2026-01-01' },
        ],
      },
      1,
    );
    expect(migrated.pantry[0]).toMatchObject({ quantity: { amount: 300, unit: 'g' } });
    expect(migrated.pantry[1]).toMatchObject({ quantity: { amount: 6, unit: 'pcs' } });
    expect(migrated.pantry[2]).toMatchObject({ quantity: { amount: 2, unit: 'tbsp' } });
    expect(migrated.pantry[3].quantity).toBeUndefined();
    expect(migrated.pantry[3].note).toBe('たっぷり');
    expect(migrated.pantry[4].quantity).toBeUndefined();
    expect(migrated.pantry[4].note).toBeUndefined();
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.cookingLog).toEqual([]);
    expect(migrated.trackExpiry).toBe(true);
  });
  it('leaves version 2 pantry items alone', () => {
    const migrated = migrate(
      {
        schemaVersion: 2,
        pantry: [{ ingredientId: 'flour', quantity: { amount: 1, unit: 'kg' }, addedOn: '2026-01-01' }],
      },
      2,
    );
    expect(migrated.pantry[0].quantity).toEqual({ amount: 1, unit: 'kg' });
  });
  it('rejects versions from the future', () => {
    expect(() => migrate({}, 99)).toThrow();
  });
});
```

Run: `npx vitest run src/store/migrations` — Expected: FAIL.

- [ ] **Step 5: Implement the migration**

In `src/store/migrations.ts`:
```ts
import { parseQuantityText } from '../domain/unitAliases';
import {
  CURRENT_SCHEMA_VERSION,
  type Lang,
  type PantryItem,
  type PersistedState,
} from '../domain/types';

export function defaultPersistedState(language: Lang = 'en'): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    language,
    servings: 2,
    almostThreshold: 2,
    trackExpiry: true,
    amountDisplay: 'recipe',
    nutritionTarget: 'off',
    customIngredients: [],
    pantry: [],
    customRecipes: [],
    shoppingList: [],
    cookingLog: [],
  };
}

/** Version 1 stored the pantry quantity as free text; version 2 stores a number and a unit. */
function migratePantryV1toV2(pantry: unknown): PantryItem[] {
  if (!Array.isArray(pantry)) return [];
  return pantry.map((raw) => {
    const item = raw as PantryItem & { quantity?: unknown };
    if (typeof item.quantity !== 'string') return item as PantryItem;
    const { quantity: legacy, ...rest } = item;
    const text = legacy.trim();
    if (!text) return rest as PantryItem;
    const parsed = parseQuantityText(text);
    return parsed ? ({ ...rest, quantity: parsed } as PantryItem) : ({ ...rest, note: text } as PantryItem);
  });
}

export function migrate(raw: unknown, fromVersion: number): PersistedState {
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version ${fromVersion}`);
  }
  const partial = (raw && typeof raw === 'object' ? raw : {}) as Partial<PersistedState>;
  const merged = { ...defaultPersistedState(partial.language), ...partial };
  const pantry = fromVersion < 2 ? migratePantryV1toV2(merged.pantry) : merged.pantry;
  return { ...merged, pantry, schemaVersion: CURRENT_SCHEMA_VERSION };
}
```
`clamp` stays as it is.

Run: `npx vitest run src/store/migrations` — Expected: PASS.

- [ ] **Step 6: Write the failing store test**

Append to `src/store/useAppStore.test.ts`:
```ts
describe('version 2 settings and cooking log', () => {
  it('toggles the new settings', () => {
    const s = useAppStore.getState();
    s.setTrackExpiry(false);
    expect(useAppStore.getState().trackExpiry).toBe(false);
    s.setAmountDisplay('grams');
    expect(useAppStore.getState().amountDisplay).toBe('grams');
    s.setNutritionTarget('adult_female');
    expect(useAppStore.getState().nutritionTarget).toBe('adult_female');
  });
  it('records and deletes cook entries', () => {
    const s = useAppStore.getState();
    const entry = s.logCook({
      recipeId: 'teriyaki-chicken',
      recipeName: { en: 'Teriyaki chicken' },
      servings: 2,
      cookedOn: '2026-09-19',
    });
    expect(entry.id.startsWith('cook-')).toBe(true);
    expect(useAppStore.getState().cookingLog).toHaveLength(1);
    s.deleteCookEntry(entry.id);
    expect(useAppStore.getState().cookingLog).toHaveLength(0);
  });
  it('clears only the selected parts', () => {
    const s = useAppStore.getState();
    s.addPantryItem('egg');
    s.addToShopping('milk');
    s.setServings(6);
    s.logCook({ recipeId: 'r', recipeName: { en: 'R' }, servings: 1, cookedOn: '2026-09-19' });
    s.clearData({ pantry: true, cookingLog: true });
    expect(useAppStore.getState().pantry).toHaveLength(0);
    expect(useAppStore.getState().cookingLog).toHaveLength(0);
    expect(useAppStore.getState().shoppingList).toHaveLength(1);
    expect(useAppStore.getState().servings).toBe(6);
  });
  it('clearing settings restores defaults but keeps the language', () => {
    const s = useAppStore.getState();
    s.setLanguage('ja');
    s.setServings(8);
    s.setTrackExpiry(false);
    s.clearData({ settings: true });
    expect(useAppStore.getState().servings).toBe(2);
    expect(useAppStore.getState().trackExpiry).toBe(true);
    expect(useAppStore.getState().language).toBe('ja');
  });
});
```
Also update the existing pantry test so `addPantryItem('egg', { quantity: { amount: 6, unit: 'pcs' } })` replaces the old string form.

Run: `npx vitest run src/store/useAppStore` — Expected: FAIL.

- [ ] **Step 7: Implement the store changes**

In `src/store/useAppStore.ts` add to `AppActions` and the creator:
```ts
export interface ClearSelection {
  pantry?: boolean;
  shoppingList?: boolean;
  customRecipes?: boolean;
  customIngredients?: boolean;
  cookingLog?: boolean;
  settings?: boolean;
}
```
```ts
      setTrackExpiry: (trackExpiry) => set({ trackExpiry }),
      setAmountDisplay: (amountDisplay) => set({ amountDisplay }),
      setNutritionTarget: (nutritionTarget) => set({ nutritionTarget }),

      logCook: (entry) => {
        const created: CookEntry = { ...entry, id: newId('cook') };
        set((state) => ({ cookingLog: [...state.cookingLog, created] }));
        return created;
      },
      deleteCookEntry: (id) =>
        set((state) => ({ cookingLog: state.cookingLog.filter((e) => e.id !== id) })),

      clearData: (selection) =>
        set((state) => {
          const defaults = defaultPersistedState(state.language);
          return {
            ...(selection.pantry ? { pantry: [] } : {}),
            ...(selection.shoppingList ? { shoppingList: [] } : {}),
            ...(selection.customRecipes ? { customRecipes: [] } : {}),
            ...(selection.customIngredients ? { customIngredients: [] } : {}),
            ...(selection.cookingLog ? { cookingLog: [] } : {}),
            ...(selection.settings
              ? {
                  servings: defaults.servings,
                  almostThreshold: defaults.almostThreshold,
                  trackExpiry: defaults.trackExpiry,
                  amountDisplay: defaults.amountDisplay,
                  nutritionTarget: defaults.nutritionTarget,
                }
              : {}),
          };
        }),
```
Add `'trackExpiry'`, `'amountDisplay'`, `'nutritionTarget'` and `'cookingLog'` to `PERSISTED_KEYS`. Keep `resetAll` as it is.

Run: `npx vitest run src/store/useAppStore` — Expected: PASS.

- [ ] **Step 8: Extend import validation**

In `src/store/exportImport.ts` add `'cookingLog'` to `ARRAY_KEYS`, and after the existing per-item checks:
```ts
  for (const item of raw.cookingLog as unknown[]) {
    assert(
      isRecord(item) && typeof item.id === 'string' && typeof item.recipeId === 'string' && isRecord(item.recipeName),
      'invalid-cook-entry',
    );
  }
```
Guard it so a version 1 file with no `cookingLog` key still imports: treat a missing `cookingLog` as `[]` before the array check by reading `raw.cookingLog ?? []` into a local. Add this test to `src/store/exportImport.test.ts`:
```ts
  it('imports a version 1 file and migrates it', () => {
    const v1 = JSON.stringify({
      schemaVersion: 1,
      language: 'ja',
      servings: 2,
      almostThreshold: 2,
      customIngredients: [],
      pantry: [{ ingredientId: 'flour', quantity: '300g', addedOn: '2026-01-01' }],
      customRecipes: [],
      shoppingList: [],
    });
    const parsed = parseImportedState(v1);
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.pantry[0].quantity).toEqual({ amount: 300, unit: 'g' });
    expect(parsed.cookingLog).toEqual([]);
  });
```

Run: `npx vitest run src/store` — Expected: PASS.

- [ ] **Step 9: Fix the remaining compile errors and verify**

`PantryItemSheet.tsx` and `PantryItemRow.tsx` still treat `quantity` as a string; Task 3 rewrites them. For now make them compile by rendering `item.quantity ? String(item.quantity.amount) : ''`. The pantry page test that types `'6'` into the quantity field is updated in Task 3; mark it `it.skip` here with the comment `// re-enabled in Task 3`.

Run: `npm test && npm run build && npm run lint` — Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add -A src
git commit -m "feat(store): move to schema version 2 with structured quantities and a cooking log"
```

---

### Task 2: Gram conversion

**Files:**
- Create: `src/domain/units.ts`, `src/data/conversions.ts`
- Modify: `src/data/data.test.ts`
- Test: `src/domain/units.test.ts`

**Interfaces:**
- Consumes: `Unit`, `Quantity` from `src/domain/types.ts`.
- Produces: `IngredientConversion`, `CONVERSIONS`, `toGrams(amount: number, unit: Unit, ingredientId: string): number | null`, `DEFAULT_DENSITY`, `TBSP_ML`, `TSP_ML`, `CUP_ML`, `PINCH_G`.

- [ ] **Step 1: Write the failing test**

`src/domain/units.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { toGrams } from './units';

describe('toGrams', () => {
  it('handles mass units', () => {
    expect(toGrams(300, 'g', 'flour')).toBe(300);
    expect(toGrams(1.5, 'kg', 'flour')).toBe(1500);
  });
  it('handles volume with a default density', () => {
    expect(toGrams(200, 'ml', 'milk')).toBeCloseTo(200, 1);
    expect(toGrams(1, 'l', 'milk')).toBeCloseTo(1000, 1);
    expect(toGrams(1, 'cup', 'milk')).toBeCloseTo(200, 1);
  });
  it('uses per-ingredient spoon weights', () => {
    expect(toGrams(1, 'tbsp', 'soy-sauce')).toBeCloseTo(18, 1);
    expect(toGrams(1, 'tsp', 'soy-sauce')).toBeCloseTo(6, 1);
    expect(toGrams(1, 'tbsp', 'sugar')).toBeCloseTo(9, 1);
  });
  it('falls back to volume for spoons with no listed weight', () => {
    expect(toGrams(1, 'tbsp', 'unlisted-ingredient')).toBeCloseTo(15, 1);
    expect(toGrams(3, 'tsp', 'unlisted-ingredient')).toBeCloseTo(15, 1);
  });
  it('uses per-ingredient piece weights', () => {
    expect(toGrams(1, 'pcs', 'egg')).toBeCloseTo(60, 1);
    expect(toGrams(2, 'pcs', 'onion')).toBeCloseTo(400, 1);
    expect(toGrams(1, 'clove', 'garlic')).toBeCloseTo(5, 1);
  });
  it('returns null when a countable unit has no weight for that ingredient', () => {
    expect(toGrams(1, 'pcs', 'soy-sauce')).toBeNull();
    expect(toGrams(1, 'slice', 'egg')).toBeNull();
    expect(toGrams(1, 'can', 'unlisted-ingredient')).toBeNull();
  });
  it('treats a pinch as one gram', () => {
    expect(toGrams(2, 'pinch', 'salt')).toBe(2);
  });
});
```

Run: `npx vitest run src/domain/units` — Expected: FAIL.

- [ ] **Step 2: Implement the converter**

`src/domain/units.ts`:
```ts
import { CONVERSIONS } from '../data/conversions';
import type { Unit } from './types';

export const DEFAULT_DENSITY = 1;
export const TBSP_ML = 15;
export const TSP_ML = 5;
export const CUP_ML = 200;
export const PINCH_G = 1;

const COUNTABLE: ReadonlySet<Unit> = new Set<Unit>([
  'pcs', 'clove', 'slice', 'bunch', 'sheet', 'can', 'pack', 'stalk',
]);

/** Grams for one amount of one unit of one ingredient, or null when it cannot be known. */
export function toGrams(amount: number, unit: Unit, ingredientId: string): number | null {
  const c = CONVERSIONS[ingredientId];
  const density = c?.densityGPerMl ?? DEFAULT_DENSITY;
  const tbsp = c?.gramsPerTbsp ?? TBSP_ML * density;
  switch (unit) {
    case 'g':
      return amount;
    case 'kg':
      return amount * 1000;
    case 'ml':
      return amount * density;
    case 'l':
      return amount * 1000 * density;
    case 'tbsp':
      return amount * tbsp;
    case 'tsp':
      return amount * (tbsp * (TSP_ML / TBSP_ML));
    case 'cup':
      return amount * CUP_ML * density;
    case 'pinch':
      return amount * PINCH_G;
    default:
      break;
  }
  if (COUNTABLE.has(unit)) {
    return c?.pieceUnit === unit && c.gramsPerPiece !== undefined ? amount * c.gramsPerPiece : null;
  }
  return null;
}
```

- [ ] **Step 3: Write the conversion table**

`src/data/conversions.ts` exports:
```ts
import type { Unit } from '../domain/types';

export interface IngredientConversion {
  /** The countable unit this ingredient is normally counted in. */
  pieceUnit?: Unit;
  /** Weight of one of those pieces, in grams. */
  gramsPerPiece?: number;
  /** Weight of one 15 ml tablespoon, in grams. */
  gramsPerTbsp?: number;
  /** Used for ml, l and cup. */
  densityGPerMl?: number;
}

export const CONVERSIONS: Record<string, IngredientConversion> = {
  egg: { pieceUnit: 'pcs', gramsPerPiece: 60 },
  onion: { pieceUnit: 'pcs', gramsPerPiece: 200 },
  garlic: { pieceUnit: 'clove', gramsPerPiece: 5 },
  'soy-sauce': { gramsPerTbsp: 18, densityGPerMl: 1.2 },
  sugar: { gramsPerTbsp: 9, densityGPerMl: 0.6 },
  // ...one entry per row of the tables below
};
```

Fill it from these two tables. Piece weights, every pair a preset recipe uses:

| id | unit | g | id | unit | g |
|---|---|---|---|---|---|
| egg | pcs | 60 | onion | pcs | 200 |
| carrot | pcs | 150 | potato | pcs | 130 |
| tomato | pcs | 150 | cucumber | pcs | 100 |
| eggplant | pcs | 80 | bell-pepper | pcs | 35 |
| paprika | pcs | 150 | zucchini | pcs | 200 |
| lemon | pcs | 100 | shiitake | pcs | 15 |
| button-mushroom | pcs | 12 | green-beans | pcs | 5 |
| chili-pepper | pcs | 1 | shiso | pcs | 1 |
| ginger | pcs | 15 | sausage | pcs | 20 |
| crab-stick | pcs | 10 | chicken-breast | pcs | 250 |
| garlic | clove | 5 | bacon | slice | 17 |
| ham | slice | 15 | bread | slice | 60 |
| mackerel | slice | 80 | salmon | slice | 80 |
| pork-loin | slice | 100 | aburaage | sheet | 30 |
| gyoza-wrappers | sheet | 6 | spinach | bunch | 200 |
| garlic-chives | bunch | 100 | burdock | stalk | 180 |
| celery | stalk | 100 | canned-tomatoes | can | 400 |
| udon | pack | 200 | yakisoba-noodles | pack | 150 |

Add piece weights for other commonly counted produce so pantry entries convert too: apple 250, banana 100, mandarin 80, kiwi 100, peach 200, avocado 140, turnip 80, okra 8, corn 200, napa-cabbage 1000, cabbage 1000, lettuce 300, daikon 800, pumpkin 1000, broccoli 250, lotus-root 200, bamboo-shoot 200, asparagus 25, sweet-potato 200, tofu 300, atsuage 120, natto 45, mochi 50, chikuwa 30, konnyaku 250, chicken-thigh 250, chicken-wings 40, sliced-cheese 18, scallop 20, squid 200, shrimp 15, umeboshi 8, strawberry 15, grape 5 — all `pieceUnit: 'pcs'` except `sliced-cheese` which is `slice`.

Spoon weights and densities for the seasonings preset recipes measure by spoon:

| id | g/tbsp | density | id | g/tbsp | density |
|---|---|---|---|---|---|
| soy-sauce | 18 | 1.2 | miso | 18 | 1.2 |
| mirin | 18 | 1.2 | sake | 15 | 1.0 |
| rice-vinegar | 15 | 1.0 | sugar | 9 | 0.6 |
| salt | 18 | 1.2 | cooking-oil | 12 | 0.92 |
| sesame-oil | 12 | 0.92 | olive-oil | 12 | 0.92 |
| ra-yu | 12 | 0.92 | mayonnaise | 12 | 0.9 |
| ketchup | 15 | 1.0 | worcestershire | 16 | 1.1 |
| tonkatsu-sauce | 16 | 1.1 | oyster-sauce | 18 | 1.2 |
| mentsuyu | 15 | 1.0 | ponzu | 15 | 1.0 |
| doubanjiang | 15 | 1.0 | tianmianjiang | 18 | 1.2 |
| gochujang | 18 | 1.2 | yakiniku-sauce | 15 | 1.0 |
| honey | 21 | 1.4 | sesame-seeds | 9 | 0.6 |
| sesame-paste | 15 | 1.0 | potato-starch | 9 | 0.6 |
| flour | 9 | 0.6 | bread-crumbs | 3 | 0.2 |
| parmesan | 6 | 0.4 | dashi-granules | 9 | 0.6 |
| chicken-stock-powder | 9 | 0.6 | consomme | 9 | 0.6 |
| curry-powder | 6 | 0.4 | black-pepper | 6 | 0.4 |
| dried-herbs | 2 | 0.13 | wasabi | 15 | 1.0 |
| karashi | 15 | 1.0 | white-wine | 15 | 1.0 |
| heavy-cream | 15 | 1.0 | milk | 15 | 1.03 |
| soy-milk | 15 | 1.03 | curry-roux | 18 | 1.2 |
| tempura-bits | 2 | 0.13 | katsuobushi | 2 | 0.13 |
| wakame | 2 | 0.13 | | | |

- [ ] **Step 4: Add the data integrity test**

Append to `src/data/data.test.ts`:
```ts
import { CONVERSIONS } from './conversions';
import { toGrams } from '../domain/units';

describe('conversions', () => {
  it('only names real preset ingredients', () => {
    for (const id of Object.keys(CONVERSIONS)) {
      expect(PRESET_INGREDIENT_IDS.has(id), id).toBe(true);
    }
  });
  it('resolves every countable amount used by a preset recipe', () => {
    const countable = new Set(['pcs', 'clove', 'slice', 'bunch', 'sheet', 'can', 'pack', 'stalk']);
    for (const r of PRESET_RECIPES) {
      for (const ri of r.ingredients) {
        if (ri.amount === undefined || !ri.unit || !countable.has(ri.unit)) continue;
        expect(toGrams(ri.amount, ri.unit, ri.ingredientId), `${r.id} -> ${ri.ingredientId} ${ri.unit}`).not.toBeNull();
      }
    }
  });
  it('has positive, plausible weights', () => {
    for (const [id, c] of Object.entries(CONVERSIONS)) {
      if (c.gramsPerPiece !== undefined) {
        expect(c.pieceUnit, id).toBeTruthy();
        expect(c.gramsPerPiece, id).toBeGreaterThan(0);
        expect(c.gramsPerPiece, id).toBeLessThanOrEqual(2000);
      }
      if (c.gramsPerTbsp !== undefined) {
        expect(c.gramsPerTbsp, id).toBeGreaterThan(0);
        expect(c.gramsPerTbsp, id).toBeLessThanOrEqual(25);
      }
      if (c.densityGPerMl !== undefined) {
        expect(c.densityGPerMl, id).toBeGreaterThan(0);
        expect(c.densityGPerMl, id).toBeLessThanOrEqual(2);
      }
    }
  });
});
```

Run: `npx vitest run src/domain/units src/data` — Expected: PASS. If the countable test fails, add the missing pair to `CONVERSIONS` rather than loosening the test.

- [ ] **Step 5: Commit**

```bash
git add src/domain/units.ts src/domain/units.test.ts src/data/conversions.ts src/data/data.test.ts
git commit -m "feat(domain): convert recipe and pantry amounts to grams"
```

---
### Task 3: Structured quantity in the pantry

**Files:**
- Modify: `src/features/pantry/PantryItemSheet.tsx`, `src/features/pantry/PantryItemRow.tsx`, `src/features/pantry/PantryPage.test.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/features/pantry/PantryPage.test.tsx`

**Interfaces:**
- Consumes: `Quantity`, `UNITS` from types; `formatQuantity(amount, unit, lang, t)` from `src/domain/scaling.ts`.
- Produces: nothing new for other tasks.

- [ ] **Step 1: Add the i18n keys**

In `src/i18n/en.ts` add, and mirror in `ja.ts`:
```ts
  'pantry.amount': 'Amount',
  'pantry.unit': 'Unit',
  'pantry.noUnit': '—',
  'pantry.note': 'Note',
  'pantry.notePlaceholder': 'e.g. opened, half used',
```
Japanese: `数量`, `単位`, `—`, `メモ`, `例: 開封済み、半分使用`.

- [ ] **Step 2: Write the failing test**

Replace the skipped test from Task 1 in `src/features/pantry/PantryPage.test.tsx`:
```ts
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
```

Run: `npx vitest run src/features/pantry` — Expected: FAIL.

- [ ] **Step 3: Rewrite the sheet form fields**

In `PantryItemForm` inside `src/features/pantry/PantryItemSheet.tsx`, replace the single quantity input. State becomes:
```ts
  const [amount, setAmount] = useState(item.quantity ? String(item.quantity.amount) : '');
  const [unit, setUnit] = useState<Unit>(item.quantity?.unit ?? 'g');
  const [note, setNote] = useState(item.note ?? '');
```
Fields:
```tsx
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-stone-600">{t('pantry.amount')}</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-stone-600">{t('pantry.unit')}</span>
            <select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`unit.${u}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.note')}</span>
          <input
            className={inputClass}
            value={note}
            placeholder={t('pantry.notePlaceholder')}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
```
Save builds the quantity only when the amount parses to a positive number:
```ts
    const parsedAmount = Number(amount);
    const quantity =
      amount.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0
        ? { amount: parsedAmount, unit }
        : undefined;
    updatePantryItem(item.ingredientId, {
      quantity,
      note: note.trim() || undefined,
      expiresOn: expiresOn || undefined,
      location: location || undefined,
    });
```

- [ ] **Step 4: Render the quantity and note in the row**

In `src/features/pantry/PantryItemRow.tsx` replace the quantity line:
```tsx
          {item.quantity && (
            <span className="text-xs text-stone-500">
              {formatQuantity(item.quantity.amount, item.quantity.unit, lang, t)}
            </span>
          )}
          {item.note && <span className="text-xs text-stone-400">{item.note}</span>}
```
Import `formatQuantity` from `../../domain/scaling`.

Run: `npx vitest run src/features/pantry` — Expected: PASS.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run build && npm run lint` — Expected: all pass.
```bash
git add src/features/pantry src/i18n
git commit -m "feat(pantry): enter quantities as a number with a unit, plus a free note"
```

---

### Task 4: Ingredient filter

**Files:**
- Create: `src/components/IngredientFilterSheet.tsx`
- Modify: `src/features/suggestions/SuggestionsPage.tsx`, `src/features/recipes/RecipesPage.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/features/suggestions/SuggestionsPage.test.tsx`

**Interfaces:**
- Consumes: `useAllIngredients`, `useIngredientName`, `IngredientPicker`, `expiryStatus`.
- Produces: `IngredientFilterSheet` with props `{ open: boolean; selected: string[]; onChange: (ids: string[]) => void; onClose: () => void }`, and `recipeUsesAll(recipe: Recipe, ids: string[]): boolean` exported from the same file.

- [ ] **Step 1: Add the i18n keys**

English, mirrored in Japanese:
```ts
  'filter.byIngredient': 'Filter by ingredient',
  'filter.title': 'Cook with these',
  'filter.fromPantry': 'In your pantry',
  'filter.other': 'Other ingredients',
  'filter.clear': 'Clear',
  'filter.apply': 'Apply',
  'filter.activeCount': '{count} selected',
  'filter.remove': 'Remove {name}',
```
Japanese: `食材で絞り込む`, `この食材を使う`, `在庫にあるもの`, `その他の食材`, `クリア`, `決定`, `{count}品を選択中`, `{name}を外す`.

- [ ] **Step 2: Write the failing test**

Append to `src/features/suggestions/SuggestionsPage.test.tsx`:
```ts
  it('filters recipes down to those using every selected ingredient', async () => {
    stock('egg', 'sugar', 'soy-sauce', 'dashi-granules', 'cooking-oil', 'rice', 'chicken-thigh', 'onion');
    renderWithRouter(<SuggestionsPage />);
    expect(screen.getByText('Tamagoyaki (rolled omelette)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Filter by ingredient' }));
    const sheet = screen.getByRole('dialog', { name: 'Cook with these' });
    await userEvent.click(within(sheet).getByRole('checkbox', { name: 'Chicken thigh' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Apply' }));
    expect(screen.queryByText('Tamagoyaki (rolled omelette)')).not.toBeInTheDocument();
    expect(screen.getByText('Oyakodon (chicken and egg rice bowl)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Chicken thigh' }));
    expect(screen.getByText('Tamagoyaki (rolled omelette)')).toBeInTheDocument();
  });
```

Run: `npx vitest run src/features/suggestions` — Expected: FAIL.

- [ ] **Step 3: Build the sheet**

`src/components/IngredientFilterSheet.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { expiryStatus, todayIso } from '../domain/dates';
import { localize } from '../domain/localize';
import type { Recipe } from '../domain/types';
import { useLang, useT } from '../i18n';
import { useAllIngredients, useIngredientName } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { IngredientPicker } from '../features/pantry/IngredientPicker';
import { Button } from './Button';
import { Sheet } from './Sheet';

/** A recipe passes the filter when it lists every selected ingredient, optional ones included. */
export function recipeUsesAll(recipe: Recipe, ids: string[]): boolean {
  if (ids.length === 0) return true;
  const used = new Set(recipe.ingredients.map((ri) => ri.ingredientId));
  return ids.every((id) => used.has(id));
}

interface Props {
  open: boolean;
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

export function IngredientFilterSheet({ open, selected, onChange, onClose }: Props) {
  const t = useT();
  const lang = useLang();
  const nameOf = useIngredientName();
  const all = useAllIngredients();
  const pantry = useAppStore((s) => s.pantry);
  const trackExpiry = useAppStore((s) => s.trackExpiry);
  const [draft, setDraft] = useState<string[]>(selected);
  const today = todayIso();

  const pantryIds = useMemo(() => {
    const rank = (id: string) => {
      if (!trackExpiry) return 2;
      const item = pantry.find((p) => p.ingredientId === id);
      const status = expiryStatus(item?.expiresOn, today);
      return status === 'expired' ? 0 : status === 'soon' ? 1 : 2;
    };
    return pantry
      .map((p) => p.ingredientId)
      .sort((a, b) => rank(a) - rank(b) || nameOf(a).localeCompare(nameOf(b), lang));
  }, [pantry, trackExpiry, today, nameOf, lang]);

  const toggle = (id: string) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const extras = draft.filter((id) => !pantryIds.includes(id));

  return (
    <Sheet open={open} onClose={onClose} title={t('filter.title')}>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-700">{t('filter.fromPantry')}</h3>
          <ul className="max-h-64 overflow-y-auto rounded-xl border border-stone-200">
            {pantryIds.map((id) => (
              <li key={id} className="border-b border-stone-100 last:border-b-0">
                <label className="flex items-center gap-3 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-emerald-600"
                    checked={draft.includes(id)}
                    onChange={() => toggle(id)}
                    aria-label={nameOf(id)}
                  />
                  <span className="truncate">{nameOf(id)}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-700">{t('filter.other')}</h3>
          <IngredientPicker
            onPick={(id) => setDraft((d) => (d.includes(id) ? d : [...d, id]))}
            placeholder={t('pantry.searchPlaceholder')}
            allowCreate={false}
          />
          {extras.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {extras.map((id) => (
                <li key={id} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                  {localize(all.find((i) => i.id === id)?.name, lang) || id}
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => setDraft([])}>{t('filter.clear')}</Button>
          <Button onClick={() => { onChange(draft); onClose(); }}>{t('filter.apply')}</Button>
        </div>
      </div>
    </Sheet>
  );
}
```
`IngredientPicker` already accepts `allowCreate`. The sheet renders children only while open, so `draft` starts fresh each time it is opened.

- [ ] **Step 4: Wire it into both pages**

In `SuggestionsPage.tsx` and `RecipesPage.tsx` add the same block. State and handler:
```tsx
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
```
Control row, under the cuisine chips:
```tsx
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setFilterOpen(true)}>
          {t('filter.byIngredient')}
        </Button>
        {filterIds.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={t('filter.remove', { name: nameOf(id) })}
            onClick={() => setFilterIds((ids) => ids.filter((x) => x !== id))}
            className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800"
          >
            {nameOf(id)} ✕
          </button>
        ))}
      </div>
      <IngredientFilterSheet
        open={filterOpen}
        selected={filterIds}
        onChange={setFilterIds}
        onClose={() => setFilterOpen(false)}
      />
```
Apply it where recipes are chosen. In `SuggestionsPage`, inside the `useMemo`, after the cuisine filter:
```ts
    const filtered = recipes
      .filter((r) => cuisine === 'all' || r.cuisine === cuisine)
      .filter((r) => recipeUsesAll(r, filterIds));
```
and add `filterIds` to the dependency array. In `RecipesPage`, add `if (!recipeUsesAll(recipe, filterIds)) return false;` to the existing `visible` filter and add `filterIds` to its dependencies. Both pages need `useIngredientName`.

Run: `npx vitest run src/features` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/IngredientFilterSheet.tsx src/features src/i18n
git commit -m "feat(suggestions): filter recipes by the ingredients you want to use"
```

---

### Task 5: Expiry tracking switch

**Files:**
- Modify: `src/domain/matching.ts`, `src/domain/matching.test.ts`, `src/features/suggestions/SuggestionsPage.tsx`, `src/features/pantry/PantryItemRow.tsx`, `src/features/pantry/PantryItemSheet.tsx`, `src/features/settings/SettingsPage.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/domain/matching.test.ts`, `src/features/pantry/PantryPage.test.tsx`

**Interfaces:**
- Produces: `SuggestionOptions.considerExpiry?: boolean`, defaulting to `true`.

- [ ] **Step 1: Add the i18n keys**

```ts
  'settings.trackExpiry': 'Track best-before dates',
  'settings.trackExpiryHint': 'Turn this off to hide the date field and its badges. Dates you already entered are kept.',
```
Japanese: `賞味期限を管理する`, `オフにすると入力欄とバッジを隠します。入力済みの日付は残ります。`

- [ ] **Step 2: Write the failing tests**

In `src/domain/matching.test.ts`:
```ts
  it('ignores expiry when considerExpiry is false', () => {
    const recipe = makeRecipe({ ingredients: [req('milk')] });
    const pantry = [makePantryItem('milk', { expiresOn: '2026-09-19' })];
    expect(evaluateRecipe(recipe, pantry, options).usesExpiring).toEqual(['milk']);
    expect(evaluateRecipe(recipe, pantry, { ...options, considerExpiry: false }).usesExpiring).toEqual([]);
  });
```
In `src/features/pantry/PantryPage.test.tsx`:
```ts
  it('hides the expiry field and badge when tracking is off', async () => {
    useAppStore.getState().addPantryItem('milk', { expiresOn: '2020-01-01' });
    useAppStore.getState().setTrackExpiry(false);
    renderWithRouter(<PantryPage />);
    expect(screen.queryByText('Expired')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Milk' }));
    expect(within(screen.getByRole('dialog')).queryByLabelText('Best before')).not.toBeInTheDocument();
  });
```

Run: `npx vitest run src/domain/matching src/features/pantry` — Expected: FAIL.

- [ ] **Step 3: Thread the flag through**

In `src/domain/matching.ts`:
```ts
export interface SuggestionOptions {
  almostThreshold: number;
  today: string;
  /** When false, expiring pantry items never influence the result. */
  considerExpiry?: boolean;
}
```
In `evaluateRecipe`, guard the push:
```ts
    if (options.considerExpiry !== false && expiryStatus(item.expiresOn, options.today) !== 'ok') {
      usesExpiring.push(ri.ingredientId);
    }
```
In `SuggestionsPage.tsx` read `const trackExpiry = useAppStore((s) => s.trackExpiry);` and pass `{ almostThreshold, today, considerExpiry: trackExpiry }`, adding `trackExpiry` to the dependency array.

In `PantryItemRow.tsx` read the flag and skip both badges when it is false. In `PantryItemForm` skip the best-before field when it is false, leaving `expiresOn` untouched on save:
```ts
    updatePantryItem(item.ingredientId, {
      quantity,
      note: note.trim() || undefined,
      expiresOn: trackExpiry ? expiresOn || undefined : item.expiresOn,
      location: location || undefined,
    });
```

- [ ] **Step 4: Add the settings switch**

In `SettingsPage.tsx`, a new section above the threshold section:
```tsx
      <Section title={t('settings.trackExpiry')}>
        <p className="text-xs text-stone-500">{t('settings.trackExpiryHint')}</p>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-emerald-600"
            checked={trackExpiry}
            onChange={(e) => setTrackExpiry(e.target.checked)}
            aria-label={t('settings.trackExpiry')}
          />
          <span>{trackExpiry ? t('common.on') : t('common.off')}</span>
        </label>
      </Section>
```
Add `'common.on'` and `'common.off'` keys, English `On` and `Off`, Japanese `オン` and `オフ`.

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain src/features src/i18n
git commit -m "feat(settings): add a switch to turn best-before tracking off"
```

---

### Task 6: Selective data clearing

**Files:**
- Create: `src/features/settings/ClearDataSheet.tsx`
- Modify: `src/features/settings/SettingsPage.tsx`, `src/features/settings/SettingsPage.test.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/features/settings/SettingsPage.test.tsx`

**Interfaces:**
- Consumes: `clearData(selection: ClearSelection)` from Task 1.

- [ ] **Step 1: Add the i18n keys**

```ts
  'clear.title': 'Delete data',
  'clear.open': 'Delete data',
  'clear.pantry': 'Pantry',
  'clear.shoppingList': 'Shopping list',
  'clear.customRecipes': 'My recipes',
  'clear.customIngredients': 'Ingredients I added',
  'clear.cookingLog': 'Cooking log',
  'clear.settings': 'Settings back to defaults',
  'clear.ingredientWarning': 'Recipes that used an ingredient you delete will show it as unknown.',
  'clear.confirmTitle': 'Delete the selected data?',
  'clear.confirmBody': 'This cannot be undone. Preset recipes and ingredients always stay.',
  'clear.none': 'Nothing selected.',
  'clear.done': 'Deleted',
```
Japanese: `データを削除`, `データを削除`, `在庫`, `買い物リスト`, `マイレシピ`, `追加した食材`, `調理ログ`, `設定を初期値に戻す`, `削除した食材を使っていたレシピは、不明な材料として表示されます。`, `選んだデータを削除しますか？`, `この操作は取り消せません。プリセットのレシピと食材は必ず残ります。`, `何も選ばれていません。`, `削除しました`.

- [ ] **Step 2: Write the failing test**

Replace the reset test in `src/features/settings/SettingsPage.test.tsx`:
```ts
  it('deletes only the selected parts', async () => {
    const s = useAppStore.getState();
    s.addPantryItem('egg');
    s.addToShopping('milk');
    renderWithRouter(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete data' }));
    const sheet = screen.getByRole('dialog', { name: 'Delete data' });
    await userEvent.click(within(sheet).getByRole('checkbox', { name: 'Pantry' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Delete data' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Delete the selected data?' })).getByRole('button', { name: 'Confirm' }));
    expect(useAppStore.getState().pantry).toHaveLength(0);
    expect(useAppStore.getState().shoppingList).toHaveLength(1);
  });
```

Run: `npx vitest run src/features/settings` — Expected: FAIL.

- [ ] **Step 3: Build the sheet**

`src/features/settings/ClearDataSheet.tsx`:
```tsx
import { useState } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Sheet } from '../../components/Sheet';
import { useToastStore } from '../../components/toastStore';
import { useT, type TranslationKey } from '../../i18n';
import { useAppStore, type ClearSelection } from '../../store/useAppStore';

const ROWS: Array<{ key: keyof ClearSelection; label: TranslationKey }> = [
  { key: 'pantry', label: 'clear.pantry' },
  { key: 'shoppingList', label: 'clear.shoppingList' },
  { key: 'customRecipes', label: 'clear.customRecipes' },
  { key: 'customIngredients', label: 'clear.customIngredients' },
  { key: 'cookingLog', label: 'clear.cookingLog' },
  { key: 'settings', label: 'clear.settings' },
];

export function ClearDataSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const clearData = useAppStore((s) => s.clearData);
  const showToast = useToastStore((s) => s.show);
  const [selection, setSelection] = useState<ClearSelection>({});
  const [confirming, setConfirming] = useState(false);
  const anySelected = Object.values(selection).some(Boolean);

  const apply = () => {
    clearData(selection);
    setConfirming(false);
    setSelection({});
    onClose();
    showToast(t('clear.done'));
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title={t('clear.title')}>
        <ul className="mb-3 flex flex-col gap-1">
          {ROWS.map((row) => (
            <li key={row.key}>
              <label className="flex items-center gap-3 py-1 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-red-600"
                  checked={Boolean(selection[row.key])}
                  onChange={(e) => setSelection((s) => ({ ...s, [row.key]: e.target.checked }))}
                  aria-label={t(row.label)}
                />
                <span>{t(row.label)}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mb-3 text-xs text-stone-500">{t('clear.ingredientWarning')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="danger" disabled={!anySelected} onClick={() => setConfirming(true)}>
            {t('clear.open')}
          </Button>
        </div>
        {!anySelected && <p className="mt-2 text-right text-xs text-stone-400">{t('clear.none')}</p>}
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title={t('clear.confirmTitle')}
        body={t('clear.confirmBody')}
        confirmLabel={t('common.confirm')}
        danger
        onConfirm={apply}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
```

- [ ] **Step 4: Replace the reset button**

In `SettingsPage.tsx` drop `resetAll`, `confirmingReset` and its dialog. The data section's third button becomes:
```tsx
          <Button variant="danger" onClick={() => setClearOpen(true)}>{t('clear.open')}</Button>
```
with `const [clearOpen, setClearOpen] = useState(false);` and `<ClearDataSheet open={clearOpen} onClose={() => setClearOpen(false)} />` beside the import dialog. Leave `resetAll` in the store; it is still used by tests and costs nothing.

Run: `npx vitest run src/features/settings` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings src/i18n
git commit -m "feat(settings): choose which data to delete instead of clearing everything"
```

---

### Task 7: Nutrition

**Files:**
- Create: `src/domain/nutrition.ts`, `src/data/nutrition.ts`
- Modify: `src/data/data.test.ts`
- Test: `src/domain/nutrition.test.ts`

**Interfaces:**
- Consumes: `toGrams` from Task 2; `scaleAmount` from `src/domain/scaling.ts`; `NUTRIENT_KEYS`, `NutrientKey`, `NutritionTotals` from `src/domain/types.ts`.
- Produces: `NUTRIENT_DIRECTION`, `NUTRIENT_DISPLAY_UNIT`, `emptyTotals()`, `addScaled(target, row, grams)`, `computeRecipeNutrition(recipe, servings)`, `RecipeNutrition`, `NUTRITION`, `NutritionRow`.

- [ ] **Step 1: Write the failing test**

`src/domain/nutrition.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../test/factories';
import { computeRecipeNutrition, emptyTotals } from './nutrition';

describe('emptyTotals', () => {
  it('has every nutrient at zero', () => {
    expect(emptyTotals().energy).toBe(0);
    expect(Object.keys(emptyTotals())).toHaveLength(14);
  });
});

describe('computeRecipeNutrition', () => {
  it('sums required ingredients and scales with servings', () => {
    // 2 eggs at 60 g each, egg is about 142 kcal per 100 g.
    const recipe = makeRecipe({ baseServings: 2, ingredients: [{ ingredientId: 'egg', amount: 2, unit: 'pcs' }] });
    const two = computeRecipeNutrition(recipe, 2);
    expect(two.total.energy).toBeGreaterThan(150);
    expect(two.total.energy).toBeLessThan(190);
    expect(two.perServing.energy).toBeCloseTo(two.total.energy / 2, 1);
    const four = computeRecipeNutrition(recipe, 4);
    expect(four.total.energy).toBeCloseTo(two.total.energy * 2, 0);
  });
  it('reports ingredients it cannot count', () => {
    const recipe = makeRecipe({
      ingredients: [
        { ingredientId: 'egg', amount: 1, unit: 'pcs' },
        { ingredientId: 'salt' },
        { ingredientId: 'sugar', amount: 1, unit: 'tbsp', optional: true },
        { ingredientId: 'made-up-thing', amount: 100, unit: 'g' },
      ],
    });
    const result = computeRecipeNutrition(recipe, 2);
    expect(result.countedIngredientIds).toEqual(['egg']);
    expect(result.unknownIngredientIds).toEqual(['salt', 'sugar', 'made-up-thing']);
  });
  it('counts salt from seasonings', () => {
    const recipe = makeRecipe({ ingredients: [{ ingredientId: 'soy-sauce', amount: 2, unit: 'tbsp' }] });
    expect(computeRecipeNutrition(recipe, 2).total.salt).toBeGreaterThan(4);
  });
});
```

Run: `npx vitest run src/domain/nutrition` — Expected: FAIL.

- [ ] **Step 2: Implement the module**

`src/domain/nutrition.ts`:
```ts
import { NUTRITION, type NutritionRow } from '../data/nutrition';
import { scaleAmount } from './scaling';
import { NUTRIENT_KEYS, type NutrientKey, type NutritionTotals, type Recipe } from './types';
import { toGrams } from './units';

export const NUTRIENT_DIRECTION: Record<NutrientKey, 'at_least' | 'at_most' | 'neutral'> = {
  energy: 'neutral',
  protein: 'at_least',
  fat: 'neutral',
  carbs: 'neutral',
  fiber: 'at_least',
  salt: 'at_most',
  calcium: 'at_least',
  iron: 'at_least',
  potassium: 'at_least',
  vitaminA: 'at_least',
  vitaminB1: 'at_least',
  vitaminB2: 'at_least',
  vitaminC: 'at_least',
  vitaminD: 'at_least',
};

export const NUTRIENT_DISPLAY_UNIT: Record<NutrientKey, string> = {
  energy: 'kcal', protein: 'g', fat: 'g', carbs: 'g', fiber: 'g', salt: 'g',
  calcium: 'mg', iron: 'mg', potassium: 'mg',
  vitaminA: 'µg', vitaminB1: 'mg', vitaminB2: 'mg', vitaminC: 'mg', vitaminD: 'µg',
};

export function emptyTotals(): NutritionTotals {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as NutritionTotals;
}

/** Adds one ingredient's contribution: the row is per 100 g. */
export function addScaled(target: NutritionTotals, row: NutritionRow, grams: number): void {
  const factor = grams / 100;
  NUTRIENT_KEYS.forEach((key, index) => {
    target[key] += row[index] * factor;
  });
}

function round(totals: NutritionTotals): NutritionTotals {
  const out = emptyTotals();
  for (const key of NUTRIENT_KEYS) {
    out[key] = key === 'energy' ? Math.round(totals[key]) : Math.round(totals[key] * 10) / 10;
  }
  return out;
}

export interface RecipeNutrition {
  total: NutritionTotals;
  perServing: NutritionTotals;
  countedIngredientIds: string[];
  unknownIngredientIds: string[];
}

/** Required ingredients with a known amount, conversion and nutrition row are counted; the rest are reported. */
export function computeRecipeNutrition(recipe: Recipe, servings: number): RecipeNutrition {
  const raw = emptyTotals();
  const counted: string[] = [];
  const unknown: string[] = [];
  for (const ri of recipe.ingredients) {
    const row = NUTRITION[ri.ingredientId];
    const grams =
      ri.optional || ri.amount === undefined || !ri.unit
        ? null
        : toGrams(scaleAmount(ri.amount, recipe.baseServings, servings), ri.unit, ri.ingredientId);
    if (grams === null || !row) {
      unknown.push(ri.ingredientId);
      continue;
    }
    addScaled(raw, row, grams);
    counted.push(ri.ingredientId);
  }
  const perServingRaw = emptyTotals();
  for (const key of NUTRIENT_KEYS) perServingRaw[key] = raw[key] / Math.max(1, servings);
  return {
    total: round(raw),
    perServing: round(perServingRaw),
    countedIngredientIds: counted,
    unknownIngredientIds: unknown,
  };
}
```

- [ ] **Step 3: Write the nutrition table**

`src/data/nutrition.ts`:
```ts
/**
 * Values per 100 g edible portion, in NUTRIENT_KEYS order:
 * energy kcal, protein g, fat g, carbs g, fiber g, salt g,
 * calcium mg, iron mg, potassium mg,
 * vitaminA µgRAE, vitaminB1 mg, vitaminB2 mg, vitaminC mg, vitaminD µg.
 *
 * Approximations based on the Japanese standard tables of food composition.
 * Macronutrients are close; micronutrients are rough. Every screen says so.
 */
export type NutritionRow = readonly [
  number, number, number, number, number, number,
  number, number, number,
  number, number, number, number, number,
];

export const NUTRITION: Record<string, NutritionRow> = {
  egg: [142, 12.2, 10.2, 0.4, 0, 0.4, 46, 1.5, 130, 210, 0.06, 0.37, 0, 3.8],
  onion: [33, 1.0, 0.1, 8.4, 1.5, 0, 17, 0.3, 150, 0, 0.04, 0.01, 7, 0],
  'soy-sauce': [77, 7.7, 0, 7.9, 0, 14.5, 29, 1.7, 390, 0, 0.05, 0.17, 0, 0],
  // ...one row for every id in PRESET_INGREDIENTS
};
```

Write a row for every id in `src/data/ingredients.ts`, in the same order as that file so the two read side by side. The data test in step 4 fails until all 164 are present, which is the completeness check. Guidance for the rougher values: use 0 where a nutrient is genuinely absent, such as vitamin C in oils or vitamin D in vegetables. Salt is the value that matters most for seasonings, so take care with soy sauce, miso, stock powders, sauces and salt itself.

- [ ] **Step 4: Add the data integrity test**

Append to `src/data/data.test.ts`:
```ts
import { NUTRITION } from './nutrition';
import { NUTRIENT_KEYS } from '../domain/types';

describe('nutrition data', () => {
  it('covers every preset ingredient exactly once', () => {
    for (const ing of PRESET_INGREDIENTS) {
      expect(NUTRITION[ing.id], `missing nutrition for ${ing.id}`).toBeDefined();
    }
    for (const id of Object.keys(NUTRITION)) {
      expect(PRESET_INGREDIENT_IDS.has(id), id).toBe(true);
    }
  });
  it('has 14 finite, non-negative values per row', () => {
    for (const [id, row] of Object.entries(NUTRITION)) {
      expect(row, id).toHaveLength(NUTRIENT_KEYS.length);
      for (const value of row) {
        expect(Number.isFinite(value), id).toBe(true);
        expect(value, id).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('keeps energy consistent with the macronutrients', () => {
    for (const [id, row] of Object.entries(NUTRITION)) {
      const [energy, protein, fat, carbs] = row;
      const estimate = protein * 4 + fat * 9 + carbs * 4;
      const tolerance = Math.max(25, estimate * 0.3);
      expect(Math.abs(energy - estimate), `${id}: ${energy} vs ${estimate}`).toBeLessThanOrEqual(tolerance);
    }
  });
  it('keeps every value inside a plausible range', () => {
    const max = [900, 100, 100, 100, 80, 100, 1500, 60, 3000, 15000, 5, 5, 500, 60];
    for (const [id, row] of Object.entries(NUTRITION)) {
      row.forEach((value, index) => {
        expect(value, `${id} index ${index}`).toBeLessThanOrEqual(max[index]);
      });
    }
  });
});
```

Run: `npx vitest run src/domain/nutrition src/data` — Expected: PASS. Fix data, not tolerances, when the energy check fails.

- [ ] **Step 5: Commit**

```bash
git add src/domain/nutrition.ts src/domain/nutrition.test.ts src/data/nutrition.ts src/data/data.test.ts
git commit -m "feat(nutrition): add per-ingredient composition data and recipe totals"
```

---

### Task 8: Daily targets

**Files:**
- Create: `src/data/targets.ts`, `src/domain/targets.ts`
- Modify: `src/features/settings/SettingsPage.tsx`, `src/data/data.test.ts`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/domain/targets.test.ts`

**Interfaces:**
- Produces: `DAILY_TARGETS: Record<'adult_male' | 'adult_female', NutritionTotals>`, `targetsFor(key: NutritionTargetKey): NutritionTotals | null`, `percentOfTarget(totals, key): Partial<Record<NutrientKey, number>>`.

- [ ] **Step 1: Write the failing test**

`src/domain/targets.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emptyTotals } from './nutrition';
import { percentOfTarget, targetsFor } from './targets';

describe('targets', () => {
  it('returns null when targets are off', () => {
    expect(targetsFor('off')).toBeNull();
  });
  it('gives a lower energy target for the adult female profile', () => {
    expect(targetsFor('adult_female')!.energy).toBeLessThan(targetsFor('adult_male')!.energy);
  });
  it('computes percentages and clamps the display at 200', () => {
    const totals = { ...emptyTotals(), energy: 1325, salt: 100 };
    const pct = percentOfTarget(totals, 'adult_male');
    expect(pct.energy).toBeCloseTo(50, 0);
    expect(pct.salt).toBe(200);
  });
  it('returns an empty object when targets are off', () => {
    expect(percentOfTarget(emptyTotals(), 'off')).toEqual({});
  });
});
```

Run: `npx vitest run src/domain/targets` — Expected: FAIL.

- [ ] **Step 2: Write the target data**

`src/data/targets.ts`:
```ts
import type { NutritionTotals } from '../domain/types';

/**
 * Daily reference intakes for adults aged 18 to 64 at ordinary activity level,
 * following the Japanese dietary reference intakes. Reference points, not prescriptions.
 * Salt is an upper limit; fat and carbohydrate are midpoints of their energy ranges.
 */
export const DAILY_TARGETS: Record<'adult_male' | 'adult_female', NutritionTotals> = {
  adult_male: {
    energy: 2650, protein: 65, fat: 73, carbs: 364, fiber: 21, salt: 7.5,
    calcium: 750, iron: 7.5, potassium: 3000,
    vitaminA: 850, vitaminB1: 1.4, vitaminB2: 1.6, vitaminC: 100, vitaminD: 8.5,
  },
  adult_female: {
    energy: 2000, protein: 50, fat: 55, carbs: 275, fiber: 18, salt: 6.5,
    calcium: 650, iron: 10.5, potassium: 2600,
    vitaminA: 650, vitaminB1: 1.1, vitaminB2: 1.2, vitaminC: 100, vitaminD: 8.5,
  },
};
```

`src/domain/targets.ts`:
```ts
import { DAILY_TARGETS } from '../data/targets';
import { NUTRIENT_KEYS, type NutrientKey, type NutritionTargetKey, type NutritionTotals } from './types';

export const MAX_DISPLAY_PERCENT = 200;

export function targetsFor(key: NutritionTargetKey): NutritionTotals | null {
  return key === 'off' ? null : DAILY_TARGETS[key];
}

/** Percentage of the daily reference intake, clamped for display. */
export function percentOfTarget(
  totals: NutritionTotals,
  key: NutritionTargetKey,
): Partial<Record<NutrientKey, number>> {
  const target = targetsFor(key);
  if (!target) return {};
  const out: Partial<Record<NutrientKey, number>> = {};
  for (const nutrient of NUTRIENT_KEYS) {
    const goal = target[nutrient];
    if (goal > 0) out[nutrient] = Math.min(MAX_DISPLAY_PERCENT, Math.round((totals[nutrient] / goal) * 1000) / 10);
  }
  return out;
}
```

- [ ] **Step 3: Add the settings control and i18n**

Keys, English then Japanese:
```ts
  'settings.nutritionTarget': 'Daily nutrition reference',
  'settings.nutritionTargetHint': 'Shows how a meal compares with a typical adult daily intake. Estimates only.',
  'target.off': 'Do not show',
  'target.adult_male': 'Adult male',
  'target.adult_female': 'Adult female',
```
Japanese: `栄養の目安`, `成人の1日の摂取量と比べた割合を表示します。あくまで目安です。`, `表示しない`, `成人男性`, `成人女性`.

New settings section using the existing `Chip` component, one chip per key of `['off', 'adult_male', 'adult_female']`, bound to `nutritionTarget` and `setNutritionTarget`.

- [ ] **Step 4: Add the data integrity test**

Append to `src/data/data.test.ts`:
```ts
import { DAILY_TARGETS } from './targets';

describe('daily targets', () => {
  it('define every nutrient with a positive value', () => {
    for (const [profile, totals] of Object.entries(DAILY_TARGETS)) {
      for (const key of NUTRIENT_KEYS) {
        expect(totals[key], `${profile}.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
```

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/targets.ts src/domain/targets.ts src/domain/targets.test.ts src/features/settings src/data/data.test.ts src/i18n
git commit -m "feat(nutrition): add daily reference intakes and a profile setting"
```

---
### Task 9: Nutrition panel and gram display on recipe detail

**Files:**
- Create: `src/components/NutritionPanel.tsx`
- Modify: `src/features/recipes/RecipeDetailPage.tsx`, `src/features/recipes/RecipeDetailPage.test.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/features/recipes/RecipeDetailPage.test.tsx`

**Interfaces:**
- Consumes: `computeRecipeNutrition`, `NUTRIENT_DIRECTION`, `NUTRIENT_DISPLAY_UNIT` from Task 7; `percentOfTarget` from Task 8; `toGrams` from Task 2.
- Produces: `NutritionPanel` with props `{ totals: NutritionTotals; heading: string; unknownCount?: number }`.

- [ ] **Step 1: Add the i18n keys**

```ts
  'nutrition.title': 'Nutrition',
  'nutrition.perServing': 'Per serving',
  'nutrition.whole': 'Whole recipe',
  'nutrition.estimate': 'Estimated from the ingredient amounts. Treat it as a rough guide.',
  'nutrition.excluded': '{count} ingredients are not included',
  'nutrition.ofDaily': '{percent}% of a day',
  'nutrition.energy': 'Energy',
  'nutrition.protein': 'Protein',
  'nutrition.fat': 'Fat',
  'nutrition.carbs': 'Carbohydrate',
  'nutrition.fiber': 'Fibre',
  'nutrition.salt': 'Salt',
  'nutrition.calcium': 'Calcium',
  'nutrition.iron': 'Iron',
  'nutrition.potassium': 'Potassium',
  'nutrition.vitaminA': 'Vitamin A',
  'nutrition.vitaminB1': 'Vitamin B1',
  'nutrition.vitaminB2': 'Vitamin B2',
  'nutrition.vitaminC': 'Vitamin C',
  'nutrition.vitaminD': 'Vitamin D',
  'recipe.amountDisplay': 'Amounts',
  'recipe.amountAsWritten': 'As written',
  'recipe.amountGrams': 'Grams',
  'recipe.cooked': 'I cooked this',
```
Japanese: `栄養`, `1人分`, `レシピ全体`, `材料の分量から計算した目安です。`, `{count}品は計算に含まれていません`, `1日の{percent}%`, `エネルギー`, `たんぱく質`, `脂質`, `炭水化物`, `食物繊維`, `食塩相当量`, `カルシウム`, `鉄`, `カリウム`, `ビタミンA`, `ビタミンB1`, `ビタミンB2`, `ビタミンC`, `ビタミンD`, `分量表示`, `レシピ通り`, `グラム`, `作った`.

- [ ] **Step 2: Write the failing test**

Append to `src/features/recipes/RecipeDetailPage.test.tsx`:
```ts
  it('shows nutrition per serving and for the whole recipe', async () => {
    renderDetail('teriyaki-chicken');
    const panel = screen.getByRole('region', { name: 'Nutrition' });
    expect(within(panel).getByText('Per serving')).toBeInTheDocument();
    expect(within(panel).getByText('Energy')).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: 'Whole recipe' }));
    expect(within(panel).getByRole('button', { name: 'Whole recipe' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('switches ingredient amounts to grams', async () => {
    renderDetail('teriyaki-chicken');
    expect(screen.getByText('300 g')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Grams' }));
    expect(useAppStore.getState().amountDisplay).toBe('grams');
    // 2 tbsp of soy sauce is about 36 g
    expect(screen.getByText('36 g')).toBeInTheDocument();
  });
```

Run: `npx vitest run src/features/recipes/RecipeDetailPage` — Expected: FAIL.

- [ ] **Step 3: Build the panel**

`src/components/NutritionPanel.tsx`:
```tsx
import { NUTRIENT_DIRECTION, NUTRIENT_DISPLAY_UNIT } from '../domain/nutrition';
import { percentOfTarget } from '../domain/targets';
import { NUTRIENT_KEYS, type NutritionTotals } from '../domain/types';
import { useT, type TranslationKey } from '../i18n';
import { useAppStore } from '../store/useAppStore';

interface Props {
  totals: NutritionTotals;
  heading: string;
  unknownCount?: number;
}

export function NutritionPanel({ totals, heading, unknownCount = 0 }: Props) {
  const t = useT();
  const targetKey = useAppStore((s) => s.nutritionTarget);
  const percent = percentOfTarget(totals, targetKey);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-stone-700">{heading}</p>
      <ul className="flex flex-col gap-1.5">
        {NUTRIENT_KEYS.map((key) => {
          const pct = percent[key];
          const over = pct !== undefined && NUTRIENT_DIRECTION[key] === 'at_most' && pct >= 100;
          return (
            <li key={key} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-stone-700">{t(`nutrition.${key}` as TranslationKey)}</span>
                <span className="tabular-nums text-stone-900">
                  {totals[key]} {NUTRIENT_DISPLAY_UNIT[key]}
                </span>
              </div>
              {pct !== undefined && (
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] text-stone-500">
                    {t('nutrition.ofDaily', { percent: pct })}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {unknownCount > 0 && (
        <p className="mt-2 text-xs text-amber-700">{t('nutrition.excluded', { count: unknownCount })}</p>
      )}
      <p className="mt-1 text-xs text-stone-400">{t('nutrition.estimate')}</p>
    </div>
  );
}
```

- [ ] **Step 4: Wire the recipe detail page**

Add above the ingredient list:
```tsx
      <div className="mb-3 flex gap-2">
        <Chip selected={amountDisplay === 'recipe'} onClick={() => setAmountDisplay('recipe')}>
          {t('recipe.amountAsWritten')}
        </Chip>
        <Chip selected={amountDisplay === 'grams'} onClick={() => setAmountDisplay('grams')}>
          {t('recipe.amountGrams')}
        </Chip>
      </div>
```
Replace the amount cell with a helper defined in the same file:
```tsx
  const amountLabel = (ri: RecipeIngredient) => {
    if (amountDisplay === 'grams' && ri.amount !== undefined && ri.unit) {
      const grams = toGrams(scaleAmount(ri.amount, recipe.baseServings, servings), ri.unit, ri.ingredientId);
      if (grams !== null) return `${Math.round(grams)} ${t('unit.g')}`;
    }
    return formatIngredientAmount(ri, recipe.baseServings, servings, lang, t);
  };
```
Add the nutrition section after the steps:
```tsx
      <section aria-label={t('nutrition.title')} className="mb-6">
        <h2 className="mb-2 text-base font-semibold">{t('nutrition.title')}</h2>
        <div className="mb-2 flex gap-2">
          <Chip selected={!wholeRecipe} onClick={() => setWholeRecipe(false)}>{t('nutrition.perServing')}</Chip>
          <Chip selected={wholeRecipe} onClick={() => setWholeRecipe(true)}>{t('nutrition.whole')}</Chip>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <NutritionPanel
            totals={wholeRecipe ? nutrition.total : nutrition.perServing}
            heading={wholeRecipe ? t('nutrition.whole') : t('nutrition.perServing')}
            unknownCount={nutrition.unknownIngredientIds.length}
          />
        </div>
      </section>
```
with `const [wholeRecipe, setWholeRecipe] = useState(false);` and
`const nutrition = useMemo(() => computeRecipeNutrition(recipe, servings), [recipe, servings]);`.
`Chip` already sets `aria-pressed`, which the test asserts.

Run: `npx vitest run src/features/recipes` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/NutritionPanel.tsx src/features/recipes src/i18n
git commit -m "feat(recipes): show nutrition per serving and switch amounts to grams"
```

---

### Task 10: Weekly grouping

**Files:**
- Create: `src/domain/cookingLog.ts`
- Test: `src/domain/cookingLog.test.ts`

**Interfaces:**
- Produces: `weekStart(iso: string): string`, `groupByWeek(entries: CookEntry[]): LogWeek[]`, `LogWeek`.

- [ ] **Step 1: Write the failing test**

`src/domain/cookingLog.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { groupByWeek, weekStart } from './cookingLog';
import { emptyTotals } from './nutrition';
import type { CookEntry } from './types';

const entry = (id: string, cookedOn: string, energy?: number): CookEntry => ({
  id,
  recipeId: `r-${id}`,
  recipeName: { en: `Recipe ${id}` },
  servings: 2,
  cookedOn,
  ...(energy === undefined ? {} : { nutrition: { ...emptyTotals(), energy } }),
});

describe('weekStart', () => {
  it('returns the Monday of that week', () => {
    expect(weekStart('2026-09-19')).toBe('2026-09-14'); // Saturday
    expect(weekStart('2026-09-14')).toBe('2026-09-14'); // Monday
    expect(weekStart('2026-09-20')).toBe('2026-09-14'); // Sunday
    expect(weekStart('2026-09-21')).toBe('2026-09-21'); // next Monday
  });
  it('works across a year boundary', () => {
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });
});

describe('groupByWeek', () => {
  it('groups newest week first, newest entry first', () => {
    const weeks = groupByWeek([
      entry('a', '2026-09-14', 600),
      entry('b', '2026-09-16', 400),
      entry('c', '2026-09-23', 800),
    ]);
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-09-21', '2026-09-14']);
    expect(weeks[1].entries.map((e) => e.id)).toEqual(['b', 'a']);
  });
  it('totals nutrition and averages over recorded days', () => {
    const weeks = groupByWeek([entry('a', '2026-09-14', 600), entry('b', '2026-09-14', 400), entry('c', '2026-09-16', 500)]);
    expect(weeks[0].recordedDays).toBe(2);
    expect(weeks[0].total.energy).toBe(1500);
    expect(weeks[0].averagePerRecordedDay.energy).toBe(750);
    expect(weeks[0].withoutNutrition).toBe(0);
  });
  it('counts entries with no nutrition snapshot', () => {
    const weeks = groupByWeek([entry('a', '2026-09-14'), entry('b', '2026-09-14', 500)]);
    expect(weeks[0].withoutNutrition).toBe(1);
    expect(weeks[0].total.energy).toBe(500);
  });
  it('returns an empty list for no entries', () => {
    expect(groupByWeek([])).toEqual([]);
  });
});
```

Run: `npx vitest run src/domain/cookingLog` — Expected: FAIL.

- [ ] **Step 2: Implement it**

`src/domain/cookingLog.ts`:
```ts
import { addDays } from './dates';
import { emptyTotals } from './nutrition';
import { NUTRIENT_KEYS, type CookEntry, type NutritionTotals } from './types';

export interface LogWeek {
  weekStart: string;
  entries: CookEntry[];
  recordedDays: number;
  withoutNutrition: number;
  total: NutritionTotals;
  averagePerRecordedDay: NutritionTotals;
}

/** The Monday on or before the given date. */
export function weekStart(iso: string): string {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 is Sunday
  const backToMonday = day === 0 ? 6 : day - 1;
  return addDays(iso, -backToMonday);
}

export function groupByWeek(entries: CookEntry[]): LogWeek[] {
  const byWeek = new Map<string, CookEntry[]>();
  for (const entry of entries) {
    const key = weekStart(entry.cookedOn);
    byWeek.set(key, [...(byWeek.get(key) ?? []), entry]);
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([start, weekEntries]) => {
      const sorted = [...weekEntries].sort((a, b) => b.cookedOn.localeCompare(a.cookedOn));
      const total = emptyTotals();
      let withoutNutrition = 0;
      for (const entry of sorted) {
        if (!entry.nutrition) {
          withoutNutrition += 1;
          continue;
        }
        for (const key of NUTRIENT_KEYS) total[key] += entry.nutrition[key];
      }
      const recordedDays = new Set(sorted.map((e) => e.cookedOn)).size;
      const average = emptyTotals();
      for (const key of NUTRIENT_KEYS) {
        const value = total[key] / Math.max(1, recordedDays);
        average[key] = key === 'energy' ? Math.round(value) : Math.round(value * 10) / 10;
        total[key] = key === 'energy' ? Math.round(total[key]) : Math.round(total[key] * 10) / 10;
      }
      return { weekStart: start, entries: sorted, recordedDays, withoutNutrition, total, averagePerRecordedDay: average };
    });
}
```

Run: `npx vitest run src/domain/cookingLog` — Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/domain/cookingLog.ts src/domain/cookingLog.test.ts
git commit -m "feat(domain): group cooking log entries into weeks"
```

---

### Task 11: Recording a cook

**Files:**
- Create: `src/features/recipes/CookSheet.tsx`
- Modify: `src/features/recipes/RecipeDetailPage.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/features/recipes/CookSheet.test.tsx`

**Interfaces:**
- Consumes: `logCook`, `removePantryItem`, `computeRecipeNutrition`, `todayIso`.

- [ ] **Step 1: Add the i18n keys**

```ts
  'cook.title': 'Record what you cooked',
  'cook.removeFromPantry': 'Remove from the pantry',
  'cook.removeHint': 'Checked ingredients are removed from the pantry completely, not reduced.',
  'cook.nothingToRemove': 'None of these ingredients are in your pantry.',
  'cook.record': 'Record',
  'cook.recorded': 'Recorded',
```
Japanese: `作ったものを記録`, `在庫から取り除く`, `チェックした材料は在庫から完全に取り除かれます。数量は減りません。`, `この材料は在庫にありません。`, `記録する`, `記録しました`.

- [ ] **Step 2: Write the failing test**

`src/features/recipes/CookSheet.test.tsx`:
```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRESET_RECIPES } from '../../data/recipes';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { CookSheet } from './CookSheet';

const recipe = PRESET_RECIPES.find((r) => r.id === 'teriyaki-chicken')!;

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('CookSheet', () => {
  it('records an entry with a nutrition snapshot and removes the checked ingredients', async () => {
    const s = useAppStore.getState();
    s.addPantryItem('chicken-thigh');
    s.addPantryItem('soy-sauce');
    renderWithRouter(<CookSheet recipe={recipe} open onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Record what you cooked' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Soy sauce' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Record' }));
    const log = useAppStore.getState().cookingLog;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ recipeId: 'teriyaki-chicken', servings: 2 });
    expect(log[0].nutrition?.energy).toBeGreaterThan(0);
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['soy-sauce']);
  });
  it('records the servings chosen in the sheet', async () => {
    renderWithRouter(<CookSheet recipe={recipe} open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'More servings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Record' }));
    expect(useAppStore.getState().cookingLog[0].servings).toBe(3);
  });
});
```

Run: `npx vitest run src/features/recipes/CookSheet` — Expected: FAIL.

- [ ] **Step 3: Build the sheet**

`src/features/recipes/CookSheet.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ServingsStepper } from '../../components/ServingsStepper';
import { Sheet } from '../../components/Sheet';
import { useToastStore } from '../../components/toastStore';
import { todayIso } from '../../domain/dates';
import { computeRecipeNutrition } from '../../domain/nutrition';
import type { Recipe } from '../../domain/types';
import { useT } from '../../i18n';
import { useIngredientName, usePantryIds } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}

export function CookSheet({ recipe, open, onClose }: Props) {
  const t = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t('cook.title')}>
      {/* Children mount only while the sheet is open, so the form state starts fresh. */}
      <CookForm recipe={recipe} onClose={onClose} />
    </Sheet>
  );
}

function CookForm({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const nameOf = useIngredientName();
  const pantryIds = usePantryIds();
  const globalServings = useAppStore((s) => s.servings);
  const logCook = useAppStore((s) => s.logCook);
  const removePantryItem = useAppStore((s) => s.removePantryItem);
  const showToast = useToastStore((s) => s.show);

  const removable = recipe.ingredients
    .filter((ri) => !ri.optional && pantryIds.has(ri.ingredientId))
    .map((ri) => ri.ingredientId);
  const [servings, setServings] = useState(globalServings);
  const [checked, setChecked] = useState<string[]>(removable);

  const record = () => {
    for (const id of checked) removePantryItem(id);
    logCook({
      recipeId: recipe.id,
      recipeName: recipe.name,
      servings,
      cookedOn: todayIso(),
      nutrition: computeRecipeNutrition(recipe, servings).total,
    });
    onClose();
    showToast(t('cook.recorded'));
    navigate('/log');
  };

  return (
    <div className="flex flex-col gap-4">
      <ServingsStepper value={servings} onChange={setServings} />
      <section>
        <h3 className="mb-1 text-sm font-semibold text-stone-700">{t('cook.removeFromPantry')}</h3>
        <p className="mb-2 text-xs text-stone-500">{t('cook.removeHint')}</p>
        {removable.length === 0 ? (
          <p className="text-sm text-stone-500">{t('cook.nothingToRemove')}</p>
        ) : (
          <ul className="rounded-xl border border-stone-200">
            {removable.map((id) => (
              <li key={id} className="border-b border-stone-100 last:border-b-0">
                <label className="flex items-center gap-3 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-emerald-600"
                    aria-label={nameOf(id)}
                    checked={checked.includes(id)}
                    onChange={() =>
                      setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
                    }
                  />
                  <span className="truncate">{nameOf(id)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={record}>{t('cook.record')}</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the button to recipe detail**

In `RecipeDetailPage.tsx` add `const [cooking, setCooking] = useState(false);`, a primary button `{t('recipe.cooked')}` at the top of the action row that calls `setCooking(true)`, and `<CookSheet recipe={recipe} open={cooking} onClose={() => setCooking(false)} />` beside the confirm dialog.

Run: `npx vitest run src/features/recipes` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/recipes src/i18n
git commit -m "feat(recipes): record a cooked dish and optionally clear its ingredients"
```

---

### Task 12: Log tab

**Files:**
- Create: `src/features/log/LogPage.tsx`, `src/features/log/LogWeekCard.tsx`
- Modify: `src/components/BottomNav.tsx`, `src/App.tsx`, `src/components/Layout.test.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/features/log/LogPage.test.tsx`

**Interfaces:**
- Consumes: `groupByWeek`, `NutritionPanel`, `deleteCookEntry`.

- [ ] **Step 1: Add the i18n keys**

```ts
  'nav.log': 'Log',
  'log.title': 'Cooking log',
  'log.emptyTitle': 'Nothing recorded yet',
  'log.emptyBody': 'Open a recipe and use "I cooked this" to start your log.',
  'log.weekOf': 'Week of {date}',
  'log.recordedDays': '{count} days recorded',
  'log.servings': '{count} servings',
  'log.deleteEntry': 'Delete {name}',
  'log.weeklyTotal': 'Week total',
  'log.dailyAverage': 'Average per recorded day',
  'log.missingNutrition': '{count} entries have no nutrition data',
```
Japanese: `記録`, `調理ログ`, `まだ記録がありません`, `レシピを開いて「作った」から記録を始めましょう。`, `{date}の週`, `{count}日分を記録`, `{count}人分`, `{name}を削除`, `週の合計`, `記録した日の平均`, `{count}件は栄養データがありません`.

- [ ] **Step 2: Write the failing test**

`src/features/log/LogPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { emptyTotals } from '../../domain/nutrition';
import { defaultPersistedState } from '../../store/migrations';
import { useAppStore } from '../../store/useAppStore';
import { renderWithRouter } from '../../test/render';
import { LogPage } from './LogPage';

beforeEach(() => useAppStore.setState(defaultPersistedState('en')));

describe('LogPage', () => {
  it('shows the empty state', () => {
    renderWithRouter(<LogPage />);
    expect(screen.getByText('Nothing recorded yet')).toBeInTheDocument();
  });
  it('lists entries by week and deletes one', async () => {
    const s = useAppStore.getState();
    s.logCook({
      recipeId: 'a',
      recipeName: { en: 'Teriyaki chicken' },
      servings: 2,
      cookedOn: '2026-09-16',
      nutrition: { ...emptyTotals(), energy: 500 },
    });
    s.logCook({ recipeId: 'b', recipeName: { en: 'Miso soup' }, servings: 2, cookedOn: '2026-09-16' });
    renderWithRouter(<LogPage />);
    expect(screen.getByText('Teriyaki chicken')).toBeInTheDocument();
    expect(screen.getByText('1 entries have no nutrition data')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Miso soup' }));
    expect(useAppStore.getState().cookingLog).toHaveLength(1);
  });
});
```

Run: `npx vitest run src/features/log` — Expected: FAIL.

- [ ] **Step 3: Build the page**

`src/features/log/LogWeekCard.tsx`:
```tsx
import { useState } from 'react';
import { Button } from '../../components/Button';
import { NutritionPanel } from '../../components/NutritionPanel';
import type { LogWeek } from '../../domain/cookingLog';
import { localize } from '../../domain/localize';
import { useLang, useT } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';

export function LogWeekCard({ week }: { week: LogWeek }) {
  const t = useT();
  const lang = useLang();
  const deleteCookEntry = useAppStore((s) => s.deleteCookEntry);
  const [showNutrition, setShowNutrition] = useState(false);

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <header className="bg-stone-100 px-4 py-2">
        <p className="text-sm font-semibold text-stone-800">{t('log.weekOf', { date: week.weekStart })}</p>
        <p className="text-xs text-stone-500">{t('log.recordedDays', { count: week.recordedDays })}</p>
      </header>
      <ul className="divide-y divide-stone-100">
        {week.entries.map((entry) => {
          const name = localize(entry.recipeName, lang);
          return (
            <li key={entry.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{name}</span>
                <span className="text-xs text-stone-500">
                  {entry.cookedOn} · {t('log.servings', { count: entry.servings })}
                </span>
              </span>
              <button
                type="button"
                aria-label={t('log.deleteEntry', { name })}
                onClick={() => deleteCookEntry(entry.id)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
      <div className="px-4 py-3">
        {week.withoutNutrition > 0 && (
          <p className="mb-2 text-xs text-amber-700">
            {t('log.missingNutrition', { count: week.withoutNutrition })}
          </p>
        )}
        <Button variant="secondary" size="sm" onClick={() => setShowNutrition((v) => !v)}>
          {showNutrition ? t('common.close') : t('nutrition.title')}
        </Button>
        {showNutrition && (
          <div className="mt-3 flex flex-col gap-4">
            <NutritionPanel totals={week.averagePerRecordedDay} heading={t('log.dailyAverage')} />
            <NutritionPanel totals={week.total} heading={t('log.weeklyTotal')} />
          </div>
        )}
      </div>
    </section>
  );
}
```

`src/features/log/LogPage.tsx`:
```tsx
import { useMemo } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { groupByWeek } from '../../domain/cookingLog';
import { useT } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import { LogWeekCard } from './LogWeekCard';

export function LogPage() {
  const t = useT();
  const cookingLog = useAppStore((s) => s.cookingLog);
  const weeks = useMemo(() => groupByWeek(cookingLog), [cookingLog]);

  return (
    <div className="p-4">
      <PageHeader title={t('log.title')} />
      {weeks.length === 0 ? (
        <EmptyState title={t('log.emptyTitle')} body={t('log.emptyBody')} />
      ) : (
        weeks.map((week) => <LogWeekCard key={week.weekStart} week={week} />)
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the tab and route**

In `src/components/BottomNav.tsx` insert before the settings entry:
```ts
  { to: '/log', key: 'nav.log', icon: '📔' },
```
In `src/App.tsx` add `{ path: 'log', element: <LogPage /> }` to the children.
In `src/components/Layout.test.tsx` update the tab assertions to expect six links, adding `Log`.

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/log src/components src/App.tsx src/i18n
git commit -m "feat(log): add a weekly cooking log tab with nutrition summaries"
```

---

### Task 13: Recipe import parsers

**Files:**
- Create: `src/domain/recipeImport/types.ts`, `src/domain/recipeImport/parseJsonLd.ts`, `src/domain/recipeImport/parseText.ts`, `src/domain/recipeImport/fetchRecipe.ts`
- Test: `src/domain/recipeImport/parseJsonLd.test.ts`, `src/domain/recipeImport/parseText.test.ts`

**Interfaces:**
- Produces: `ParsedRecipe`, `ParsedIngredientLine`, `parseJsonLdRecipe(html: string): ParsedRecipe | null`, `parseIngredientLines(text: string, catalog: Ingredient[]): ParsedIngredientLine[]`, `parseRecipeText(text: string, catalog: Ingredient[]): ParsedRecipe`, `fetchRecipeHtml(url: string): Promise<string | null>`, `PROXIES`.

- [ ] **Step 1: Write the failing parser tests**

`src/domain/recipeImport/parseJsonLd.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseJsonLdRecipe } from './parseJsonLd';

const page = (body: string) => `<html><head>${body}</head><body></body></html>`;

describe('parseJsonLdRecipe', () => {
  it('reads a plain Recipe block', () => {
    const html = page(`<script type="application/ld+json">${JSON.stringify({
      '@type': 'Recipe',
      name: '肉じゃが',
      recipeIngredient: ['じゃがいも 3個', '牛薄切り肉 200g'],
      recipeInstructions: ['切る', '煮る'],
      recipeYield: '2人分',
    })}</script>`);
    const parsed = parseJsonLdRecipe(html);
    expect(parsed?.name).toBe('肉じゃが');
    expect(parsed?.ingredients.map((i) => i.raw)).toEqual(['じゃがいも 3個', '牛薄切り肉 200g']);
    expect(parsed?.steps).toEqual(['切る', '煮る']);
    expect(parsed?.servings).toBe(2);
  });
  it('finds a Recipe inside @graph and survives a malformed sibling', () => {
    const html = page(
      `<script type="application/ld+json">{not json}</script>` +
        `<script type="application/ld+json">${JSON.stringify({
          '@graph': [{ '@type': 'WebPage' }, { '@type': ['Recipe'], name: 'Curry', recipeIngredient: ['rice 300 g'] }],
        })}</script>`,
    );
    expect(parseJsonLdRecipe(html)?.name).toBe('Curry');
  });
  it('reads HowToStep instructions', () => {
    const html = page(`<script type="application/ld+json">${JSON.stringify({
      '@type': 'Recipe',
      name: 'X',
      recipeIngredient: [],
      recipeInstructions: [{ '@type': 'HowToStep', text: 'Boil water' }, { '@type': 'HowToStep', text: 'Serve' }],
    })}</script>`);
    expect(parseJsonLdRecipe(html)?.steps).toEqual(['Boil water', 'Serve']);
  });
  it('returns null when there is no recipe', () => {
    expect(parseJsonLdRecipe(page(''))).toBeNull();
  });
});
```

`src/domain/recipeImport/parseText.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PRESET_INGREDIENTS } from '../../data/ingredients';
import { parseIngredientLines } from './parseText';

const parse = (text: string) => parseIngredientLines(text, PRESET_INGREDIENTS);

describe('parseIngredientLines', () => {
  it('parses Japanese lines and resolves the catalog id', () => {
    const rows = parse('玉ねぎ 1個\n・にんじん　1/2本\nしょうゆ 大さじ2');
    expect(rows[0]).toMatchObject({ ingredientId: 'onion', amount: 1, unit: 'pcs' });
    expect(rows[1]).toMatchObject({ ingredientId: 'carrot', amount: 0.5, unit: 'stalk' });
    expect(rows[2]).toMatchObject({ ingredientId: 'soy-sauce', amount: 2, unit: 'tbsp' });
  });
  it('parses English lines', () => {
    const rows = parse('Onion 1 pcs\n200 g carrot');
    expect(rows[0]).toMatchObject({ ingredientId: 'onion', amount: 1, unit: 'pcs' });
    expect(rows[1]).toMatchObject({ ingredientId: 'carrot', amount: 200, unit: 'g' });
  });
  it('treats 適量 and similar as no amount', () => {
    const rows = parse('塩 適量\nこしょう 少々\nsugar to taste');
    for (const row of rows) expect(row.amount).toBeUndefined();
    expect(rows[0].ingredientId).toBe('salt');
  });
  it('normalises full-width digits', () => {
    expect(parse('砂糖 大さじ２')[0]).toMatchObject({ ingredientId: 'sugar', amount: 2, unit: 'tbsp' });
  });
  it('keeps unmatched names with no id', () => {
    const rows = parse('ドラゴンフルーツ 1個');
    expect(rows[0].ingredientId).toBeUndefined();
    expect(rows[0].name).toBe('ドラゴンフルーツ');
  });
  it('skips blank and heading-only lines', () => {
    expect(parse('材料\n\n  \n塩 少々')).toHaveLength(1);
  });
});
```

Run: `npx vitest run src/domain/recipeImport` — Expected: FAIL.

- [ ] **Step 2: Implement the types and the JSON-LD parser**

`src/domain/recipeImport/types.ts`:
```ts
import type { Unit } from '../types';

export interface ParsedIngredientLine {
  raw: string;
  name: string;
  ingredientId?: string;
  amount?: number;
  unit?: Unit;
}

export interface ParsedRecipe {
  name?: string;
  servings?: number;
  ingredients: ParsedIngredientLine[];
  steps: string[];
}
```

`src/domain/recipeImport/parseJsonLd.ts`:
```ts
import { toAsciiDigits } from '../unitAliases';
import type { ParsedRecipe } from './types';

const SCRIPT = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function isRecipe(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const type = (value as Record<string, unknown>)['@type'];
  return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
}

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findRecipe(child);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object' || node === null) return null;
  if (isRecipe(node)) return node as Record<string, unknown>;
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findRecipe(value);
    if (found) return found;
  }
  return null;
}

function toSteps(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((step) => {
      if (typeof step === 'string') return step.trim();
      if (typeof step === 'object' && step !== null) {
        const text = (step as Record<string, unknown>).text ?? (step as Record<string, unknown>).name;
        return typeof text === 'string' ? text.trim() : '';
      }
      return '';
    })
    .filter(Boolean);
}

function toServings(value: unknown): number | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  if (typeof text === 'number') return text > 0 ? Math.round(text) : undefined;
  if (typeof text !== 'string') return undefined;
  const match = /(\d+)/.exec(toAsciiDigits(text));
  return match ? Number(match[1]) : undefined;
}

/** Reads the first schema.org Recipe in the page; a malformed block never stops the scan. */
export function parseJsonLdRecipe(html: string): ParsedRecipe | null {
  SCRIPT.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SCRIPT.exec(html))) {
    let data: unknown;
    try {
      data = JSON.parse(match[1].trim());
    } catch {
      continue;
    }
    const recipe = findRecipe(data);
    if (!recipe) continue;
    const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [];
    return {
      name: typeof recipe.name === 'string' ? recipe.name : undefined,
      servings: toServings(recipe.recipeYield),
      ingredients: rawIngredients
        .filter((line): line is string => typeof line === 'string')
        .map((line) => ({ raw: line, name: line })),
      steps: toSteps(recipe.recipeInstructions),
    };
  }
  return null;
}
```

- [ ] **Step 3: Implement the text parser**

`src/domain/recipeImport/parseText.ts`:
```ts
import { searchIngredients } from '../search';
import type { Ingredient, Unit } from '../types';
import { toAsciiDigits, unitFromAlias } from '../unitAliases';
import type { ParsedIngredientLine, ParsedRecipe } from './types';

const NO_AMOUNT = ['適量', '少々', 'お好みで', 'ひとつまみ程度', 'to taste'];
const BULLET = /^[\s・*\-–—•‣●○◦　]*(?:\d+[.)]\s*)?/;

function splitFraction(text: string): number | null {
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const value = Number(fraction[1]) / Number(fraction[2]);
    return Number.isFinite(value) ? value : null;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** Pulls a trailing or leading amount out of one line, leaving the ingredient name. */
function splitLine(line: string): { name: string; amount?: number; unit?: Unit } {
  const cleaned = toAsciiDigits(line.replace(BULLET, '')).replace(/[\t　]+/g, ' ').trim();
  if (NO_AMOUNT.some((word) => cleaned.includes(word))) {
    let name = cleaned;
    for (const word of NO_AMOUNT) name = name.replace(word, '');
    return { name: name.trim() };
  }
  const trailing = /^(.*?)[\s:：]*(\d+(?:\.\d+)?(?:\/\d+)?)\s*([^\s\d]*)$/.exec(cleaned);
  if (trailing) {
    const amount = splitFraction(trailing[2]);
    const unit = trailing[3] ? unitFromAlias(trailing[3]) : 'pcs';
    if (amount !== null && trailing[1].trim()) {
      return { name: trailing[1].trim(), ...(unit ? { amount, unit } : { amount, unit: 'pcs' }) };
    }
  }
  const leading = /^(\d+(?:\.\d+)?(?:\/\d+)?)\s*([^\s\d]*)\s+(.+)$/.exec(cleaned);
  if (leading) {
    const amount = splitFraction(leading[1]);
    const unit = leading[2] ? unitFromAlias(leading[2]) : 'pcs';
    if (amount !== null) {
      return { name: leading[3].trim(), ...(unit ? { amount, unit } : { amount, unit: 'pcs' }) };
    }
  }
  const spoon = /^(.*?)(大さじ|小さじ|カップ)\s*(\d+(?:\.\d+)?(?:\/\d+)?)$/.exec(cleaned);
  if (spoon) {
    const amount = splitFraction(spoon[3]);
    const unit = unitFromAlias(spoon[2]);
    if (amount !== null && unit) return { name: spoon[1].trim(), amount, unit };
  }
  return { name: cleaned };
}

function resolve(name: string, catalog: Ingredient[]): string | undefined {
  if (!name) return undefined;
  const hits = searchIngredients(catalog, name, 2);
  return hits.length > 0 ? hits[0].id : undefined;
}

export function parseIngredientLines(text: string, catalog: Ingredient[]): ParsedIngredientLine[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const { name, amount, unit } = splitLine(line);
      return { raw: line, name, ingredientId: resolve(name, catalog), ...(amount !== undefined ? { amount } : {}), ...(unit ? { unit } : {}) };
    })
    .filter((row) => row.name.length > 0 && (row.ingredientId !== undefined || row.amount !== undefined || row.name.length > 1));
}

/** Whole-page text: everything is treated as ingredient lines; steps stay empty. */
export function parseRecipeText(text: string, catalog: Ingredient[]): ParsedRecipe {
  return { ingredients: parseIngredientLines(text, catalog), steps: [] };
}
```
A line like `材料` resolves to no ingredient and carries no amount, and its name is two characters, so the filter keeps it out only when it is a single character. Adjust the final filter if the heading test fails: require `row.ingredientId !== undefined || row.amount !== undefined`.

Run: `npx vitest run src/domain/recipeImport` — Expected: PASS. If the heading case fails, apply the stricter filter noted above and rerun.

- [ ] **Step 4: Implement the fetcher**

`src/domain/recipeImport/fetchRecipe.ts`:
```ts
export const PROXIES: ReadonlyArray<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/${url}`,
];

export const FETCH_TIMEOUT_MS = 8000;

/** Fetches a page through public relays. Returns null when every relay fails. */
export async function fetchRecipeHtml(url: string): Promise<string | null> {
  for (const build of PROXIES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(build(url), { signal: controller.signal });
      if (!response.ok) continue;
      const text = await response.text();
      if (text.trim()) return text;
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/recipeImport
git commit -m "feat(import): parse recipes from structured data or pasted text"
```

---

### Task 14: Import screen

**Files:**
- Create: `src/features/recipes/ImportRecipePage.tsx`
- Modify: `src/features/recipes/RecipeFormPage.tsx`, `src/features/recipes/RecipesPage.tsx`, `src/App.tsx`, `src/i18n/en.ts`, `src/i18n/ja.ts`
- Test: `src/features/recipes/ImportRecipePage.test.tsx`

**Interfaces:**
- Consumes: `parseJsonLdRecipe`, `parseIngredientLines`, `fetchRecipeHtml`, `createIngredient`, `emptyDraft`, `RecipeDraft`.
- Produces: navigation to `/recipes/new` carrying `{ draft: RecipeDraft }` in router state.

- [ ] **Step 1: Add the i18n keys**

```ts
  'import.open': 'Import',
  'import.title': 'Import a recipe',
  'import.urlLabel': 'Recipe page URL',
  'import.urlPlaceholder': 'https://...',
  'import.fetch': 'Fetch',
  'import.fetching': 'Fetching…',
  'import.privacy': 'The URL is sent to an external relay service to work around browser restrictions.',
  'import.failed': 'Could not read that page. Copy the ingredient list and paste it below instead.',
  'import.pasteLabel': 'Or paste the ingredient list',
  'import.pastePlaceholder': 'Onion 1 pcs\nSoy sauce 2 tbsp',
  'import.parse': 'Read the text',
  'import.results': 'Found ingredients',
  'import.unmatched': 'Not in the catalog',
  'import.addAsNew': 'Add as a new ingredient',
  'import.drop': 'Skip',
  'import.toForm': 'Continue to the form',
  'import.nothingFound': 'No ingredients were found in that text.',
```
Japanese: `取り込む`, `レシピを取り込む`, `レシピページのURL`, `https://...`, `取得`, `取得中…`, `ブラウザの制限を回避するため、URLは外部の中継サービスに送信されます。`, `そのページを読み取れませんでした。材料欄をコピーして下に貼り付けてください。`, `または材料欄を貼り付け`, `玉ねぎ 1個\nしょうゆ 大さじ2`, `テキストを読み取る`, `見つかった材料`, `カタログにないもの`, `新しい食材として追加`, `使わない`, `フォームへ進む`, `材料が見つかりませんでした。`

- [ ] **Step 2: Write the failing test**

`src/features/recipes/ImportRecipePage.test.tsx`:
```tsx
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
```

Run: `npx vitest run src/features/recipes/ImportRecipePage` — Expected: FAIL.

- [ ] **Step 3: Build the page**

`src/features/recipes/ImportRecipePage.tsx` holds: a URL field with a fetch button, the privacy line, a textarea, a parse button, a result list splitting matched and unmatched lines, and a continue button. Behaviour:

```tsx
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lines, setLines] = useState<ParsedIngredientLine[] | null>(null);
  const [parsedName, setParsedName] = useState<string | undefined>();
  const [parsedSteps, setParsedSteps] = useState<string[]>([]);
  const [parsedServings, setParsedServings] = useState<number | undefined>();
```
```tsx
  const runFetch = async () => {
    setBusy(true);
    setFailed(false);
    const html = await fetchRecipeHtml(url.trim());
    setBusy(false);
    if (!html) {
      setFailed(true);
      return;
    }
    const jsonLd = parseJsonLdRecipe(html);
    if (jsonLd) {
      setParsedName(jsonLd.name);
      setParsedSteps(jsonLd.steps);
      setParsedServings(jsonLd.servings);
      setLines(parseIngredientLines(jsonLd.ingredients.map((i) => i.raw).join('\n'), catalog));
      return;
    }
    setLines(parseIngredientLines(html.replace(/<[^>]+>/g, '\n'), catalog));
  };

  const runParseText = () => {
    setParsedName(undefined);
    setParsedSteps([]);
    setParsedServings(undefined);
    setLines(parseIngredientLines(text, catalog));
  };

  const addAsNew = (line: ParsedIngredientLine) => {
    const created = createIngredient({
      name: lang === 'ja' ? { ja: line.name } : { en: line.name },
      category: 'other',
    });
    setLines((current) =>
      (current ?? []).map((l) => (l.raw === line.raw ? { ...l, ingredientId: created.id } : l)),
    );
  };

  const drop = (line: ParsedIngredientLine) =>
    setLines((current) => (current ?? []).filter((l) => l.raw !== line.raw));

  const continueToForm = () => {
    const draft: RecipeDraft = {
      ...emptyDraft(),
      ...(lang === 'ja' ? { nameJa: parsedName ?? '' } : { nameEn: parsedName ?? '' }),
      baseServings: String(parsedServings ?? 2),
      ingredients: (lines ?? [])
        .filter((l) => l.ingredientId)
        .map((l) => ({
          ingredientId: l.ingredientId!,
          amount: l.amount === undefined ? '' : String(l.amount),
          unit: l.unit ?? '',
          optional: false,
        })),
      ...(lang === 'ja' ? { stepsJa: parsedSteps.join('\n') } : { stepsEn: parsedSteps.join('\n') }),
    };
    navigate('/recipes/new', { state: { draft } });
  };
```
Matched lines render their catalog name from `useIngredientName`; unmatched ones render `line.name` with the two action buttons. `continueToForm` is disabled while `lines` is null or has no resolved entry, and `t('import.nothingFound')` shows when parsing produced nothing.

- [ ] **Step 4: Accept the draft in the form and link the page**

In `RecipeFormPage.tsx`:
```tsx
import { useLocation } from 'react-router-dom';
...
  const location = useLocation();
  const prefill = (location.state as { draft?: RecipeDraft } | null)?.draft;
  const [draft, setDraft] = useState<RecipeDraft>(() =>
    existing && !existing.isPreset ? draftFromRecipe(existing) : (prefill ?? emptyDraft()),
  );
```
In `RecipesPage.tsx` add a second header action linking to `/recipes/import` with the label `t('import.open')`.
In `src/App.tsx` add `{ path: 'recipes/import', element: <ImportRecipePage /> }` before the `recipes/:id` route so the literal path wins.

Run: `npm test && npm run build && npm run lint` — Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/recipes src/App.tsx src/i18n
git commit -m "feat(import): add the recipe import screen and prefill the recipe form"
```

---

### Task 15: Documentation and release

**Files:**
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Update the README**

Add to the feature list: the ingredient filter, the expiry switch, selective deletion, the cooking log tab, gram display, nutrition with daily references, and recipe import. Add a short section explaining that nutrition figures are estimates from the Japanese standard tables of food composition, that micronutrients are rougher than macronutrients, and that daily references follow the Japanese dietary reference intakes for adults. Note in the storage section that data is schema version 2 and that version 1 backups still import.

- [ ] **Step 2: Update CLAUDE.md**

Add to the conventions: `toGrams` returns null rather than guessing; only required ingredients count toward nutrition; weeks start Monday and weekly averages divide by recorded days; recipe import never saves a recipe. Add the new paths to the "Where things live" table: `src/domain/units.ts`, `src/domain/nutrition.ts`, `src/domain/targets.ts`, `src/domain/cookingLog.ts`, `src/domain/recipeImport/`, `src/data/conversions.ts`, `src/data/nutrition.ts`, `src/data/targets.ts`, `src/features/log/`. Point the spec line at the v2 design document as well.

- [ ] **Step 3: Full verification**

Run: `npm test && npm run build && npm run lint` — Expected: all pass with no skipped tests.

Then start the dev server and walk through: add staples, set a quantity with a unit, filter the Cook tab by an ingredient, open a recipe, switch amounts to grams, read the nutrition panel, record a cook, check the log tab, turn expiry tracking off, delete only the shopping list, and import a recipe from pasted text.

- [ ] **Step 4: Commit and publish**

```bash
git add README.md CLAUDE.md
git commit -m "docs: document v2 features, nutrition estimates and schema version 2"
git push origin main
```

GitHub Actions builds, tests and republishes the site. Confirm the run succeeds and the published page shows the new Log tab.
