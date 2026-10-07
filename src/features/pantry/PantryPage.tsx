import { useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useToastStore } from '../../components/toastStore';
import { todayIso } from '../../domain/dates';
import { formatQuantity } from '../../domain/scaling';
import { useLang, useT } from '../../i18n';
import { useIngredientLookup } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { groupPantryByCategory } from './groupPantry';
import { IngredientPicker } from './IngredientPicker';
import { PantryGroup } from './PantryGroup';
import { PantryItemSheet } from './PantryItemSheet';
import { RestockSheet } from './RestockSheet';

export function PantryPage() {
  const t = useT();
  const lang = useLang();
  const pantry = useAppStore((s) => s.pantry);
  const addCommonStaples = useAppStore((s) => s.addCommonStaples);
  const showToast = useToastStore((s) => s.show);
  const lookup = useIngredientLookup();
  const [editing, setEditing] = useState<string | null>(null);
  const [restocking, setRestocking] = useState<string | null>(null);
  const today = todayIso();

  const groups = useMemo(() => groupPantryByCategory(pantry, lookup, lang), [pantry, lookup, lang]);

  const pantryHints = useMemo(() => {
    const hints = new Map<string, string>();
    for (const item of pantry) {
      const amount = item.quantity && formatQuantity(item.quantity.amount, item.quantity.unit, lang, t);
      hints.set(item.ingredientId, amount ? t('pantry.inPantryAmount', { amount }) : t('pantry.inPantry'));
    }
    return hints;
  }, [pantry, lang, t]);

  const handleStaples = () => {
    const count = addCommonStaples();
    showToast(t('pantry.staplesAdded', { count }));
  };

  return (
    <div className="p-4">
      <PageHeader
        title={t('pantry.title')}
        action={
          pantry.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleStaples}>
              {t('pantry.addStaples')}
            </Button>
          ) : undefined
        }
      />
      <IngredientPicker
        onPick={setRestocking}
        placeholder={t('pantry.searchPlaceholder')}
        hint={(id) => pantryHints.get(id)}
      />
      <div className="mt-4">
        {pantry.length === 0 ? (
          <EmptyState
            title={t('pantry.emptyTitle')}
            body={t('pantry.emptyBody')}
            action={<Button onClick={handleStaples}>{t('pantry.addStaples')}</Button>}
          />
        ) : (
          groups.map((group) => (
            <PantryGroup key={group.category} group={group} today={today} onSelect={setEditing} />
          ))
        )}
      </div>
      <PantryItemSheet ingredientId={editing} onClose={() => setEditing(null)} />
      <RestockSheet ingredientId={restocking} onClose={() => setRestocking(null)} />
    </div>
  );
}
