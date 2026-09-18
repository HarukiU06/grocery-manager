import { useMemo } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { groupByWeek } from '../../domain/cookingLog';
import { useT } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import { LogWeekCard } from './LogWeekCard';

export function LogPage() {
  const t = useT();
  const cookingLog = useAppStore((s) => s.cookingLog);
  const weeks = useMemo(() => groupByWeek(cookingLog), [cookingLog]);

  return (
    <div className="p-4">
      <PageHeader title={t('log.title')} />
      {weeks.length === 0 ? (
        <EmptyState title={t('log.emptyTitle')} body={t('log.emptyBody')} />
      ) : (
        weeks.map((week) => <LogWeekCard key={week.weekStart} week={week} />)
      )}
    </div>
  );
}
