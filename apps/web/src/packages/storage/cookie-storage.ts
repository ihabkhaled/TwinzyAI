import { getSafeDocument } from '@/packages/browser';

/** Options for {@link writeCookie}. */
interface CookieOptions {
  maxAgeSeconds?: number;
  path?: string;
}

const DEFAULT_COOKIE_PATH = '/';

/**
 * Write a cookie from the client. SSR-safe: a no-op when there is no document.
 * The name/value are URL-encoded and the cookie is scoped `SameSite=Lax` so it
 * is sent on top-level navigations (which is how the locale cookie is read back
 * server-side) but not on cross-site requests.
 */
export const writeCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  const documentRef = getSafeDocument();
  if (documentRef === null) {
    return;
  }

  const path = options.path ?? DEFAULT_COOKIE_PATH;
  const maxAge = options.maxAgeSeconds === undefined ? '' : `; max-age=${options.maxAgeSeconds}`;

  documentRef.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}${maxAge}; samesite=lax`;
};
