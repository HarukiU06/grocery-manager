import { useState } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Sheet } from '../../components/Sheet';
import { useToastStore } from '../../components/toastStore';
import { useT, type TranslationKey } from '../../i18n';
import { useAppStore, type ClearSelection } from '../../store/useAppStore';

const ROWS: Array<{ key: keyof ClearSelection; label: TranslationKey }> = [
  { key: 'pantry', label: 'clear.pantry' },
  { key: 'shoppingList', label: 'clear.shoppingList' },
  { key: 'customRecipes', label: 'clear.customRecipes' },
  { key: 'customIngredients', label: 'clear.customIngredients' },
  { key: 'cookingLog', label: 'clear.cookingLog' },
  { key: 'settings', label: 'clear.settings' },
];

export function ClearDataSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const clearData = useAppStore((s) => s.clearData);
  const showToast = useToastStore((s) => s.show);
  const [selection, setSelection] = useState<ClearSelection>({});
  const [confirming, setConfirming] = useState(false);
  const anySelected = Object.values(selection).some(Boolean);

  const apply = () => {
    clearData(selection);
    setConfirming(false);
    setSelection({});
    onClose();
    showToast(t('clear.done'));
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title={t('clear.title')}>
        <ul className="mb-3 flex flex-col gap-1">
          {ROWS.map((row) => (
            <li key={row.key}>
              <label className="flex items-center gap-3 py-1 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-red-600"
                  checked={Boolean(selection[row.key])}
                  onChange={(e) => setSelection((current) => ({ ...current, [row.key]: e.target.checked }))}
                  aria-label={t(row.label)}
                />
                <span>{t(row.label)}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mb-3 text-xs text-stone-500">{t('clear.ingredientWarning')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" disabled={!anySelected} onClick={() => setConfirming(true)}>
            {t('clear.open')}
          </Button>
        </div>
        {!anySelected && <p className="mt-2 text-right text-xs text-stone-400">{t('clear.none')}</p>}
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title={t('clear.confirmTitle')}
        body={t('clear.confirmBody')}
        confirmLabel={t('common.confirm')}
        danger
        onConfirm={apply}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
