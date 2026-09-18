import type { ReactNode } from 'react';

type Tone = 'neutral' | 'amber' | 'red' | 'green' | 'blue';
const TONE: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-sky-100 text-sky-800',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>{children}</span>;
}
