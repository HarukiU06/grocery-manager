import { useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { CONVERSIONS } from '../../data/conversions';
import { formatQuantity } from '../../domain/scaling';
import { addStock } from '../../domain/stock';
import { UNITS, type Quantity, type Unit } from '../../domain/types';
import { useLang, useT } from '../../i18n';
import { useIngredientName } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  ingredientId: string | null;
  onClose: () => void;
}

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';

/** Records a purchase from search: the new stock is what is on hand plus what was bought. */
export function RestockSheet({ ingredientId, onClose }: Props) {
  const t = useT();
  return (
    <Sheet open={ingredientId !== null} onClose={onClose} title={t('pantry.restockTitle')}>
      {/* Keyed so the form remounts with fresh state for each ingredient. */}
      {ingredientId && <RestockForm key={ingredientId} ingredientId={ingredientId} onClose={onClose} />}
    </Sheet>
  );
}

function RestockForm({ ingredientId, onClose }: { ingredientId: string; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const nameOf = useIngredientName();
  const existing = useAppStore((s) => s.pantry.find((p) => p.ingredientId === ingredientId));
  const restockPantryItem = useAppStore((s) => s.restockPantryItem);
  const onHand = existing?.quantity;
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<Unit>(onHand?.unit ?? CONVERSIONS[ingredientId]?.pieceUnit ?? 'g');

  const parsed = Number(amount);
  const bought: Quantity | undefined =
    amount.trim() && Number.isFinite(parsed) && parsed > 0 ? { amount: parsed, unit } : undefined;
  const total = bought ? addStock(onHand, bought) : null;
  const format = (q: Quantity) => formatQuantity(q.amount, q.unit, lang, t);

  const save = (event: FormEvent) => {
    event.preventDefault();
    restockPantryItem(ingredientId, bought);
    onClose();
  };

  return (
    <>
      <p className="mb-1 text-base font-semibold">{nameOf(ingredientId)}</p>
      <p className="mb-3 text-sm text-stone-600">
        {existing
          ? t('pantry.onHand', {
              amount: onHand ? format(onHand) : t('pantry.onHandUnknown'),
            })
          : t('pantry.notInPantry')}
      </p>
      <form onSubmit={save} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-stone-600">{t('pantry.boughtAmount')}</span>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              autoFocus
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
        {bought && onHand && total && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t('pantry.restockTotal', {
              onHand: format(onHand),
              bought: format(bought),
              total: format(total),
            })}
          </p>
        )}
        {bought && onHand && !total && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('pantry.restockReplace', {
              onHand: format(onHand),
              bought: format(bought),
            })}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">{t('common.add')}</Button>
        </div>
      </form>
    </>
  );
}
