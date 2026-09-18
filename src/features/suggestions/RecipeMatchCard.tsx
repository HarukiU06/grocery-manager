import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { localize } from '../../domain/localize';
import type { RecipeMatch } from '../../domain/matching';
import { useLang, useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';

interface Props {
  match: RecipeMatch;
  onAddToShopping: (ingredientId: string) => void;
}

export function RecipeMatchCard({ match, onAddToShopping }: Props) {
  const t = useT();
  const lang = useLang();
  const nameOf = useIngredientName();
  const { recipe } = match;
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-3">
      <Link to={`/recipes/${recipe.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <span className="text-base font-semibold text-stone-900">{localize(recipe.name, lang)}</span>
          {recipe.timeMinutes !== undefined && (
            <span className="shrink-0 text-xs text-stone-500">{t('recipes.minutes', { count: recipe.timeMinutes })}</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge>{t(`cuisine.${recipe.cuisine}`)}</Badge>
          <Badge>{t(`recipeCategory.${recipe.category}`)}</Badge>
          {match.usesExpiring.length > 0 && <Badge tone="amber">{t('suggestions.usesExpiring')}</Badge>}
          {match.missingRequired.length > 0 && (
            <Badge tone="red">{t('suggestions.missingCount', { count: match.missingRequired.length })}</Badge>
          )}
        </div>
      </Link>
      {match.missingRequired.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {match.missingRequired.map((id) => (
            <li key={id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-stone-700">{nameOf(id)}</span>
              <Button variant="ghost" size="sm" aria-label={t('suggestions.addToShopping')} onClick={() => onAddToShopping(id)}>
                + {t('suggestions.addToShopping')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
