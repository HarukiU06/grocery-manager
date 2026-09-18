import { PageHeader } from '../../components/PageHeader';
import { useT } from '../../i18n';

export function PantryPage() {
  const t = useT();
  return (
    <div className="p-4">
      <PageHeader title={t('pantry.title')} />
    </div>
  );
}
