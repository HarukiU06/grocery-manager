import { useMemo, useState, type ReactNode } from 'react';
import { Chip } from '../../components/Chip';
import { PageHeader } from '../../components/PageHeader';
import { ServingsStepper } from '../../components/ServingsStepper';
import { useToastStore } from '../../components/toastStore';
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
