import type { Route } from 'next';
import type { ReactNode } from 'react';

/** Resolves an i18n key to a translated string (injected so helpers stay React-free). */
export type TranslateLabel = (key: string) => string;

/** One internal navigation entry: a typed route plus its translated label. */
export interface NavLinkItem {
  href: Route;
  label: string;
}

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

/** Props for {@link AppFooter}: the nav label + note, links passed as children. */
export interface AppFooterProps {
  navigationLabel: string;
  note: string;
  children: ReactNode;
}

/** Props for {@link FooterNavLink}: one footer navigation entry. */
export interface FooterNavLinkProps {
  href: Route;
  label: string;
}

/** Props for {@link ContentLinks}: the "keep reading" block; items passed as children. */
export interface ContentLinksProps {
  title: string;
  children: ReactNode;
}

/** Props for {@link ContentLinkItem}: one editorial cross-link entry. */
export interface ContentLinkItemProps {
  href: Route;
  label: string;
}

/** Props for {@link JsonLdScript}: an already-serialized JSON-LD payload. */
export interface JsonLdScriptProps {
  json: string;
}
