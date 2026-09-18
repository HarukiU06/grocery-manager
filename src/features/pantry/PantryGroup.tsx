import { useState } from 'react';
import { useT } from '../../i18n';
import type { PantryGroupData } from './groupPantry';
import { PantryItemRow } from './PantryItemRow';

interface Props {
  group: PantryGroupData;
  today: string;
  onSelect: (ingredientId: string) => void;
}

export function PantryGroup({ group, today, onSelect }: Props) {
  const t = useT();
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between bg-stone-100 px-4 py-2 text-left text-sm font-semibold text-stone-700"
        >
          <span>{t(`category.${group.category}`)}</span>
          <span className="text-xs font-normal text-stone-500">
            {t('pantry.itemCount', { count: group.rows.length })} {open ? '▾' : '▸'}
          </span>
        </button>
      </h2>
      {open && (
        <ul className="divide-y divide-stone-100">
          {group.rows.map((row) => (
            <PantryItemRow key={row.item.ingredientId} row={row} today={today} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </section>
  );
}
