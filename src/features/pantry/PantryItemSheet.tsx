import { useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { STORAGE_LOCATIONS, type PantryItem, type StorageLocation } from '../../domain/types';
import { useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  ingredientId: string | null;
  onClose: () => void;
}

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';

export function PantryItemSheet({ ingredientId, onClose }: Props) {
  const t = useT();
  const item = useAppStore((s) => s.pantry.find((p) => p.ingredientId === ingredientId));
  return (
    <Sheet open={item !== undefined} onClose={onClose} title={t('pantry.editItem')}>
      {/* Keyed so the form remounts with fresh state for each item. */}
      {item && <PantryItemForm key={item.ingredientId} item={item} onClose={onClose} />}
    </Sheet>
  );
}

function PantryItemForm({ item, onClose }: { item: PantryItem; onClose: () => void }) {
  const t = useT();
  const nameOf = useIngredientName();
  const updatePantryItem = useAppStore((s) => s.updatePantryItem);
  const removePantryItem = useAppStore((s) => s.removePantryItem);
  const [quantity, setQuantity] = useState(item.quantity ?? '');
  const [expiresOn, setExpiresOn] = useState(item.expiresOn ?? '');
  const [location, setLocation] = useState<StorageLocation | ''>(item.location ?? '');

  const save = (event: FormEvent) => {
    event.preventDefault();
    updatePantryItem(item.ingredientId, {
      quantity: quantity.trim() || undefined,
      expiresOn: expiresOn || undefined,
      location: location || undefined,
    });
    onClose();
  };

  const remove = () => {
    removePantryItem(item.ingredientId);
    onClose();
  };

  return (
    <>
      <p className="mb-3 text-base font-semibold">{nameOf(item.ingredientId)}</p>
      <form onSubmit={save} className="flex flex-col gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.quantity')}</span>
          <input
            className={inputClass}
            value={quantity}
            placeholder={t('pantry.quantityPlaceholder')}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.expiresOn')}</span>
          <input className={inputClass} type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.location')}</span>
          <select
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value as StorageLocation | '')}
          >
            <option value="">{t('pantry.locationNone')}</option>
            {STORAGE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {t(`location.${loc}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Button variant="danger" onClick={remove}>
            {t('common.remove')}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </div>
      </form>
    </>
  );
}
