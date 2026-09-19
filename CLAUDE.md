# CLAUDE.md

Guidance for AI agents working in this repository.

## What this is

Grocery Manager: a bilingual (JA/EN) React single-page app that tracks pantry contents, suggests recipes that can be cooked now or with a small purchase, estimates nutrition, and keeps a weekly cooking log. No backend; state persists to localStorage. See `README.md` for features. Design and plan documents live in `docs/superpowers/specs/` and `docs/superpowers/plans/`; the v2 spec, `2026-09-19-grocery-manager-v2-design.md`, is the current one.

Stack: Vite, React 19, TypeScript (strict), Tailwind CSS v4, Zustand v5 (`persist`), react-router-dom v7 (hash router), Vitest + Testing Library, ESLint flat config.

## Commands

```bash
npm run dev      # dev server
npm test         # vitest run
npm run lint     # eslint .
npm run build    # tsc -b && vite build (must pass before finishing any task)
```

## Conventions

- **English everywhere** in code, comments, commit messages and docs. Japanese appears only in `src/i18n/ja.ts` and in preset content under `src/data/`.
- **Every UI string goes through `t()`** from `src/i18n`. Add the key to `src/i18n/en.ts` first (it defines `TranslationKey`), then `ja.ts`; a missing Japanese key is a type error and a test failure.
- **Preset content is bilingual by contract.** Ingredients and recipes must provide both `ja` and `en`; recipes need the same number of steps in both languages. `src/data/data.test.ts` enforces this along with unique IDs and valid ingredient references.
- **Ingredient IDs are kebab-case slugs** (`soy-sauce`). Custom items get `custom-...` IDs from `newId()`. Water is never an ingredient.
- **Domain logic is pure.** `src/domain/*` has no React and is fully unit-tested. Matching is presence-based; optional recipe ingredients never affect status.
- `verbatimModuleSyntax` is on: use `import type` for types. `noUnusedLocals` / `noUnusedParameters` are on.
- Do not sync props into state with `useEffect`; mount a keyed child instead (see `PantryItemSheet.tsx`). The `react-hooks/set-state-in-effect` lint rule enforces this.
- Tests reset the store with `useAppStore.setState(defaultPersistedState('en'))` in `beforeEach`. Page tests render through `renderWithRouter` from `src/test/render.tsx`.
- `toGrams` returns `null` when a conversion is unknown. Callers report it; never substitute a guess.
- Only required ingredients count toward nutrition. Optional ones and amount-less ones are reported as excluded.
- Weeks start Monday, and weekly averages divide by recorded days rather than by seven.
- Recipe import never saves a recipe. It prefills the form so the normal validation still runs.
- Nutrition values are estimates and every surface says so. `src/data/data.test.ts` enforces row completeness, plausible ranges and energy consistency with the macronutrients.
- Commit per task with conventional-style messages. `main` auto-deploys to GitHub Pages, so push only finished work.

## Where things live

| Concern | Path |
|---|---|
| Types and constants | `src/domain/types.ts` |
| Recipe matching / buy-to-unlock | `src/domain/matching.ts` |
| Ingredient filter predicate | `src/domain/recipeFilter.ts` |
| Unit and gram conversion | `src/domain/units.ts`, `src/data/conversions.ts` |
| Nutrition totals | `src/domain/nutrition.ts`, `src/data/nutrition.ts` |
| Daily reference intakes | `src/domain/targets.ts`, `src/data/targets.ts` |
| Weekly cooking log | `src/domain/cookingLog.ts` |
| Recipe import parsers | `src/domain/recipeImport/` |
| Servings scaling and amount formatting | `src/domain/scaling.ts` |
| Ingredient search (JA/EN, kana folding) | `src/domain/search.ts` |
| Store, actions, storage fallback | `src/store/useAppStore.ts` |
| Derived hooks (all ingredients, lookups) | `src/store/selectors.ts` |
| Import/export and migrations | `src/store/exportImport.ts`, `src/store/migrations.ts` |
| Preset data | `src/data/ingredients.ts`, `src/data/staples.ts`, `src/data/recipes/*.ts` |
| Screens | `src/features/<pantry|suggestions|recipes|shopping|log|settings>/` |
| Shared UI | `src/components/` |

## Skill activation

Before the first tool call of any session — and before writing or
proposing a plan, not merely before executing one — invoke the
task-observer skill AND execute its Session Start Protocol (storage
check, frontmatter scan, review trigger). Loading the skill and running
the protocol are separate steps; a session that loads the file and stops
has activated nothing. Any turn that will involve a tool call counts; do
not classify the session as "too simple" from its opening message.

After completing each task, check the observation records written this
session and report a one-line summary (ids and titles, or "none logged
and why"). This is the activation backstop: it forces a look at the log,
so a session that silently skipped the protocol is discovered at the
first task boundary instead of never.

Loading a skill is not complete until you have queried the observation
log for OPEN observations naming it and read their bodies:
  grep -l "skill:.*<skill-name>" \
    C:/Users/uenoh/.claude/projects/C--avatar/memory/skill-observations/observation-log/*.md
Apply their insights to the current work, even if the skill file hasn't
been updated yet. Run this at every skill load, however many skills load
in one session. The session-start scan does not cover it: that is a
frontmatter sweep over every observation at session start, this is a
targeted body read at the moment the skill's rules are applied.

The observation log for this machine is pinned at
`C:/Users/uenoh/.claude/projects/C--avatar/memory/skill-observations/`
(adopted from an existing install; do not create a second log beside it).
