import type { ReactNode } from 'react';

interface ResultDisclaimerProps {
  disclaimer: string;
}

export const ResultDisclaimer = ({ disclaimer }: ResultDisclaimerProps): ReactNode => (
  <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-xs text-text-muted">
    {disclaimer}
  </p>
);
