import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ServingsStepper } from '../../components/ServingsStepper';
import { Sheet } from '../../components/Sheet';
import { useToastStore } from '../../components/toastStore';
import { todayIso } from '../../domain/dates';
import { computeRecipeNutrition } from '../../domain/nutrition';
import type { Recipe } from '../../domain/types';
import { useT } from '../../i18n';
import { useIngredientName, usePantryIds } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}

export function CookSheet({ recipe, open, onClose }: Props) {
  const t = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t('cook.title')}>
      {/* Children mount only while the sheet is open, so the form state starts fresh. */}
      <CookForm recipe={recipe} onClose={onClose} />
    </Sheet>
  );
}

function CookForm({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const nameOf = useIngredientName();
  const pantryIds = usePantryIds();
  const globalServings = useAppStore((s) => s.servings);
  const logCook = useAppStore((s) => s.logCook);
  const removePantryItem = useAppStore((s) => s.removePantryItem);
  const showToast = useToastStore((s) => s.show);

  const removable = recipe.ingredients
    .filter((ri) => !ri.optional && pantryIds.has(ri.ingredientId))
    .map((ri) => ri.ingredientId);
  const [servings, setServings] = useState(globalServings);
  const [checked, setChecked] = useState<string[]>(removable);

  const record = () => {
    for (const id of checked) removePantryItem(id);
    logCook({
      recipeId: recipe.id,
      recipeName: recipe.name,
      servings,
      cookedOn: todayIso(),
      nutrition: computeRecipeNutrition(recipe, servings).total,
    });
    onClose();
    showToast(t('cook.recorded'));
    navigate('/log');
  };

  return (
    <div className="flex flex-col gap-4">
      <ServingsStepper value={servings} onChange={setServings} />
      <section>
        <h3 className="mb-1 text-sm font-semibold text-stone-700">{t('cook.removeFromPantry')}</h3>
        <p className="mb-2 text-xs text-stone-500">{t('cook.removeHint')}</p>
        {removable.length === 0 ? (
          <p className="text-sm text-stone-500">{t('cook.nothingToRemove')}</p>
        ) : (
          <ul className="rounded-xl border border-stone-200">
            {removable.map((id) => (
              <li key={id} className="border-b border-stone-100 last:border-b-0">
                <label className="flex items-center gap-3 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-emerald-600"
                    aria-label={nameOf(id)}
                    checked={checked.includes(id)}
                    onChange={() => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))}
                  />
                  <span className="truncate">{nameOf(id)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={record}>{t('cook.record')}</Button>
      </div>
    </div>
  );
}
