import { PageHeader } from '../../components/PageHeader';
import { useT } from '../../i18n';

export function SettingsPage() {
  const t = useT();
  return (
    <div className="p-4">
      <PageHeader title={t('settings.title')} />
    </div>
  );
}
