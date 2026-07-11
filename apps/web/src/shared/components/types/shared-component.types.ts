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
  /** Optional non-destructive retry (same photo), shown first when present. */
  primaryRetryLabel?: string | undefined;
  onPrimaryRetry?: (() => void) | undefined;
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

/** Props for {@link AppHeader}: the brand label plus a slot for control widgets. */
export interface AppHeaderProps {
  brandLabel: string;
  children: ReactNode;
}

/** Props for {@link DonateNavLink}: resolved outbound URL + translated label. */
export interface DonateNavLinkProps {
  href: string;
  label: string;
}

/** Props for {@link HomeLink}: the accessible label for the icon link home. */
export interface HomeLinkProps {
  label: string;
}
