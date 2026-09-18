import { useT } from '../i18n';

const MIN = 1;
const MAX = 12;

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function ServingsStepper({ value, onChange }: Props) {
  const t = useT();
  const buttonClass =
    'h-9 w-9 rounded-full border border-stone-300 bg-white text-lg leading-none text-stone-700 disabled:text-stone-300';
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        className={buttonClass}
        aria-label={t('servings.decrease')}
        disabled={value <= MIN}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="min-w-[6rem] text-center text-sm font-medium">{t('servings.label', { count: value })}</span>
      <button
        type="button"
        className={buttonClass}
        aria-label={t('servings.increase')}
        disabled={value >= MAX}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
