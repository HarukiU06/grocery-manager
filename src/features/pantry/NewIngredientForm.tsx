import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory } from '../../domain/types';
import { useLang, useT } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (ingredient: Ingredient) => void;
}

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';

export function NewIngredientForm({ open, initialName, onClose, onCreated }: Props) {
  const t = useT();
  const lang = useLang();
  const createIngredient = useAppStore((s) => s.createIngredient);
  const [nameJa, setNameJa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('other');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNameJa(lang === 'ja' ? initialName : '');
    setNameEn(lang === 'en' ? initialName : '');
    setCategory('other');
    setError(null);
  }, [open, initialName, lang]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const ja = nameJa.trim();
    const en = nameEn.trim();
    if (!ja && !en) {
      setError(t('ingredient.nameRequired'));
      return;
    }
    const ingredient = createIngredient({
      name: { ...(ja ? { ja } : {}), ...(en ? { en } : {}) },
      category,
    });
    onCreated(ingredient);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('ingredient.newTitle')}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('ingredient.nameJa')}</span>
          <input className={inputClass} value={nameJa} onChange={(e) => setNameJa(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('ingredient.nameEn')}</span>
          <input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('ingredient.category')}</span>
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as IngredientCategory)}
          >
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Sheet>
  );
}
