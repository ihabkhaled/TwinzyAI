/**
 * Source-path classification helpers shared by every frontend-architecture rule.
 *
 * All helpers operate on POSIX-normalized, project-relative paths so the rules
 * behave identically on Windows and Unix and inside any checkout location.
 */

/**
 * The frontend source root in this monorepo is `apps/web/src/`. Every helper
 * below works on a normalized, root-relative representation that begins at
 * `src/` so the rule logic stays layout-agnostic and identical across
 * Windows/Unix. Anchoring specifically on `apps/web/src/` (rather than any
 * `/src/`) keeps the backend `apps/api/src/` tree from ever being misread as
 * frontend code, even before the ESLint `files` scoping runs.
 */
const WEB_SRC_MARKER = "/apps/web/src/";
const WEB_SRC_PREFIX = "apps/web/src/";

/** Normalize a filesystem path to POSIX separators. */
export function toPosixPath(filePath) {
  return String(filePath).replaceAll("\\", "/");
}

/**
 * Return the frontend source path starting at `src/` (root-relative), or null
 * when the file lives outside `apps/web/src/` (configs, backend, plugin files,
 * scripts...). The `src/` prefix is the canonical internal form every rule and
 * the layer classifier operate on.
 */
export function getSourcePath(filename) {
  const posix = toPosixPath(filename);
  const index = posix.lastIndexOf(WEB_SRC_MARKER);

  if (index !== -1) {
    return `src/${posix.slice(index + WEB_SRC_MARKER.length)}`;
  }

  if (posix.startsWith(WEB_SRC_PREFIX)) {
    return `src/${posix.slice(WEB_SRC_PREFIX.length)}`;
  }

  return null;
}

/** File-kind checks based on canonical suffixes. */
export function isComponentFile(sourcePath) {
  return /\.component\.tsx$/.test(sourcePath ?? "");
}

export function isContainerFile(sourcePath) {
  return /\.container\.tsx$/.test(sourcePath ?? "");
}

export function isServiceFile(sourcePath) {
  return /\.service\.ts$/.test(sourcePath ?? "");
}

export function isGatewayFile(sourcePath) {
  return /\.gateway\.ts$/.test(sourcePath ?? "");
}

export function isQueryFile(sourcePath) {
  return /\.(?:queries|mutations|invalidate)\.ts$/.test(sourcePath ?? "");
}

export function isQueryKeysFile(sourcePath) {
  return /query-keys\.ts$/.test(sourcePath ?? "");
}

export function isRouteHandlerFile(sourcePath) {
  return /\/app\/.*\/route\.ts$/.test(sourcePath ?? "");
}

export function isTestFile(sourcePath) {
  if (!sourcePath) {
    return false;
  }

  return (
    /\.test\.tsx?$/.test(sourcePath) ||
    /\/test\//.test(sourcePath) ||
    sourcePath.startsWith("src/tests/") ||
    /\.(?:e2e|a11y|visual)\.ts$/.test(sourcePath)
  );
}

/** Feature-module helpers. */
export function getModuleName(sourcePath) {
  const match = /^src\/modules\/([^/]+)\//.exec(sourcePath ?? "");

  return match ? match[1] : null;
}

/** Check whether a source path is inside one of the given directory prefixes. */
export function isUnderAny(sourcePath, prefixes) {
  const path = sourcePath ?? "";

  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}`),
  );
}

/**
 * Resolve an import specifier to a project source path (`src/...`) when it
 * targets project code, or null for bare third-party packages.
 *
 * Handles the app alias families `@/*`, `@app/*`, `@modules/*`, `@shared/*`,
 * `@packages/*`, `@tests/*`, plus relative specifiers resolved against the
 * importing file location.
 */
export function resolveImportToSourcePath(importPath, importerFilename) {
  const specifier = String(importPath);

  if (specifier.startsWith("@/")) {
    return `src/${specifier.slice(2)}`;
  }

  const aliasMatch = /^@(app|modules|shared|packages|tests)\/(.+)$/.exec(
    specifier,
  );

  if (aliasMatch) {
    return `src/${aliasMatch[1]}/${aliasMatch[2]}`;
  }

  if (specifier.startsWith(".")) {
    const importerSource = getSourcePath(importerFilename);

    if (!importerSource) {
      return null;
    }

    const importerDir = importerSource.split("/").slice(0, -1);
    const segments = specifier.split("/");
    const resolved = [...importerDir];

    for (const segment of segments) {
      if (segment === "." || segment === "") {
        continue;
      }

      if (segment === "..") {
        resolved.pop();
      } else {
        resolved.push(segment);
      }
    }

    return resolved.join("/");
  }

  return null;
}

/** True when the import specifier targets a bare npm package (not project code). */
export function isBarePackageImport(importPath) {
  const specifier = String(importPath);

  return (
    !specifier.startsWith(".") &&
    !specifier.startsWith("@/") &&
    !/^@(?:app|modules|shared|packages|tests)\//.test(specifier)
  );
}

/** Extract the npm package name from a bare specifier (`@scope/pkg/sub` -> `@scope/pkg`). */
export function getPackageName(importPath) {
  const specifier = String(importPath);

  if (specifier.startsWith("@")) {
    const [scope, name] = specifier.split("/");

    return name ? `${scope}/${name}` : specifier;
  }

  const [name] = specifier.split("/");

  return name ?? specifier;
}
