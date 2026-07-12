/**
 * Source classification and lightweight TS parsing shared by the scanners.
 *
 * Classification is driven by path structure (the mechanically enforced
 * architecture anatomy), not per-module hardcoding, so new modules are picked
 * up automatically. Import/export extraction is regex-based on purpose: it
 * needs only names and specifiers, never semantics.
 */
const API_MODULES_PREFIX = 'apps/api/src/modules/';
const WEB_MODULES_PREFIX = 'apps/web/src/modules/';
const WEB_PACKAGES_PREFIX = 'apps/web/src/packages/';

const segmentAfter = (relPath, prefix) => {
  const rest = relPath.slice(prefix.length);
  const slash = rest.indexOf('/');
  return slash === -1 ? null : rest.slice(0, slash);
};

/** Ordered prefix rules: first match wins (packages before the generic web tree). */
const MODULE_RULES = [
  { fallback: 'api:root', prefix: API_MODULES_PREFIX, tag: 'api:' },
  { fallback: 'api:root', prefix: 'apps/api/src/', tag: 'api:' },
  { fallback: 'web:packages', prefix: WEB_PACKAGES_PREFIX, tag: 'web:pkg-' },
  { fallback: 'web:root', prefix: WEB_MODULES_PREFIX, tag: 'web:' },
  { fallback: 'web:root', prefix: 'apps/web/src/', tag: 'web:' },
  { fallback: 'web:e2e', prefix: 'apps/web/e2e/', tag: null },
  { fallback: 'shared', prefix: 'packages/shared/', tag: null },
];

/** Stable module id for any source file, e.g. `api:game`, `web:game`, `web:pkg-axios`, `shared`. */
export const moduleOf = (relPath) => {
  for (const rule of MODULE_RULES) {
    if (!relPath.startsWith(rule.prefix)) {
      continue;
    }
    const name = rule.tag === null ? null : segmentAfter(relPath, rule.prefix);
    return name === null ? rule.fallback : `${rule.tag}${name}`;
  }
  return 'other';
};

/** Architecture layer of a source file: the first directory under its module root. */
export const layerOf = (relPath) => {
  for (const prefix of [API_MODULES_PREFIX, WEB_MODULES_PREFIX]) {
    if (relPath.startsWith(prefix)) {
      const rest = relPath.slice(prefix.length);
      const parts = rest.split('/');
      return parts.length > 2 ? parts[1] : 'root';
    }
  }
  if (relPath.startsWith('apps/api/src/') || relPath.startsWith('apps/web/src/')) {
    const parts = relPath.split('/');
    return parts.length > 4 ? parts[3] : 'root';
  }
  if (relPath.startsWith('packages/shared/src/')) {
    const parts = relPath.split('/');
    return parts.length > 4 ? parts[3] : 'root';
  }
  return 'root';
};

export const isTestFile = (relPath) =>
  relPath.includes('.test.') ||
  relPath.includes('.spec.') ||
  relPath.includes('/tests/') ||
  relPath.includes('/test/') ||
  relPath.startsWith('apps/web/e2e/');

const IMPORT_PATTERN = /^\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/gm;
const SIDE_EFFECT_IMPORT_PATTERN = /^\s*import\s+['"]([^'"]+)['"]/gm;

/** All import specifiers in a file (deduplicated, sorted). */
export const extractImports = (text) => {
  const specifiers = new Set();
  for (const match of text.matchAll(IMPORT_PATTERN)) {
    if (match[1] !== undefined) {
      specifiers.add(match[1]);
    }
  }
  for (const match of text.matchAll(SIDE_EFFECT_IMPORT_PATTERN)) {
    if (match[1] !== undefined) {
      specifiers.add(match[1]);
    }
  }
  return [...specifiers].toSorted((a, b) => a.localeCompare(b));
};

const DECLARATION_EXPORT_PATTERN =
  /^export\s+(?:abstract\s+)?(?:async\s+)?(const|let|function|class|type|interface)\s+([A-Za-z_$][\w$]*)/gm;
const BRACE_EXPORT_PATTERN = /^export\s+\{([^}]*)\}/gm;

const parseBraceNames = (inner) =>
  inner
    .split(',')
    .map((piece) => piece.trim())
    .filter((piece) => piece !== '' && !piece.startsWith('type '))
    .map((piece) => {
      const asIndex = piece.indexOf(' as ');
      return asIndex === -1 ? piece : piece.slice(asIndex + 4);
    });

/** Exported symbol names with their declaration kind (deduplicated, sorted by name). */
export const extractExports = (text) => {
  const byName = new Map();
  for (const match of text.matchAll(DECLARATION_EXPORT_PATTERN)) {
    if (match[1] !== undefined && match[2] !== undefined) {
      byName.set(match[2], match[1]);
    }
  }
  for (const match of text.matchAll(BRACE_EXPORT_PATTERN)) {
    if (match[1] === undefined) {
      continue;
    }

    const names = parseBraceNames(match[1]);
    for (const name of names) {
      if (!byName.has(name)) {
        byName.set(name, 're-export');
      }
    }
  }
  return [...byName]
    .map(([name, kind]) => ({ kind, name }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
};

export const countLines = (text) => text.split('\n').length;
