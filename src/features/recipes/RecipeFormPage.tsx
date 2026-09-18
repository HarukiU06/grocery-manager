import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import {
  CUISINES,
  RECIPE_CATEGORIES,
  UNITS,
  type Cuisine,
  type RecipeCategory,
  type Unit,
} from '../../domain/types';
import { useT, type TranslationKey } from '../../i18n';
import { useIngredientName, useRecipe } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { IngredientPicker } from '../pantry/IngredientPicker';
import {
  draftFromRecipe,
  emptyDraft,
  recipeFromDraft,
  type DraftIngredient,
  type RecipeDraft,
  type RecipeDraftError,
} from './recipeDraft';

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';
const ERROR_KEY: Record<RecipeDraftError, TranslationKey> = {
  name: 'recipeForm.errorName',
  ingredients: 'recipeForm.errorIngredients',
  steps: 'recipeForm.errorSteps',
  servings: 'recipeForm.errorServings',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone-600">{label}</span>
      {children}
    </label>
  );
}

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const navigate = useNavigate();
  const existing = useRecipe(id);
  const nameOf = useIngredientName();
  const addCustomRecipe = useAppStore((s) => s.addCustomRecipe);
  const updateCustomRecipe = useAppStore((s) => s.updateCustomRecipe);
  const [draft, setDraft] = useState<RecipeDraft>(() =>
    existing && !existing.isPreset ? draftFromRecipe(existing) : emptyDraft(),
  );
  const [errors, setErrors] = useState<RecipeDraftError[]>([]);
  const isEdit = Boolean(existing && !existing.isPreset);

  const patch = (changes: Partial<RecipeDraft>) => setDraft((d) => ({ ...d, ...changes }));
  const patchIngredient = (index: number, changes: Partial<DraftIngredient>) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((ri, i) => (i === index ? { ...ri, ...changes } : ri)),
    }));
  const addIngredient = (ingredientId: string) =>
    setDraft((d) =>
      d.ingredients.some((ri) => ri.ingredientId === ingredientId)
        ? d
        : { ...d, ingredients: [...d.ingredients, { ingredientId, amount: '', unit: '', optional: false }] },
    );
  const removeIngredient = (index: number) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, i) => i !== index) }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = recipeFromDraft(draft);
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }
    if (isEdit && existing) {
      updateCustomRecipe(existing.id, result.recipe);
      navigate(`/recipes/${existing.id}`);
    } else {
      const created = addCustomRecipe(result.recipe);
      navigate(`/recipes/${created.id}`);
    }
  };

  return (
    <div className="p-4">
      <PageHeader
        title={isEdit ? t('recipeForm.editTitle') : t('recipeForm.newTitle')}
        backTo={isEdit && existing ? `/recipes/${existing.id}` : '/recipes'}
      />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('recipeForm.nameJa')}>
            <input className={inputClass} value={draft.nameJa} onChange={(e) => patch({ nameJa: e.target.value })} />
          </Field>
          <Field label={t('recipeForm.nameEn')}>
            <input className={inputClass} value={draft.nameEn} onChange={(e) => patch({ nameEn: e.target.value })} />
          </Field>
          <Field label={t('recipeForm.descriptionJa')}>
            <input
              className={inputClass}
              value={draft.descriptionJa}
              onChange={(e) => patch({ descriptionJa: e.target.value })}
            />
          </Field>
          <Field label={t('recipeForm.descriptionEn')}>
            <input
              className={inputClass}
              value={draft.descriptionEn}
              onChange={(e) => patch({ descriptionEn: e.target.value })}
            />
          </Field>
          <Field label={t('recipeForm.cuisine')}>
            <select
              className={inputClass}
              value={draft.cuisine}
              onChange={(e) => patch({ cuisine: e.target.value as Cuisine })}
            >
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {t(`cuisine.${c}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('recipeForm.category')}>
            <select
              className={inputClass}
              value={draft.category}
              onChange={(e) => patch({ category: e.target.value as RecipeCategory })}
            >
              {RECIPE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`recipeCategory.${c}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('recipeForm.baseServings')}>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={draft.baseServings}
              onChange={(e) => patch({ baseServings: e.target.value })}
            />
          </Field>
          <Field label={t('recipeForm.timeMinutes')}>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={draft.timeMinutes}
              onChange={(e) => patch({ timeMinutes: e.target.value })}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t('recipeForm.ingredients')}</legend>
          <IngredientPicker onPick={addIngredient} placeholder={t('recipeForm.addIngredientPlaceholder')} />
          <ul className="mt-2 flex flex-col gap-2">
            {draft.ingredients.map((ri, index) => (
              <li key={ri.ingredientId} className="rounded-xl border border-stone-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{nameOf(ri.ingredientId)}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeIngredient(index)}>
                    {t('common.remove')}
                  </Button>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <Field label={t('recipeForm.amount')}>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step="any"
                      value={ri.amount}
                      onChange={(e) => patchIngredient(index, { amount: e.target.value })}
                    />
                  </Field>
                  <Field label={t('recipeForm.unit')}>
                    <select
                      className={inputClass}
                      value={ri.unit}
                      onChange={(e) => patchIngredient(index, { unit: e.target.value as Unit | '' })}
                    >
                      <option value="">{t('recipeForm.noUnit')}</option>
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {t(`unit.${u}`)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <label className="flex items-center gap-1 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ri.optional}
                      onChange={(e) => patchIngredient(index, { optional: e.target.checked })}
                    />
                    {t('recipeForm.optional')}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </fieldset>

        <Field label={t('recipeForm.stepsJa')}>
          <textarea
            className={inputClass}
            rows={5}
            value={draft.stepsJa}
            onChange={(e) => patch({ stepsJa: e.target.value })}
          />
        </Field>
        <Field label={t('recipeForm.stepsEn')}>
          <textarea
            className={inputClass}
            rows={5}
            value={draft.stepsEn}
            onChange={(e) => patch({ stepsEn: e.target.value })}
          />
        </Field>

        {errors.length > 0 && (
          <ul role="alert" className="flex flex-col gap-1 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{t(ERROR_KEY[error])}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}
