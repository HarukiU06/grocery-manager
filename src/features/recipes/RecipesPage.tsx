import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { IngredientFilterSheet } from '../../components/IngredientFilterSheet';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { localize } from '../../domain/localize';
import { recipeUsesAll } from '../../domain/recipeFilter';
import { normalizeForSearch } from '../../domain/search';
import { CUISINES, type Cuisine } from '../../domain/types';
import { useLang, useT } from '../../i18n';
import { useAllRecipes, useIngredientName } from '../../store/selectors';

export function RecipesPage() {
  const t = useT();
  const lang = useLang();
  const recipes = useAllRecipes();
  const nameOf = useIngredientName();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | 'all'>('all');
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const visible = useMemo(() => {
    const q = normalizeForSearch(query);
    return recipes.filter((recipe) => {
      if (cuisine !== 'all' && recipe.cuisine !== cuisine) return false;
      if (!recipeUsesAll(recipe, filterIds)) return false;
      if (!q) return true;
      return [recipe.name.ja, recipe.name.en].some((name) => name && normalizeForSearch(name).includes(q));
    });
  }, [recipes, query, cuisine, filterIds]);

  return (
    <div className="p-4">
      <PageHeader
        title={t('recipes.title')}
        action={
          <span className="flex shrink-0 gap-2">
            <Link
              to="/recipes/import"
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              {t('import.open')}
            </Link>
            <Link
              to="/recipes/new"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {t('recipes.new')}
            </Link>
          </span>
        }
      />
      <SearchInput value={query} onChange={setQuery} placeholder={t('recipes.searchPlaceholder')} />
      <div className="my-3 flex gap-2 overflow-x-auto pb-1">
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
      {visible.length === 0 ? (
        <p className="text-sm text-stone-500">{t('recipes.empty')}</p>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {visible.map((recipe) => (
            <li key={recipe.id}>
              <Link
                to={`/recipes/${recipe.id}`}
                className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-stone-50"
              >
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
