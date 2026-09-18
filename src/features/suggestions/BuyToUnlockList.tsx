import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { localize } from '../../domain/localize';
import type { BuyToUnlock } from '../../domain/matching';
import { useLang, useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';

interface Props {
  entries: BuyToUnlock[];
  onAddToShopping: (ingredientId: string) => void;
}

export function BuyToUnlockList({ entries, onAddToShopping }: Props) {
  const t = useT();
  const lang = useLang();
  const nameOf = useIngredientName();
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => {
        const isOpen = expanded === entry.ingredientId;
        return (
          <li key={entry.ingredientId} className="rounded-xl border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : entry.ingredientId)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-base font-semibold text-stone-900">{nameOf(entry.ingredientId)}</span>
                <span className="text-xs text-stone-600">
                  {t('suggestions.unlocks', { count: entry.unlocks.length })} ·{' '}
                  {t('suggestions.helps', { count: entry.helps.length })}
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('suggestions.addToShopping')}
                onClick={() => onAddToShopping(entry.ingredientId)}
              >
                + {t('suggestions.addToShopping')}
              </Button>
            </div>
            {isOpen && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {[...entry.unlocks, ...entry.helps].map((recipe) => (
                  <li key={recipe.id}>
                    <Link
                      to={`/recipes/${recipe.id}`}
                      className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 hover:bg-stone-200"
                    >
                      {localize(recipe.name, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
