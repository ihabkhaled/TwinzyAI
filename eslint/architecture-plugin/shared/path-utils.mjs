/**
 * Path helpers for architecture rules. All comparisons run on normalized
 * forward-slash paths so rules behave identically on Windows and POSIX.
 */

export const normalizePath = (filePath) =>
  String(filePath).replaceAll("\\", "/");

export const isInFolder = (filePath, folderName) =>
  normalizePath(filePath).includes(`/${folderName}/`);

export const isApiFile = (filePath) =>
  normalizePath(filePath).includes("/apps/api/src/");

export const isWebFile = (filePath) =>
  normalizePath(filePath).includes("/apps/web/src/");

export const isTestFile = (filePath) => {
  const normalized = normalizePath(filePath);
  return (
    normalized.includes(".test.") ||
    normalized.includes("/tests/") ||
    normalized.includes("/e2e/") ||
    normalized.includes(".spec.")
  );
};

/**
 * Path below the deepest src/ segment, keeping a leading slash
 * (e.g. "/repo/apps/api/src/modules/game/api/x.ts" → "/modules/game/api/x.ts").
 * Backend anatomy folders must be matched on this slice — matching the full
 * path would false-positive on the "api" workspace segment in "apps/api".
 */
export const srcRelativePath = (filePath) => {
  const normalized = normalizePath(filePath);
  const index = normalized.lastIndexOf("/src/");
  return index === -1 ? normalized : normalized.slice(index + "/src".length);
};

/** Folder membership evaluated on the src-relative slice (safe for "api"). */
export const isInSrcFolder = (filePath, folderName) =>
  srcRelativePath(filePath).includes(`/${folderName}/`);

/* ------------------------------------------------------------------------ *
 * Canonical backend anatomy (apps/api/src):
 *   modules/<feature>/{api, application, domain, infrastructure, adapters,
 *   model, lib} + core/, config/, bootstrap/.
 * Detection is suffix-based where possible so files keep their layer while
 * the folder migration is in flight.
 * ------------------------------------------------------------------------ */

/** Filename-suffix layer detection (works in any folder). */
export const hasFileSuffix = (filePath, suffix) =>
  normalizePath(filePath).endsWith(suffix);

export const isControllerFile = (filePath) =>
  hasFileSuffix(filePath, ".controller.ts");
export const isServiceFile = (filePath) =>
  hasFileSuffix(filePath, ".service.ts");
export const isUseCaseFile = (filePath) =>
  hasFileSuffix(filePath, ".use-case.ts");
export const isRepositoryFile = (filePath) =>
  hasFileSuffix(filePath, ".repository.ts");
export const isAdapterFile = (filePath) =>
  hasFileSuffix(filePath, ".adapter.ts");

/** Folder-based layer detection for the backend anatomy. */
export const isInApiLayerFolder = (filePath) => isInSrcFolder(filePath, "api");
export const isInApplicationFolder = (filePath) =>
  isInSrcFolder(filePath, "application");
export const isInDomainFolder = (filePath) => isInSrcFolder(filePath, "domain");
export const isInInfrastructureFolder = (filePath) =>
  isInSrcFolder(filePath, "infrastructure");
export const isInAdaptersFolder = (filePath) =>
  isInSrcFolder(filePath, "adapters");
export const isInModelFolder = (filePath) => isInSrcFolder(filePath, "model");
export const isInLibFolder = (filePath) => isInSrcFolder(filePath, "lib");
export const isInCoreFolder = (filePath) => isInSrcFolder(filePath, "core");
export const isInConfigFolder = (filePath) => isInSrcFolder(filePath, "config");
export const isInBootstrapFolder = (filePath) =>
  isInSrcFolder(filePath, "bootstrap");

/** Composite layer membership (folder OR suffix), scoped to apps/api. */
export const isApiControllerFile = (filePath) =>
  isApiFile(filePath) && isControllerFile(filePath);

export const isApplicationLayerFile = (filePath) =>
  isApiFile(filePath) &&
  (isInApplicationFolder(filePath) ||
    isUseCaseFile(filePath) ||
    isServiceFile(filePath));

export const isRepositoryLayerFile = (filePath) =>
  isApiFile(filePath) &&
  (isInInfrastructureFolder(filePath) || isRepositoryFile(filePath));
