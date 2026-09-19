# Grocery Manager

A bilingual (Japanese / English) web app for keeping track of the groceries and seasonings you have at home, and for answering two questions from that inventory:

1. **What can I cook right now?** Recipes whose required ingredients are all in your pantry.
2. **What should I buy to unlock more dishes?** Recipes that are one or two ingredients away, plus a ranked list of single purchases and how many recipes each one unlocks.

Every recipe scales to any number of servings (1–12). The app ships with 64 preset recipes (Japanese, Western, Chinese and Korean-inspired) and a catalog of about 160 ingredients, and you can add your own ingredients and recipes.

## Live app

**https://harukiu06.github.io/grocery-manager/**

No install, no account and no server: open the link and start adding what's in your fridge. `main` auto-deploys here on every push via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Add it to your phone's home screen

The app works like a regular website but feels like an app once pinned:

- **iPhone (Safari):** open the link, tap the Share icon, then **Add to Home Screen**.
- **Android (Chrome):** open the link, tap the ⋮ menu, then **Add to Home screen** (or **Install app** if offered).

Each browser/device keeps its own data (see [How data is stored](#how-data-is-stored)); use **Settings → Export JSON** / **Import JSON** to move your pantry and recipes between them.

## Features

- **Pantry** — search the bilingual ingredient catalog and add what you have. Quantity is a number plus a unit, with an optional note, best-before date and storage location. One tap adds the common Japanese staples.
- **Cook** — three sections: *Ready to cook*, *Almost there* (missing up to N ingredients, N configurable 1 to 5) and *Buy this, unlock that*. Recipes that use expiring items float to the top. Filter by cuisine, and by the ingredients you want to use up.
- **Recipes** — browse, search and import. Detail view scales amounts to the selected servings, switches between the recipe's own units and grams, marks each ingredient as *Have* or *Missing*, and estimates nutrition. Duplicate a preset to customize it, or write one from scratch in either or both languages.
- **Recipe import** — paste a recipe page URL and the app reads its structured data, or paste the ingredient list as text. Import never saves directly: it fills the recipe form for you to review.
- **Cooking log** — record what you cooked with a tap, choosing which used ingredients to clear from the pantry. The log groups by week with nutrition totals and a per-day average.
- **Shopping list** — add missing ingredients from any recipe or suggestion. Checking an item off moves it into the pantry.
- **Settings** — language, servings, "almost there" threshold, best-before tracking on or off, daily nutrition reference profile, JSON export/import, and selective deletion.

## Quick start

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm test          # run the Vitest suite once
npm run test:watch
npm run lint      # ESLint
npm run build     # type-check with tsc, then build to dist/
npm run preview   # serve the production build locally
```

The app is a static single-page app with a hash router, so the contents of `dist/` can be served from any static host or file server without rewrite rules.

## How data is stored

All data lives in the browser under the localStorage key `grocery-manager` (schema version 2). Backups exported from version 1 still import: the pantry's old free-text quantities are converted automatically. Nothing is sent to a server. Use **Settings → Export JSON** to download a backup and **Import JSON** to restore it on another device; import validates the file and asks for confirmation before replacing your data.

If localStorage is unavailable (for example in some private-browsing modes), the app still runs in memory and warns you once that data will not persist.

## How suggestions are computed

Matching is presence-based: a recipe ingredient is satisfied when the ingredient is in the pantry, regardless of quantity. Ingredients marked *optional* in a recipe never affect the result.

- **Ready** — no required ingredient is missing.
- **Almost there** — 1 to *threshold* required ingredients are missing (default threshold 2).
- **Buy this, unlock that** — for every ingredient missing from an *almost* recipe: *unlocks* counts the recipes where it is the only missing ingredient, *helps* counts the recipes where other ingredients are also missing. Sorted by unlocks, then helps.

Ready recipes are sorted by how many expiring pantry items they use (best-before within 3 days, including already expired), then by cooking time. Turning best-before tracking off removes expiry from the sorting and hides its fields. Servings scale linearly from each recipe's base servings and round to one decimal.

## Nutrition figures are estimates

Nutrition is computed from the ingredient amounts, converted to grams with household weights, one egg being 60 g and one tablespoon of soy sauce 18 g, then multiplied by per-ingredient composition values based on the Japanese standard tables of food composition.

- Energy, protein, fat, carbohydrate and salt are close approximations. Vitamins and minerals are rougher.
- Only required ingredients count. Optional ones, amounts written as "to taste", and anything that cannot be converted to grams are excluded, and every panel says how many were left out.
- The daily reference values follow the Japanese dietary reference intakes for adults aged 18 to 64 at ordinary activity level. They are reference points, not prescriptions.

Treat the whole feature as a rough guide rather than a measurement.

## Project structure

```
src/
  domain/      Pure functions and types: matching, scaling, units, nutrition, targets,
               cooking log, recipe import parsers, search, dates, localization
  data/        Preset ingredient catalog, staples, recipes, gram conversions,
               nutrition composition and daily targets
  store/       Zustand store with localStorage persistence, migrations, import/export
  i18n/        UI string dictionaries (en.ts is the source of truth for keys) and hooks
  components/  Shared UI (buttons, badges, sheets, navigation, toast)
  features/    One folder per screen: pantry, suggestions, recipes, shopping, log, settings
  test/        Test setup, factories and render helpers
docs/superpowers/
  specs/       Design spec
  plans/       Implementation plan
```

## Adding preset content

- **Ingredients:** add a `preset(...)` row to `src/data/ingredients.ts` with a kebab-case `id`, Japanese and English names, a category and optional search aliases.
- **Recipes:** add a `recipe({...})` entry to the matching file under `src/data/recipes/`. Reference ingredients by `id`, give amounts for 2 servings, and provide the same number of steps in `ja` and `en`. Water is never listed as an ingredient; mention it in the steps.
- Run `npm test`. The data integrity test rejects unknown ingredient IDs, duplicate IDs, missing translations and mismatched step counts.

## Conventions

Code, comments, commit messages and documentation are in English. Japanese appears only in the i18n dictionaries and in preset content. Every user-visible string goes through `t()` from `src/i18n`; preset text uses `LocalizedText` with `localize()`.

## Not in this version

Multi-device sync, PWA install, decrementing pantry quantities instead of removing entries, AI-generated ideas, nutrition values for ingredients you add yourself, photos and barcode scanning.

## License

MIT
