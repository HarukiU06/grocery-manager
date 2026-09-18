import { useT } from '../i18n';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel, danger = false, onConfirm, onCancel }: Props) {
  const t = useT();
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="mb-4 text-sm text-stone-700">{body}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
