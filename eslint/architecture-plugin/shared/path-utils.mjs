/**
 * Path helpers for architecture rules. All comparisons run on normalized
 * forward-slash paths so rules behave identically on Windows and POSIX.
 */

export const normalizePath = (filePath) => String(filePath).replaceAll('\\', '/');

export const isInFolder = (filePath, folderName) =>
  normalizePath(filePath).includes(`/${folderName}/`);

export const isApiFile = (filePath) => normalizePath(filePath).includes('/apps/api/src/');

export const isWebFile = (filePath) => normalizePath(filePath).includes('/apps/web/src/');

export const isTestFile = (filePath) => {
  const normalized = normalizePath(filePath);
  return (
    normalized.includes('.test.') ||
    normalized.includes('/tests/') ||
    normalized.includes('/e2e/') ||
    normalized.includes('.spec.')
  );
};
