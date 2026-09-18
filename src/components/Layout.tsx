import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useLang, useT } from '../i18n';
import { isStorageAvailable } from '../store/useAppStore';
import { BottomNav } from './BottomNav';
import { ToastHost } from './Toast';
import { useToastStore } from './toastStore';

export function Layout() {
  const lang = useLang();
  const t = useT();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    // Warn once on mount, in the language active at that time.
    if (!isStorageAvailable()) showToast(t('settings.storageWarning'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-2xl pb-24">
        <Outlet />
      </div>
      <BottomNav />
      <ToastHost />
    </div>
  );
}
