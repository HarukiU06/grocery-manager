import { useState } from 'react';
import { Button } from '../../components/Button';
import { NutritionPanel } from '../../components/NutritionPanel';
import type { LogWeek } from '../../domain/cookingLog';
import { localize } from '../../domain/localize';
import { useLang, useT } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';

export function LogWeekCard({ week }: { week: LogWeek }) {
  const t = useT();
  const lang = useLang();
  const deleteCookEntry = useAppStore((s) => s.deleteCookEntry);
  const [showNutrition, setShowNutrition] = useState(false);

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <header className="bg-stone-100 px-4 py-2">
        <p className="text-sm font-semibold text-stone-800">{t('log.weekOf', { date: week.weekStart })}</p>
        <p className="text-xs text-stone-500">{t('log.recordedDays', { count: week.recordedDays })}</p>
      </header>
      <ul className="divide-y divide-stone-100">
        {week.entries.map((entry) => {
          const name = localize(entry.recipeName, lang);
          return (
            <li key={entry.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{name}</span>
                <span className="text-xs text-stone-500">
                  {entry.cookedOn} · {t('log.servings', { count: entry.servings })}
                </span>
              </span>
              <button
                type="button"
                aria-label={t('log.deleteEntry', { name })}
                onClick={() => deleteCookEntry(entry.id)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
      <div className="px-4 py-3">
        {week.withoutNutrition > 0 && (
          <p className="mb-2 text-xs text-amber-700">{t('log.missingNutrition', { count: week.withoutNutrition })}</p>
        )}
        <Button variant="secondary" size="sm" onClick={() => setShowNutrition((v) => !v)}>
          {showNutrition ? t('common.close') : t('nutrition.title')}
        </Button>
        {showNutrition && (
          <div className="mt-3 flex flex-col gap-4">
            <NutritionPanel totals={week.averagePerRecordedDay} heading={t('log.dailyAverage')} />
            <NutritionPanel totals={week.total} heading={t('log.weeklyTotal')} />
          </div>
        )}
      </div>
    </section>
  );
}
