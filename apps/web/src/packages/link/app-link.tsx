import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface AppLinkProps {
  href: Route;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  'aria-label'?: string;
  'data-testid'?: string;
}

/** Typed internal navigation. `href` is a statically-checked app route. */
export const AppLink = ({
  href,
  children,
  className,
  prefetch = true,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: AppLinkProps): ReactNode => (
  <Link
    href={href}
    className={className}
    prefetch={prefetch}
    aria-label={ariaLabel}
    data-testid={dataTestId}
  >
    {children}
  </Link>
);

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/** Link to an external origin. Always opens safely in a new tab. */
export const ExternalLink = ({
  href,
  children,
  className,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: ExternalLinkProps): ReactNode => (
  <a
    href={href}
    className={className}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    data-testid={dataTestId}
  >
    {children}
  </a>
);
