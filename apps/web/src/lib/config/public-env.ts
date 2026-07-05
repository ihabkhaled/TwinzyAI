const DEFAULT_API_BASE_URL = 'http://localhost:3001';

/**
 * The only place the web app reads environment values. NEXT_PUBLIC_* vars
 * are inlined at build time, so the dot-access form below is required for
 * Next.js to substitute the value.
 */
export const getApiBaseUrl = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured === undefined || configured.length === 0) {
    return DEFAULT_API_BASE_URL;
  }
  return configured.replace(/\/$/, '');
};
