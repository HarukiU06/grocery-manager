# Grocery Manager v2 — Design Spec

**Date:** 2026-09-19
**Status:** Approved by the user (design presented in chat and approved before this document was written).
**Supersedes nothing.** Extends `2026-09-18-grocery-manager-design.md`; everything in v1 stays unless this document says otherwise.

## 1. Purpose

Seven features requested by the user, in five phases:

| Phase | Feature |
|---|---|
| 1 | Ingredient filter ("I want to cook with this"), expiry tracking off-switch, selective data clearing |
| 2 | Cooking log with weekly view |
| 3 | Structured quantities with unit choice, gram conversion |
| 4 | Calories and nutrients with daily reference targets |
| 5 | Recipe import from a URL or pasted text |

Phase 4 depends on phase 3's conversion table. Phases 2 and 4 combine into the weekly nutrition summary.

## 2. Decisions made with the user

| Topic | Decision |
|---|---|
| Recipe import | URL paste through a public CORS proxy, with automatic fallback to pasting the page text. No backend. |
| Nutrition scope | 14 nutrients including vitamins and minerals, because runtime cost is unchanged and only the data grows. |
| Nutrition targets | Daily reference intake for adult male / adult female, selectable, plus an "off" option. |
| Quantity and units | Both: structured quantity input in the pantry, and a piece/gram display toggle on recipe detail. |
| Cooking log and pantry | Recording a cook asks which used ingredients to remove from the pantry. |

### 2.1 Accuracy statement

Energy, protein, fat, carbohydrate and salt values are reliable approximations. Vitamin and mineral values are rougher. Every nutrition surface is labelled as an estimate, and a data test enforces internal consistency (section 9.3). This is stated in the UI and the README, not only here.

## 3. Storage schema version 2

`CURRENT_SCHEMA_VERSION` becomes `2`.

### 3.1 Changed type

```ts
export interface Quantity {
  amount: number;
  unit: Unit;
}

export interface PantryItem {
  ingredientId: string;
  quantity?: Quantity;   // was `string` in v1
  note?: string;         // NEW: free text; also holds unparseable v1 quantities
  expiresOn?: string;
  location?: StorageLocation;
  addedOn: string;
}
```

### 3.2 New persisted fields

```ts
interface PersistedState {
  // ...v1 fields...
  schemaVersion: 2;
  trackExpiry: boolean;                 // default true
  amountDisplay: AmountDisplay;         // 'recipe' | 'grams', default 'recipe'
  nutritionTarget: NutritionTargetKey;  // 'off' | 'adult_male' | 'adult_female', default 'off'
  cookingLog: CookEntry[];              // default []
}
```

### 3.3 New type: cooking log entry

```ts
export interface CookEntry {
  id: string;                   // newId('cook')
  recipeId: string;
  recipeName: LocalizedText;    // snapshot
  servings: number;
  cookedOn: string;             // ISO date
  nutrition?: NutritionTotals;  // snapshot for the servings cooked
}
```

The name and nutrition are snapshots on purpose: editing or deleting a recipe must not rewrite history, and a deleted custom recipe must still read correctly in the log.

### 3.4 Migration v1 to v2

`migrate(raw, fromVersion)` gains a step for version 1. It converts each pantry item's string quantity:

1. Trim. Empty or missing leaves both `quantity` and `note` unset.
2. Normalise full-width digits and the full-width period to ASCII.
3. Match `^(\d+(?:\.\d+)?)\s*(.*)$`.
4. No match at all: put the original string in `note`.
5. Match with empty unit text: `{ amount, unit: 'pcs' }`.
6. Match with unit text: look it up in the alias table below. Hit gives `{ amount, unit }`. Miss puts the original string in `note`.

Unit alias table (case-insensitive, used by the migration, the import parser and the pantry input):

| Unit | Aliases |
|---|---|
| `g` | g, グラム, ｇ |
| `kg` | kg, キロ, キログラム |
| `ml` | ml, cc, ミリリットル |
| `l` | l, リットル |
| `pcs` | 個, こ, コ, pcs, piece, pieces |
| `tbsp` | 大さじ, 大匙, tbsp |
| `tsp` | 小さじ, 小匙, tsp |
| `cup` | カップ, cup |
| `clove` | 片, かけ, clove |
| `slice` | 枚, まい, slice, slices |
| `bunch` | 束, たば, bunch |
| `sheet` | 枚, sheet |
| `can` | 缶, かん, can |
| `pack` | パック, 袋, pack |
| `stalk` | 本, ほん, stalk |
| `pinch` | つまみ, ひとつまみ, pinch |

