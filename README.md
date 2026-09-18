# Grocery Manager

A bilingual (Japanese / English) web app for keeping track of the groceries and seasonings you have at home, and for answering two questions from that inventory:

1. **What can I cook right now?** Recipes whose required ingredients are all in your pantry.
2. **What should I buy to unlock more dishes?** Recipes that are one or two ingredients away, plus a ranked list of single purchases and how many recipes each one unlocks.

Every recipe scales to any number of servings (1–12). The app ships with 64 preset recipes (Japanese, Western, Chinese and Korean-inspired) and a catalog of about 160 ingredients, and you can add your own ingredients and recipes.

## Features

- **Pantry** — search the bilingual ingredient catalog and add what you have. Optional quantity, best-before date (with "expiring soon" and "expired" badges) and storage location (fridge / freezer / pantry). One tap adds the common Japanese staples (soy sauce, miso, mirin, etc.).
- **Cook** — three sections: *Ready to cook*, *Almost there* (missing up to N ingredients, N configurable 1–3) and *Buy this, unlock that*. Recipes that use expiring items float to the top. Filter by cuisine; pick servings.
- **Recipes** — browse and search presets and your own recipes. Detail view scales amounts to the selected servings and marks each ingredient as *Have* or *Missing*. Duplicate a preset to customize it, or write a recipe from scratch in either or both languages.
- **Shopping list** — add missing ingredients from any recipe or suggestion. Checking an item off moves it into the pantry.
- **Settings** — language, servings, "almost there" threshold, JSON export/import, and reset.

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

All data lives in the browser under the localStorage key `grocery-manager` (schema version 1). Nothing is sent to a server. Use **Settings → Export JSON** to download a backup and **Import JSON** to restore it on another device; import validates the file and asks for confirmation before replacing your data.

If localStorage is unavailable (for example in some private-browsing modes), the app still runs in memory and warns you once that data will not persist.

## How suggestions are computed

Matching is presence-based: a recipe ingredient is satisfied when the ingredient is in the pantry, regardless of quantity. Ingredients marked *optional* in a recipe never affect the result.

- **Ready** — no required ingredient is missing.
- **Almost there** — 1 to *threshold* required ingredients are missing (default threshold 2).
- **Buy this, unlock that** — for every ingredient missing from an *almost* recipe: *unlocks* counts the recipes where it is the only missing ingredient, *helps* counts the recipes where other ingredients are also missing. Sorted by unlocks, then helps.

Ready recipes are sorted by how many expiring pantry items they use (best-before within 3 days, including already expired), then by cooking time. Servings scale linearly from each recipe's base servings and round to one decimal.

## Project structure

```
src/
  domain/      Pure functions and types: matching, scaling, search, dates, localization
  data/        Preset ingredient catalog, staples, and recipes (one file per cuisine)
  store/       Zustand store with localStorage persistence, migrations, import/export
  i18n/        UI string dictionaries (en.ts is the source of truth for keys) and hooks
  components/  Shared UI (buttons, badges, sheets, navigation, toast)
  features/    One folder per screen: pantry, suggestions, recipes, shopping, settings
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

Multi-device sync, PWA install, automatic inventory deduction after cooking, AI-generated ideas, nutrition data, photos and barcode scanning.

## License

MIT
