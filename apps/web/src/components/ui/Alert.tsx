import type { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  tone?: 'info' | 'danger' | 'success';
}

const TONE_CLASSES: Record<string, string> = {
  info: 'border-border bg-surface-muted text-text',
  danger: 'border-danger/40 bg-surface-muted text-danger',
  success: 'border-success/40 bg-surface-muted text-success',
};

export const Alert = ({ children, tone = 'info' }: AlertProps): ReactNode => (
  <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${TONE_CLASSES[tone] ?? ''}`}>
    {children}
  </div>
);