`枚` maps to `slice`; `sheet` is reachable only from the English alias. This is a deliberate simplification: both mean the same thing to a user, and gram conversion is per ingredient anyway.

Import and export validation accepts schema versions 1 and 2 and runs the same migration, so a v1 backup file still imports.

## 4. Units and gram conversion

New module `src/domain/units.ts`, new data `src/data/conversions.ts`.

```ts
export interface IngredientConversion {
  pieceUnit?: Unit;        // the countable unit this ingredient is normally counted in
  gramsPerPiece?: number;  // weight of one of those
  gramsPerTbsp?: number;   // weight of one 15 ml tablespoon
  densityGPerMl?: number;  // for ml, l and cup
}
export const CONVERSIONS: Record<string, IngredientConversion>;

export function toGrams(amount: number, unit: Unit, ingredientId: string): number | null;
```

Rules, in order:

- `g` returns the amount; `kg` multiplies by 1000.
- `ml` multiplies by density; `l` multiplies by 1000 and density. Default density 1.0.
- `tbsp` returns `gramsPerTbsp`, else `15 * density`. `tsp` is one third of the tablespoon weight. `cup` is `200 * density`.
- Countable units (`pcs`, `clove`, `slice`, `bunch`, `sheet`, `can`, `pack`, `stalk`) return `gramsPerPiece` when `pieceUnit` matches the requested unit, otherwise `null`.
- `pinch` returns 1.
- Anything else returns `null`, meaning "cannot convert".

`null` is a first-class result. Callers report it rather than guessing.

### 4.1 Data scope

Preset recipes use 36 distinct ingredient-and-countable-unit pairs and roughly 30 ingredients with spoon measures. `conversions.ts` covers at least those, plus piece weights for other commonly counted produce so pantry entries in 個 convert too. A data test asserts every countable pair used by a preset recipe resolves.

## 5. Nutrition

New module `src/domain/nutrition.ts`, new data `src/data/nutrition.ts`.

### 5.1 Nutrient set

```ts
export const NUTRIENT_KEYS = [
  'energy', 'protein', 'fat', 'carbs', 'fiber', 'salt',
  'calcium', 'iron', 'potassium',
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminC', 'vitaminD',
] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type NutritionTotals = Record<NutrientKey, number>;
```

Display units: energy kcal; protein, fat, carbs, fiber, salt g; calcium, iron, potassium, vitaminB1, vitaminB2, vitaminC mg; vitaminA µgRAE; vitaminD µg.

Direction drives colouring and the wording of target bars:

```ts
export const NUTRIENT_DIRECTION: Record<NutrientKey, 'at_least' | 'at_most' | 'neutral'>;
```

`salt` is `at_most`. `energy`, `fat` and `carbs` are `neutral`. Everything else is `at_least`.

### 5.2 Data format

Values are per 100 g edible portion, stored as a positional tuple in `NUTRIENT_KEYS` order to keep the file compact:

```ts
type NutritionRow = readonly [
  number, number, number, number, number, number,
  number, number, number,
  number, number, number, number, number,
];
export const NUTRITION: Record<string, NutritionRow>;
```

Coverage target is all 164 preset ingredients. An ingredient absent from the table is "unknown" and is reported, never silently treated as zero. Custom ingredients are always unknown; v2 does not ask the user for nutrition values.

### 5.3 Computation

```ts
export interface RecipeNutrition {
  total: NutritionTotals;           // for the requested servings
  perServing: NutritionTotals;
  countedIngredientIds: string[];
  unknownIngredientIds: string[];   // no amount, no conversion, or no nutrition row
}

export function computeRecipeNutrition(recipe: Recipe, servings: number): RecipeNutrition;
```

- Only required ingredients count. Optional ones are excluded and listed as unknown, because the user may leave them out.
- An ingredient counts when it has a numeric amount, `toGrams` returns a number, and `NUTRITION` has a row. Otherwise it is unknown.
- Amounts scale with `scaleAmount` before conversion, so the result matches the servings on screen.
- Values are summed as `row[k] * grams / 100`, rounded to one decimal at the end. Energy rounds to a whole number.

