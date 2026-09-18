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
        action={
          <Link
            to="/recipes/new"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {t('recipes.new')}
          </Link>
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
