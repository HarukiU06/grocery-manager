import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { ServingsStepper } from '../../components/ServingsStepper';
import { useToastStore } from '../../components/toastStore';
import { todayIso } from '../../domain/dates';
import type { Lang, PersistedState } from '../../domain/types';
import { useT } from '../../i18n';
import { downloadTextFile, exportFilename, parseImportedState, serializeState } from '../../store/exportImport';
import { pickPersisted, useAppStore } from '../../store/useAppStore';
import { ClearDataSheet } from './ClearDataSheet';

const APP_VERSION = '0.1.0';
const LANGS: Lang[] = ['ja', 'en'];
const THRESHOLDS = [1, 2, 3, 4, 5];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-stone-700">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const t = useT();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const servings = useAppStore((s) => s.servings);
  const setServings = useAppStore((s) => s.setServings);
  const trackExpiry = useAppStore((s) => s.trackExpiry);
  const setTrackExpiry = useAppStore((s) => s.setTrackExpiry);
  const almostThreshold = useAppStore((s) => s.almostThreshold);
  const setAlmostThreshold = useAppStore((s) => s.setAlmostThreshold);
  const importState = useAppStore((s) => s.importState);
  const showToast = useToastStore((s) => s.show);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const exportData = () => {
    downloadTextFile(exportFilename(todayIso()), serializeState(pickPersisted(useAppStore.getState())));
  };

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setPendingImport(parseImportedState(await file.text()));
    } catch {
      showToast(t('settings.importError'));
    }
  };

  const confirmImport = () => {
    if (pendingImport) importState(pendingImport);
    setPendingImport(null);
    showToast(t('settings.importSuccess'));
  };

  return (
    <div className="p-4">
      <PageHeader title={t('settings.title')} />

      <Section title={t('settings.language')}>
        <div className="flex gap-2">
          {LANGS.map((lang) => (
            <Chip key={lang} selected={language === lang} onClick={() => setLanguage(lang)}>
              {t(`lang.${lang}`)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('settings.servings')}>
        <ServingsStepper value={servings} onChange={setServings} />
      </Section>

      <Section title={t('settings.trackExpiry')}>
        <p className="text-xs text-stone-500">{t('settings.trackExpiryHint')}</p>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-emerald-600"
            checked={trackExpiry}
            onChange={(e) => setTrackExpiry(e.target.checked)}
            aria-label={t('settings.trackExpiry')}
          />
          <span>{trackExpiry ? t('common.on') : t('common.off')}</span>
        </label>
      </Section>

      <Section title={t('settings.almostThreshold')}>
        <p className="text-xs text-stone-500">{t('settings.almostThresholdHint')}</p>
        <div className="flex gap-2">
          {THRESHOLDS.map((n) => (
            <Chip key={n} selected={almostThreshold === n} onClick={() => setAlmostThreshold(n)}>
              {String(n)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('settings.data')}>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportData}>
            {t('settings.export')}
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            {t('settings.import')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            aria-label={t('settings.import')}
            className="sr-only"
            onChange={onFileChosen}
          />
          <Button variant="danger" onClick={() => setClearOpen(true)}>
            {t('clear.open')}
          </Button>
        </div>
      </Section>

      <Section title={t('settings.about')}>
        <p className="text-sm text-stone-700">
          {t('app.name')} · {t('settings.version', { version: APP_VERSION })}
        </p>
      </Section>

      <ConfirmDialog
        open={pendingImport !== null}
        title={t('settings.importConfirmTitle')}
        body={t('settings.importConfirmBody')}
        confirmLabel={t('common.confirm')}
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
      <ClearDataSheet open={clearOpen} onClose={() => setClearOpen(false)} />
    </div>
  );
}
