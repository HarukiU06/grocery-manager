import { Badge } from '../../components/Badge';
import { daysUntil, expiryStatus } from '../../domain/dates';
import { localize } from '../../domain/localize';
import { formatQuantity } from '../../domain/scaling';
import { useLang, useT } from '../../i18n';
import type { PantryRow } from './groupPantry';

interface Props {
  row: PantryRow;
  today: string;
  onSelect: (ingredientId: string) => void;
}

export function PantryItemRow({ row, today, onSelect }: Props) {
  const t = useT();
  const lang = useLang();
  const { item, ingredient } = row;
  const name = ingredient ? localize(ingredient.name, lang) : t('common.unknownIngredient');
  const status = expiryStatus(item.expiresOn, today);
  const days = item.expiresOn ? daysUntil(item.expiresOn, today) : null;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item.ingredientId)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-stone-50"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-stone-900">{name}</span>
          {item.quantity && (
            <span className="text-xs text-stone-500">
              {formatQuantity(item.quantity.amount, item.quantity.unit, lang, t)}
            </span>
          )}
          {item.note && <span className="text-xs text-stone-400">{item.note}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {item.location && <Badge tone="blue">{t(`location.${item.location}`)}</Badge>}
          {status === 'expired' && <Badge tone="red">{t('pantry.expired')}</Badge>}
          {status === 'soon' && days !== null && (
            <Badge tone="amber">{days === 0 ? t('pantry.expiresToday') : t('pantry.expiresIn', { days })}</Badge>
          )}
        </span>
      </button>
    </li>
  );
}
