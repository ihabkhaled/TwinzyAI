import {
  PUBLIC_FIGURE_ALLOWED_HOST_SUFFIXES,
  PUBLIC_FIGURE_GOOGLE_SEARCH_ORIGIN,
  PUBLIC_FIGURE_GOOGLE_SEARCH_PATH,
} from '../model/public-figure.constants';

const isAllowedHostname = (hostname: string): boolean =>
  PUBLIC_FIGURE_ALLOWED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );

export const assertAllowedPublicFigureUrl = (value: string): string => {
  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error('Public-figure source URLs must use HTTPS');
  }
  if (!isAllowedHostname(url.hostname)) {
    throw new Error('Public-figure source hostname is not allowlisted');
  }
  return url.href;
};

export const buildGoogleSearchUrl = (canonicalName: string): string => {
  const url = new URL(PUBLIC_FIGURE_GOOGLE_SEARCH_PATH, PUBLIC_FIGURE_GOOGLE_SEARCH_ORIGIN);
  url.searchParams.set('q', canonicalName);
  return url.href;
};
