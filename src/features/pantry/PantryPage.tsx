import { useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useToastStore } from '../../components/toastStore';
import { todayIso } from '../../domain/dates';
import { useLang, useT } from '../../i18n';
import { useIngredientLookup, usePantryIds } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { groupPantryByCategory } from './groupPantry';
import { IngredientPicker } from './IngredientPicker';
import { PantryGroup } from './PantryGroup';
import { PantryItemSheet } from './PantryItemSheet';

export function PantryPage() {
  const t = useT();
  const lang = useLang();
  const pantry = useAppStore((s) => s.pantry);
  const addPantryItem = useAppStore((s) => s.addPantryItem);
  const addCommonStaples = useAppStore((s) => s.addCommonStaples);
  const showToast = useToastStore((s) => s.show);
  const lookup = useIngredientLookup();
  const pantryIds = usePantryIds();
  const [editing, setEditing] = useState<string | null>(null);
  const today = todayIso();

  const groups = useMemo(() => groupPantryByCategory(pantry, lookup, lang), [pantry, lookup, lang]);

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
        onPick={(id) => addPantryItem(id)}
        placeholder={t('pantry.searchPlaceholder')}
        disabledIds={pantryIds}
        disabledLabel={t('pantry.inPantry')}
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
    </div>
  );
}
