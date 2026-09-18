import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';

interface Props {
  title: string;
  action?: ReactNode;
  backTo?: string;
}

export function PageHeader({ title, action, backTo }: Props) {
  const t = useT();
  return (
    <header className="mb-4 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {backTo && (
          <Link to={backTo} aria-label={t('common.back')} className="rounded-full p-1 text-stone-600 hover:bg-stone-100">
            ←
          </Link>
        )}
        <h1 className="truncate text-xl font-bold text-stone-900">{title}</h1>
      </div>
      {action}
    </header>
  );
}
