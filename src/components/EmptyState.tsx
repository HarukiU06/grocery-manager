import type { ReactNode } from 'react';

interface Props {
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="my-10 flex flex-col items-center gap-3 text-center">
      <p className="text-base font-semibold text-stone-800">{title}</p>
      <p className="max-w-xs text-sm text-stone-600">{body}</p>
      {action}
    </div>
  );
}