Every surface that shows nutrition also shows how many ingredients were excluded, when any were.

### 5.4 Daily targets

New data `src/data/targets.ts`:

```ts
export type NutritionTargetKey = 'off' | 'adult_male' | 'adult_female';
export const DAILY_TARGETS: Record<'adult_male' | 'adult_female', NutritionTotals>;
```

Values follow the Japanese dietary reference intakes for adults aged 18 to 64 at ordinary activity level. They are reference points, not prescriptions, and the UI says so. `percentOfTarget(totals, targetKey)` returns a per-nutrient percentage, clamped for display at 200.

## 6. Cooking log

New module `src/domain/cookingLog.ts`.

```ts
export interface LogWeek {
  weekStart: string;        // ISO date of the Monday
  entries: CookEntry[];     // newest first
  recordedDays: number;     // distinct cookedOn values
  withoutNutrition: number; // entries carrying no nutrition snapshot
  total: NutritionTotals;
  averagePerRecordedDay: NutritionTotals;
}
export function groupByWeek(entries: CookEntry[]): LogWeek[];  // newest week first
```

Weeks start Monday. The average divides by recorded days, not by seven, and the screen shows the day count so the number is readable. Entries whose `nutrition` is missing contribute zero to totals and are counted in a `withoutNutrition` tally shown on the week header.

## 7. Screens

### 7.1 Bottom navigation

A sixth tab is added: Log (`/log`, 記録). Order: Pantry, Cook, Recipes, Shopping, Log, Settings.

### 7.2 Ingredient filter (Cook and Recipes)

- A button under the existing filter chips: "食材で絞り込む".
- Opens a sheet listing pantry ingredients as checkboxes, sorted by soonest expiry then name. When `trackExpiry` is false, sorted by name only. Below the list, the existing `IngredientPicker` selects any other ingredient.
- Selected ingredients appear as removable chips above the results.
- A recipe passes when its ingredient list contains every selected ingredient, optional ones included.
- Filter state is local to each page. It is not persisted.

### 7.3 Pantry quantity

- The edit sheet replaces the free-text quantity field with a number input plus a unit select. Both may be left empty.
- A separate optional note field holds free text, including anything the migration could not parse.
- The row shows the formatted quantity using the existing `formatQuantity`, and the note underneath in small text.

### 7.4 Recipe detail

- New toggle: 分量表示 with two options, レシピ通り and グラム. Persisted as `amountDisplay`.
- In grams mode, every ingredient whose amount converts shows grams; the rest fall back to the recipe's own wording.
- New nutrition panel below the ingredient list: per serving by default, with a switch to the whole recipe. Shows the 14 nutrients, target bars when `nutritionTarget` is not `off`, an estimate label, and the excluded-ingredient count.
- New button: 作った.

### 7.5 Cook sheet

Opened by 作った. Contains:

- a servings stepper defaulting to the current global servings,
- a checklist of required ingredients that are currently in the pantry, all checked, under the heading 在庫から取り除く,
- an explicit line stating that checked ingredients are removed entirely, not decremented,
- a 記録する button.

On confirm: remove the checked pantry items, append a `CookEntry` with a nutrition snapshot for the chosen servings, show a toast, and navigate to `/log`.

### 7.6 Log page (`/log`)

- Weeks newest first, each with its date range, recorded-day count and entry list.
- Each entry shows the date, recipe name, servings and a delete action.
- Week nutrition summary: total and average per recorded day, with target bars when a target is selected.
- Empty state explains that recording starts from a recipe's 作った button.

### 7.7 Settings

- New: 賞味期限を管理する switch, bound to `trackExpiry`.
- New: 栄養の目安 select with three options, bound to `nutritionTarget`.
- Replaced: すべてのデータを初期化 becomes データを削除, opening a sheet with checkboxes for 在庫, 買い物リスト, マイレシピ, 追加した食材, 調理ログ, 設定. Confirmation lists exactly what will be removed. The sheet warns that removing custom ingredients leaves recipes that referenced them showing an unknown-ingredient mark.

### 7.8 Expiry off behaviour

