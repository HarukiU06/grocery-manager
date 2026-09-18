import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { fetchRecipeHtml } from '../../domain/recipeImport/fetchRecipe';
import { parseJsonLdRecipe } from '../../domain/recipeImport/parseJsonLd';
import { parseIngredientLines } from '../../domain/recipeImport/parseText';
import type { ParsedIngredientLine } from '../../domain/recipeImport/types';
import { useLang, useT } from '../../i18n';
import { useAllIngredients, useIngredientName } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { emptyDraft, type RecipeDraft } from './recipeDraft';

const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-base';

export function ImportRecipePage() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const catalog = useAllIngredients();
  const nameOf = useIngredientName();
  const createIngredient = useAppStore((s) => s.createIngredient);

  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lines, setLines] = useState<ParsedIngredientLine[] | null>(null);
  const [parsedName, setParsedName] = useState<string | undefined>();
  const [parsedSteps, setParsedSteps] = useState<string[]>([]);
  const [parsedServings, setParsedServings] = useState<number | undefined>();

  const resetParsed = () => {
    setParsedName(undefined);
    setParsedSteps([]);
    setParsedServings(undefined);
  };

  const runFetch = async () => {
    setBusy(true);
    setFailed(false);
    const html = await fetchRecipeHtml(url.trim());
    setBusy(false);
    if (!html) {
      setFailed(true);
      return;
    }
    const jsonLd = parseJsonLdRecipe(html);
    if (jsonLd) {
      setParsedName(jsonLd.name);
      setParsedSteps(jsonLd.steps);
      setParsedServings(jsonLd.servings);
      setLines(parseIngredientLines(jsonLd.ingredients.map((i) => i.raw).join('\n'), catalog));
      return;
    }
    resetParsed();
    setLines(parseIngredientLines(html.replace(/<[^>]+>/g, '\n'), catalog));
  };

  const runParseText = () => {
    resetParsed();
    setLines(parseIngredientLines(text, catalog));
  };

  const addAsNew = (line: ParsedIngredientLine) => {
    const created = createIngredient({
      name: lang === 'ja' ? { ja: line.name } : { en: line.name },
      category: 'other',
    });
    setLines((current) => (current ?? []).map((l) => (l.raw === line.raw ? { ...l, ingredientId: created.id } : l)));
  };

  const drop = (line: ParsedIngredientLine) =>
    setLines((current) => (current ?? []).filter((l) => l.raw !== line.raw));

  const resolved = (lines ?? []).filter((l) => l.ingredientId);
  const unmatched = (lines ?? []).filter((l) => !l.ingredientId);

  const continueToForm = () => {
    const draft: RecipeDraft = {
      ...emptyDraft(),
      ...(lang === 'ja' ? { nameJa: parsedName ?? '' } : { nameEn: parsedName ?? '' }),
      baseServings: String(parsedServings ?? 2),
      ingredients: resolved.map((l) => ({
        ingredientId: l.ingredientId!,
        amount: l.amount === undefined ? '' : String(l.amount),
        unit: l.unit ?? '',
        optional: false,
      })),
      ...(lang === 'ja' ? { stepsJa: parsedSteps.join('\n') } : { stepsEn: parsedSteps.join('\n') }),
    };
    navigate('/recipes/new', { state: { draft } });
  };

  return (
    <div className="p-4">
      <PageHeader title={t('import.title')} backTo="/recipes" />

      <section className="mb-4 flex flex-col gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('import.urlLabel')}</span>
          <input
            className={inputClass}
            type="url"
            inputMode="url"
            value={url}
            placeholder="https://..."
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-2">
          <Button onClick={runFetch} disabled={busy || !url.trim()}>
            {busy ? t('import.fetching') : t('import.fetch')}
          </Button>
        </div>
        <p className="text-xs text-stone-500">{t('import.privacy')}</p>
        {failed && <p className="text-sm text-amber-700">{t('import.failed')}</p>}
      </section>

      <section className="mb-4 flex flex-col gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-stone-600">{t('import.pasteLabel')}</span>
          <textarea className={inputClass} rows={6} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div>
          <Button variant="secondary" onClick={runParseText} disabled={!text.trim()}>
            {t('import.parse')}
          </Button>
        </div>
      </section>

      {lines !== null && (
        <section className="mb-6">
          <h2 className="mb-2 text-base font-semibold">{t('import.results')}</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-stone-500">{t('import.nothingFound')}</p>
          ) : (
            <>
              <ul className="mb-3 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {resolved.map((line) => (
                  <li key={line.raw} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                    <span className="truncate">{nameOf(line.ingredientId!)}</span>
                    <span className="shrink-0 text-xs text-stone-500">{line.raw}</span>
                  </li>
                ))}
              </ul>
              {unmatched.length > 0 && (
                <>
                  <h3 className="mb-2 text-sm font-semibold text-stone-700">{t('import.unmatched')}</h3>
                  <ul className="mb-3 flex flex-col gap-2">
                    {unmatched.map((line) => (
                      <li
                        key={line.raw}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm"
                      >
                        <span className="truncate">{line.name}</span>
                        <span className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => addAsNew(line)}>
                            {t('import.addAsNew')}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => drop(line)}>
                            {t('import.drop')}
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <Button onClick={continueToForm} disabled={resolved.length === 0}>
                {t('import.toForm')}
              </Button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
