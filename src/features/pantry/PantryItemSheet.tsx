import { useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { STORAGE_LOCATIONS, UNITS, type PantryItem, type StorageLocation, type Unit } from '../../domain/types';
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
  const trackExpiry = useAppStore((s) => s.trackExpiry);
  const updatePantryItem = useAppStore((s) => s.updatePantryItem);
  const removePantryItem = useAppStore((s) => s.removePantryItem);
  const [amount, setAmount] = useState(item.quantity ? String(item.quantity.amount) : '');
  const [unit, setUnit] = useState<Unit>(item.quantity?.unit ?? 'g');
  const [note, setNote] = useState(item.note ?? '');
  const [expiresOn, setExpiresOn] = useState(item.expiresOn ?? '');
  const [location, setLocation] = useState<StorageLocation | ''>(item.location ?? '');

  const save = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const quantity =
      amount.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0 ? { amount: parsedAmount, unit } : undefined;
    updatePantryItem(item.ingredientId, {
      quantity,
      note: note.trim() || undefined,
      expiresOn: trackExpiry ? expiresOn || undefined : item.expiresOn,
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
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-stone-600">{t('pantry.amount')}</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-stone-600">{t('pantry.unit')}</span>
            <select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`unit.${u}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('pantry.note')}</span>
          <input
            className={inputClass}
            value={note}
            placeholder={t('pantry.notePlaceholder')}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {trackExpiry && (
          <label className="text-sm">
            <span className="mb-1 block text-stone-600">{t('pantry.expiresOn')}</span>
            <input className={inputClass} type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          </label>
        )}
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