When `trackExpiry` is false: the expiry field is hidden in the pantry sheet, expiry badges are hidden in pantry rows, and suggestions ignore expiry in sorting. Stored dates are kept, never deleted, and reappear when the switch goes back on. `SuggestionOptions` gains `considerExpiry: boolean`; when false, `usesExpiring` is always empty.

## 8. Recipe import

Route `/recipes/import`, reachable from a button on the Recipes page.

### 8.1 Flow

1. The user pastes a URL and presses 取り込む.
2. The app fetches the page through public CORS proxies, tried in order with an 8 second timeout each: `https://api.allorigins.win/raw?url=<encoded>`, then `https://r.jina.ai/<url>`.
3. The response is parsed for JSON-LD first, then as plain text.
4. On success the parsed recipe prefills the existing recipe form for review. Import never saves a recipe directly.
5. On failure the screen shows a short message and focuses a textarea where the user can paste the page's ingredient list instead. The same text parser runs on it.

The URL field carries a permanent line stating that the URL is sent to an external relay service.

### 8.2 JSON-LD parsing

`parseJsonLdRecipe(html): ParsedRecipe | null`. Finds every `<script type="application/ld+json">` block, parses each, walks objects and `@graph` arrays for one whose `@type` is or contains `Recipe`, and reads `name`, `recipeIngredient`, `recipeInstructions` and `recipeYield`. Instructions accept a string, an array of strings, or an array of `HowToStep` objects. Malformed JSON in one block never aborts the scan.

### 8.3 Text parsing

`parseIngredientLines(text): ParsedIngredientLine[]`. For each non-empty line: strip leading bullets, numbering and whitespace; normalise full-width characters; split into a name part and an amount part; parse the amount with the same alias table as section 3.4; treat 適量, 少々, お好みで and "to taste" as no amount.

Name matching uses the existing catalog search: exact name or alias first, then a unique substring match. A line that matches nothing becomes a row the user can accept as a new ingredient in the form, or drop.

```ts
export interface ParsedRecipe {
  name?: string;
  servings?: number;
  ingredients: ParsedIngredientLine[];
  steps: string[];
}
export interface ParsedIngredientLine {
  raw: string;
  ingredientId?: string;   // resolved against the catalog
  name: string;            // as written on the page
  amount?: number;
  unit?: Unit;
}
```

### 8.4 Prefill

Parsed data becomes a `RecipeDraft`. The name and steps go into the field matching the UI language. Resolved ingredients become ingredient rows. Unresolved ones are listed at the top of the form with a create-and-add action each. The user reviews and saves through the normal form validation, so no import path can produce an invalid recipe.

## 9. Testing

### 9.1 Unit tests

`units.toGrams` for every unit class including the null cases; `nutrition.computeRecipeNutrition` for totals, per-serving, optional exclusion and unknown reporting; `targets.percentOfTarget` including the at_most direction; `cookingLog.groupByWeek` including a year boundary and a week with one recorded day; `migrations` for every row of the quantity alias table plus the unparseable case; `parseJsonLdRecipe` against a fixture page with `@graph` and a malformed sibling block; `parseIngredientLines` for Japanese and English lines, full-width digits and 適量.

### 9.2 Component tests

Filter narrows the Cook list; expiry switch hides fields and badges; selective clear removes only the checked parts; cook sheet writes a log entry and removes the checked pantry items; log page groups by week; recipe detail switches between piece and gram display; import prefills the form from pasted text.

### 9.3 Data integrity tests

Extends `src/data/data.test.ts`:

- every nutrition row has exactly 14 finite, non-negative values;
- energy agrees with the macronutrients within tolerance, using 4 kcal per gram of protein and carbohydrate and 9 per gram of fat, allowing 30 percent or 25 kcal, whichever is larger, to absorb fibre, alcohol and rounding;
- each value sits inside a plausible range per nutrient;
- every ingredient-and-countable-unit pair used by a preset recipe resolves through `toGrams`;
- conversion and nutrition keys all name real preset ingredients;
- both daily target profiles define all 14 nutrients.

## 10. Out of scope for v2

Per-ingredient nutrition editing for custom ingredients, decrementing pantry quantities instead of removing entries, barcode scanning, multi-device sync, PWA offline caching, and any server component.
