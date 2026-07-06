import type { ReactNode } from 'react';

/** Props for {@link EmptyState}: a single already-translated message. */
export interface EmptyStateProps {
  message: string;
  testId?: string;
}

/** Props for {@link ErrorState}: translated message + a ready retry handler. */
export interface ErrorStateProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  testId?: string;
}

/** Props for {@link LoadingState}: an accessible, already-translated label. */
export interface LoadingStateProps {
  label: string;
  testId?: string;
}

/** Props for {@link SkipLink}: an in-page target and a translated label. */
export interface SkipLinkProps {
  targetHref: string;
  label: string;
}

/** Props for {@link VisuallyHidden}: content revealed only to assistive tech. */
export interface VisuallyHiddenProps {
  children: ReactNode;
}
