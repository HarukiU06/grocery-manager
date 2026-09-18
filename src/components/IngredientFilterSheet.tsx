import { useMemo, useState } from 'react';
import { expiryStatus, todayIso } from '../domain/dates';
import { IngredientPicker } from '../features/pantry/IngredientPicker';
import { useLang, useT } from '../i18n';
import { useIngredientName } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

export function IngredientFilterSheet({ open, selected, onChange, onClose }: Props) {
  const t = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t('filter.title')}>
      {/* Children mount only while the sheet is open, so the draft starts from the current selection. */}
      <FilterForm selected={selected} onChange={onChange} onClose={onClose} />
    </Sheet>
  );
}

function FilterForm({ selected, onChange, onClose }: Omit<Props, 'open'>) {
  const t = useT();
  const lang = useLang();
  const nameOf = useIngredientName();
  const pantry = useAppStore((s) => s.pantry);
  const trackExpiry = useAppStore((s) => s.trackExpiry);
  const [draft, setDraft] = useState<string[]>(selected);
  const today = todayIso();

  const pantryIds = useMemo(() => {
    const rank = (id: string) => {
      if (!trackExpiry) return 2;
      const item = pantry.find((p) => p.ingredientId === id);
      const status = expiryStatus(item?.expiresOn, today);
      return status === 'expired' ? 0 : status === 'soon' ? 1 : 2;
    };
    return pantry
      .map((p) => p.ingredientId)
      .sort((a, b) => rank(a) - rank(b) || nameOf(a).localeCompare(nameOf(b), lang));
  }, [pantry, trackExpiry, today, nameOf, lang]);

  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const extras = draft.filter((id) => !pantryIds.includes(id));

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-stone-700">{t('filter.fromPantry')}</h3>
        <ul className="max-h-64 overflow-y-auto rounded-xl border border-stone-200">
          {pantryIds.map((id) => (
            <li key={id} className="border-b border-stone-100 last:border-b-0">
              <label className="flex items-center gap-3 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-emerald-600"
                  checked={draft.includes(id)}
                  onChange={() => toggle(id)}
                  aria-label={nameOf(id)}
                />
                <span className="truncate">{nameOf(id)}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold text-stone-700">{t('filter.other')}</h3>
        <IngredientPicker
          onPick={(id) => setDraft((d) => (d.includes(id) ? d : [...d, id]))}
          placeholder={t('pantry.searchPlaceholder')}
          allowCreate={false}
        />
        {extras.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {extras.map((id) => (
              <li key={id} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                {nameOf(id)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setDraft([])}>
          {t('filter.clear')}
        </Button>
        <Button
          onClick={() => {
            onChange(draft);
            onClose();
          }}
        >
          {t('filter.apply')}
        </Button>
      </div>
    </div>
  );
}
