import { useMemo, useState } from 'react';
import { SearchInput } from '../../components/SearchInput';
import { localize } from '../../domain/localize';
import { hasExactMatch, searchIngredients } from '../../domain/search';
import { useLang, useT } from '../../i18n';
import { useAllIngredients } from '../../store/selectors';
import { NewIngredientForm } from './NewIngredientForm';

interface Props {
  onPick: (ingredientId: string) => void;
  placeholder: string;
  disabledIds?: Set<string>;
  disabledLabel?: string;
  allowCreate?: boolean;
  autoFocus?: boolean;
}

const MAX_RESULTS = 8;

export function IngredientPicker({
  onPick,
  placeholder,
  disabledIds,
  disabledLabel,
  allowCreate = true,
  autoFocus = false,
}: Props) {
  const t = useT();
  const lang = useLang();
  const all = useAllIngredients();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const results = useMemo(() => searchIngredients(all, query, MAX_RESULTS), [all, query]);
  const trimmed = query.trim();
  const canCreate = allowCreate && trimmed.length > 0 && !hasExactMatch(all, trimmed);

  const pick = (id: string) => {
    onPick(id);
    setQuery('');
  };

  return (
    <div className="relative">
      <SearchInput value={query} onChange={setQuery} placeholder={placeholder} autoFocus={autoFocus} />
      {trimmed.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          {results.map((ingredient) => {
            const disabled = disabledIds?.has(ingredient.id) ?? false;
            return (
              <li key={ingredient.id}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={localize(ingredient.name, lang)}
                  onClick={() => pick(ingredient.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-stone-50 disabled:cursor-default disabled:text-stone-400"
                >
                  <span>{localize(ingredient.name, lang)}</span>
                  <span className="text-xs text-stone-500">
                    {disabled && disabledLabel ? disabledLabel : t(`category.${ingredient.category}`)}
                  </span>
                </button>
              </li>
            );
          })}
          {results.length === 0 && !canCreate && (
            <li className="px-4 py-2.5 text-sm text-stone-500">{t('ingredient.noResults')}</li>
          )}
          {canCreate && (
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                {t('ingredient.createNew', { name: trimmed })}
              </button>
            </li>
          )}
        </ul>
      )}
      <NewIngredientForm
        open={creating}
        initialName={trimmed}
        onClose={() => setCreating(false)}
        onCreated={(ingredient) => pick(ingredient.id)}
      />
    </div>
  );
}
