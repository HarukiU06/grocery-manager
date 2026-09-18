import { useEffect } from 'react';
import { useToastStore } from './toastStore';

export function ToastHost() {
  const message = useToastStore((s) => s.message);
  const clear = useToastStore((s) => s.clear);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(clear, 2500);
    return () => window.clearTimeout(timer);
  }, [message, clear]);
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white shadow-lg"
    >
      {message}
    </div>
  );
}
