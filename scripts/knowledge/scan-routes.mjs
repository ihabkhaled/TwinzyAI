/**
 * Route scanner — builds `.ai/manifests/routes.json`: every NestJS HTTP/SSE
 * endpoint (from controller decorators) and every Next.js App Router surface
 * (pages, layouts, route handlers) with its URL path.
 *
 * Decorator arguments in this codebase are named constants (the no-magic-
 * strings rule), so identifier arguments are resolved through a repo-wide map
 * of exported string constants before falling back to the identifier name.
 */
import { runAsCli } from './lib/cli.mjs';
import { readText, walkFiles } from './lib/fs-walk.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { scanSource } from './scan-source.mjs';

const CONTROLLER_PATTERN = /@Controller\(\s*(?:(?:'([^']*)'|([A-Za-z_$][\w$]*))\s*)?\)/;
const HANDLER_PATTERN =
  /@(Get|Post|Put|Patch|Delete|Head|Options|Sse)\(\s*(?:(?:'([^']*)'|([A-Za-z_$][\w$]*))\s*)?\)/g;
const METHOD_NAME_PATTERN = /(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/;
const STRING_CONST_PATTERN = /(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*=\s*'([^']*)'/g;

const buildConstantMap = (repository) => {
  const constants = new Map();
  for (const file of repository.files) {
    if (file.isTest || (!file.path.includes('constants') && !file.path.includes('/model/'))) {
      continue;
    }
    for (const match of readText(file.path).matchAll(STRING_CONST_PATTERN)) {
      constants.set(match[1], match[2]);
    }
  }
  return constants;
};

const resolveArgument = (literal, identifier, constants) => {
  if (literal !== undefined) {
    return literal;
  }
  if (identifier === undefined) {
    return '';
  }
  return constants.get(identifier) ?? `<${identifier}>`;
};

const joinUrl = (prefix, segment) => {
  const parts = [prefix, segment].filter((part) => part !== '');
  return `/${parts.join('/')}`.replaceAll('//', '/');
};

const handlerNameAfter = (text, offset) => {
  const window = text.slice(offset, offset + 400);
  const afterDecorators = window.replaceAll(/@\w+\([^)]*\)\s*/g, ' ');
  const match = METHOD_NAME_PATTERN.exec(afterDecorators);
  return match === null ? 'unknown' : match[1];
};

const scanControllerFile = (path, constants) => {
  const text = readText(path);
  const prefixMatch = CONTROLLER_PATTERN.exec(text);
  const prefix =
    prefixMatch === null ? '' : resolveArgument(prefixMatch[1], prefixMatch[2], constants);
  const endpoints = Array.from(text.matchAll(HANDLER_PATTERN), (match) => ({
    file: path,
    handler: handlerNameAfter(text, match.index + match[0].length),
    method: match[1] === 'Sse' ? 'GET (SSE)' : match[1].toUpperCase(),
    path: joinUrl(prefix, resolveArgument(match[2], match[3], constants)),
  }));
  return endpoints;
};

const WEB_APP_ROOT = 'apps/web/src/app';
const WEB_ROUTE_FILES = new Set(['page.tsx', 'route.ts', 'layout.tsx']);

const webUrlOf = (path) => {
  const dir = path.slice(WEB_APP_ROOT.length, path.lastIndexOf('/'));
  const segments = dir.split('/').filter((segment) => segment !== '' && !segment.startsWith('('));
  return `/${segments.join('/')}`;
};

const scanWebRoutes = () =>
  walkFiles(WEB_APP_ROOT, { extensions: ['.tsx', '.ts'] })
    .filter((path) => WEB_ROUTE_FILES.has(path.slice(path.lastIndexOf('/') + 1)))
    .map((path) => ({
      file: path,
      kind: path.slice(path.lastIndexOf('/') + 1).split('.', 1)[0],
      path: webUrlOf(path),
    }));

export const scanRoutes = (repository = scanSource()) => {
  const constants = buildConstantMap(repository);
  const api = repository.files
    .filter((file) => !file.isTest && file.path.endsWith('.controller.ts'))
    .flatMap((file) => scanControllerFile(file.path, constants))
    .toSorted((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  const web = scanWebRoutes().toSorted(
    (a, b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind),
  );
  return { api, apiCount: api.length, web, webCount: web.length };
};

export const writeRoutesManifest = (repository = scanSource()) => {
  const manifest = scanRoutes(repository);
  const inputs = [
    ...manifest.api.map((endpoint) => endpoint.file),
    ...manifest.web.map((route) => route.file),
  ];
  writeGeneratedJson(`${AI_DIRS.manifests}/routes.json`, manifest, [...new Set(inputs)]);
  return `${manifest.apiCount} API endpoints, ${manifest.webCount} web routes`;
};

await runAsCli(import.meta.url, 'scan-routes', () => writeRoutesManifest());
