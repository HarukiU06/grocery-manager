import type { ReactNode } from 'react';

interface Props {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function Chip({ selected, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors ${
        selected
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  );
}
