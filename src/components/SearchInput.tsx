interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  label?: string;
}

export function SearchInput({ value, onChange, placeholder, autoFocus = false, label }: Props) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label ?? placeholder}
      autoFocus={autoFocus}
      autoComplete="off"
      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-base shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
    />
  );
}
