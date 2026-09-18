import { NUTRIENT_DIRECTION, NUTRIENT_DISPLAY_UNIT } from '../domain/nutrition';
import { percentOfTarget } from '../domain/targets';
import { NUTRIENT_KEYS, type NutritionTotals } from '../domain/types';
import { useT, type TranslationKey } from '../i18n';
import { useAppStore } from '../store/useAppStore';

interface Props {
  totals: NutritionTotals;
  /** Omitted where the surrounding controls already say which figures these are. */
  heading?: string;
  unknownCount?: number;
}

export function NutritionPanel({ totals, heading, unknownCount = 0 }: Props) {
  const t = useT();
  const targetKey = useAppStore((s) => s.nutritionTarget);
  const percent = percentOfTarget(totals, targetKey);

  return (
    <div>
      {heading && <p className="mb-2 text-sm font-medium text-stone-700">{heading}</p>}
      <ul className="flex flex-col gap-1.5">
        {NUTRIENT_KEYS.map((key) => {
          const pct = percent[key];
          const over = pct !== undefined && NUTRIENT_DIRECTION[key] === 'at_most' && pct >= 100;
          return (
            <li key={key} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-stone-700">{t(`nutrition.${key}` as TranslationKey)}</span>
                <span className="tabular-nums text-stone-900">
                  {totals[key]} {NUTRIENT_DISPLAY_UNIT[key]}
                </span>
              </div>
              {pct !== undefined && (
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[11px] text-stone-500">
                    {t('nutrition.ofDaily', { percent: pct })}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {unknownCount > 0 && (
        <p className="mt-2 text-xs text-amber-700">{t('nutrition.excluded', { count: unknownCount })}</p>
      )}
      <p className="mt-1 text-xs text-stone-400">{t('nutrition.estimate')}</p>
    </div>
  );
}
