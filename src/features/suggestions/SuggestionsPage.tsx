import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { IngredientFilterSheet, recipeUsesAll } from '../../components/IngredientFilterSheet';
import { PageHeader } from '../../components/PageHeader';
import { ServingsStepper } from '../../components/ServingsStepper';
import { useToastStore } from '../../components/toastStore';
import { todayIso } from '../../domain/dates';
import { buildSuggestions } from '../../domain/matching';
import { CUISINES, type Cuisine } from '../../domain/types';
import { useT } from '../../i18n';
import { useAllRecipes, useIngredientName } from '../../store/selectors';
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
  const nameOf = useIngredientName();
  const [cuisine, setCuisine] = useState<Cuisine | 'all'>('all');
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const today = todayIso();

  const suggestions = useMemo(() => {
    const filtered = recipes
      .filter((r) => cuisine === 'all' || r.cuisine === cuisine)
      .filter((r) => recipeUsesAll(r, filterIds));
    return buildSuggestions(filtered, pantry, { almostThreshold, today });
  }, [recipes, pantry, almostThreshold, cuisine, filterIds, today]);

  const handleAdd = (ingredientId: string) => {
    addToShopping(ingredientId);
    showToast(t('suggestions.addedToShopping'));
  };

  return (
    <div className="p-4">
      <PageHeader title={t('suggestions.title')} />
      <div className="mb-3">
        <ServingsStepper value={servings} onChange={setServings} />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Chip selected={cuisine === 'all'} onClick={() => setCuisine('all')}>
          {t('suggestions.filterAll')}
        </Chip>
        {CUISINES.map((c) => (
          <Chip key={c} selected={cuisine === c} onClick={() => setCuisine(c)}>
            {t(`cuisine.${c}`)}
          </Chip>
        ))}
      </div>

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

      <Section title={t('suggestions.ready')} empty={suggestions.ready.length === 0 ? t('suggestions.readyEmpty') : null}>
        <ul className="flex flex-col gap-2">
          {suggestions.ready.map((match) => (
            <RecipeMatchCard key={match.recipe.id} match={match} onAddToShopping={handleAdd} />
          ))}
        </ul>
      </Section>

      <Section title={t('suggestions.almost')} empty={suggestions.almost.length === 0 ? t('suggestions.almostEmpty') : null}>
        <ul className="flex flex-col gap-2">
          {suggestions.almost.map((match) => (
            <RecipeMatchCard key={match.recipe.id} match={match} onAddToShopping={handleAdd} />
          ))}
        </ul>
      </Section>

      <Section
        title={t('suggestions.buyToUnlock')}
        empty={suggestions.buyToUnlock.length === 0 ? t('suggestions.buyEmpty') : null}
      >
        <BuyToUnlockList entries={suggestions.buyToUnlock} onAddToShopping={handleAdd} />
      </Section>
    </div>
  );
}
