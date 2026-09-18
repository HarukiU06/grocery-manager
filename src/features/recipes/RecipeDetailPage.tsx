import { PageHeader } from '../../components/PageHeader';
import { useT } from '../../i18n';

export function RecipeDetailPage() {
  const t = useT();
  return (
    <div className="p-4">
      <PageHeader title={t('recipes.title')} />
    </div>
  );
}
