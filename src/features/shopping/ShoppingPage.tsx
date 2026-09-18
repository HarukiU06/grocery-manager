import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useToastStore } from '../../components/toastStore';
import { useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { IngredientPicker } from '../pantry/IngredientPicker';

export function ShoppingPage() {
  const t = useT();
  const nameOf = useIngredientName();
  const shoppingList = useAppStore((s) => s.shoppingList);
  const addToShopping = useAppStore((s) => s.addToShopping);
  const removeFromShopping = useAppStore((s) => s.removeFromShopping);
  const markBought = useAppStore((s) => s.markBought);
  const showToast = useToastStore((s) => s.show);
  const listedIds = new Set(shoppingList.map((item) => item.ingredientId));

  const buy = (ingredientId: string) => {
    markBought(ingredientId);
    showToast(t('shopping.bought'));
  };

  return (
    <div className="p-4">
      <PageHeader title={t('shopping.title')} />
      <IngredientPicker onPick={addToShopping} placeholder={t('shopping.searchPlaceholder')} disabledIds={listedIds} />
      <div className="mt-4">
        {shoppingList.length === 0 ? (
          <EmptyState title={t('shopping.title')} body={t('shopping.empty')} />
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
            {shoppingList.map((item) => {
              const name = nameOf(item.ingredientId);
              return (
                <li key={item.ingredientId} className="flex items-center justify-between gap-2 px-4 py-3">
                  <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-emerald-600"
                      aria-label={`${t('shopping.markBought')} ${name}`}
                      checked={false}
                      onChange={() => buy(item.ingredientId)}
                    />
                    <span className="truncate">{name}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`${t('common.remove')} ${name}`}
                    onClick={() => removeFromShopping(item.ingredientId)}
                    className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
