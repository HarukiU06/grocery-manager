import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { ServingsStepper } from '../../components/ServingsStepper';
import { useToastStore } from '../../components/toastStore';
import { localize, localizeList } from '../../domain/localize';
import { formatIngredientAmount } from '../../domain/scaling';
import { useLang, useT } from '../../i18n';
import { useIngredientName, usePantryIds, useRecipe } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const recipe = useRecipe(id);
  const pantryIds = usePantryIds();
  const nameOf = useIngredientName();
  const servings = useAppStore((s) => s.servings);
  const setServings = useAppStore((s) => s.setServings);
  const addToShopping = useAppStore((s) => s.addToShopping);
  const duplicateRecipe = useAppStore((s) => s.duplicateRecipe);
  const deleteCustomRecipe = useAppStore((s) => s.deleteCustomRecipe);
  const showToast = useToastStore((s) => s.show);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!recipe) {
    return (
      <div className="p-4">
        <PageHeader title={t('recipes.title')} backTo="/recipes" />
        <p className="text-sm text-stone-600">{t('recipe.notFound')}</p>
      </div>
    );
  }

  const missing = recipe.ingredients
    .filter((ri) => !ri.optional && !pantryIds.has(ri.ingredientId))
    .map((ri) => ri.ingredientId);
  const steps = localizeList(recipe.steps, lang);

  const addMissing = () => {
    for (const ingredientId of missing) addToShopping(ingredientId);
    showToast(t('suggestions.addedToShopping'));
  };
  const duplicate = () => {
    const copy = duplicateRecipe(recipe);
    navigate(`/recipes/${copy.id}/edit`);
  };
  const remove = () => {
    deleteCustomRecipe(recipe.id);
    navigate('/recipes');
  };

  return (
    <div className="p-4">
      <PageHeader title={localize(recipe.name, lang)} backTo="/recipes" />
      <div className="mb-3 flex flex-wrap items-center gap-1">
        <Badge>{t(`cuisine.${recipe.cuisine}`)}</Badge>
        <Badge>{t(`recipeCategory.${recipe.category}`)}</Badge>
        {recipe.timeMinutes !== undefined && <Badge>{t('recipes.minutes', { count: recipe.timeMinutes })}</Badge>}
        {!recipe.isPreset && <Badge tone="green">{t('recipes.custom')}</Badge>}
      </div>
      {recipe.description && <p className="mb-4 text-sm text-stone-700">{localize(recipe.description, lang)}</p>}

      <div className="mb-4">
        <ServingsStepper value={servings} onChange={setServings} />
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">{t('recipe.ingredients')}</h2>
        <ul
          aria-label={t('recipe.ingredients')}
          className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white"
        >
          {recipe.ingredients.map((ri) => {
            const have = pantryIds.has(ri.ingredientId);
            return (
              <li key={ri.ingredientId} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">
                    {nameOf(ri.ingredientId)}
                    {ri.optional && <span className="ml-1 text-xs text-stone-500">({t('common.optional')})</span>}
                  </span>
                  {ri.amount !== undefined && ri.note && (
                    <span className="text-xs text-stone-500">{localize(ri.note, lang)}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-stone-700">
                    {formatIngredientAmount(ri, recipe.baseServings, servings, lang, t)}
                  </span>
                  {have ? (
                    <Badge tone="green">{t('recipe.have')}</Badge>
                  ) : (
                    <Badge tone={ri.optional ? 'neutral' : 'red'}>{t('recipe.missing')}</Badge>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {missing.length > 0 && (
          <div className="mt-2">
            <Button variant="secondary" size="sm" onClick={addMissing}>
              {t('recipe.addMissingToShopping')}
            </Button>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">{t('recipe.steps')}</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-stone-800">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        {recipe.isPreset ? (
          <Button variant="secondary" onClick={duplicate}>
            {t('recipe.duplicate')}
          </Button>
        ) : (
          <>
            <Link
              to={`/recipes/${recipe.id}/edit`}
              className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              {t('common.edit')}
            </Link>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              {t('common.delete')}
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={t('recipe.deleteConfirmTitle')}
        body={t('recipe.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
