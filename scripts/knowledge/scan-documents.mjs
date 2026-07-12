/**
 * Document scanner — builds `.ai/manifests/documents.json`, the canonical
 * inventory of every Markdown document: identity, routing metadata (type,
 * tier, keywords), structure (headings, links), and size.
 *
 * Frontmatter wins when present; sensible directory-based defaults apply to
 * legacy documents that have not adopted frontmatter yet.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists, readText, walkFiles } from './lib/fs-walk.mjs';
import { sha256Text } from './lib/hashing.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { extractHeadings, extractRelativeLinkTargets, extractTitle } from './lib/markdown.mjs';
import { AI_DIRS, CANONICAL_DOC_DIRS, ROOT_DOC_FILES } from './lib/paths.mjs';
import { estimateTokens } from './lib/tokens.mjs';
import { parseDocumentFrontmatter } from './lib/yaml-io.mjs';

const DEFAULT_TYPE_BY_DIR = {
  agents: 'agent',
  architecture: 'adr',
  contracts: 'contract',
  context: 'summary',
  docs: 'doc',
  domain: 'domain',
  incidents: 'incident',
  knowledge: 'knowledge-definition',
  memory: 'memory',
  operations: 'operations',
  product: 'product',
  quality: 'quality',
  'release-notes': 'release-note',
  rules: 'rule',
  runbooks: 'runbook',
  skills: 'skill',
  structure: 'structure',
  support: 'support',
  'test-cases': 'test-case',
  testing: 'testing',
};

const DEFAULT_TIER_BY_DIR = {
  agents: 2,
  architecture: 3,
  context: 1,
  contracts: 2,
  docs: 3,
  domain: 2,
  incidents: 4,
  knowledge: 2,
  memory: 2,
  operations: 2,
  product: 2,
  quality: 2,
  'release-notes': 4,
  rules: 2,
  runbooks: 2,
  skills: 2,
  structure: 2,
  support: 2,
  'test-cases': 4,
  testing: 2,
};

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'not', 'are', 'how']);

const topDirOf = (path) => (path.includes('/') ? path.split('/', 1)[0] : '.');

const slugOf = (path) => path.replace(/\.md$/, '').replaceAll('/', '-').toLowerCase();

const firstParagraph = (body) => {
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (trimmed !== '' && !trimmed.startsWith('#') && !trimmed.startsWith('<!--')) {
      return trimmed.length > 240 ? `${trimmed.slice(0, 237)}...` : trimmed;
    }
  }
  return '';
};

const derivedKeywords = (path, title) => {
  const words = `${path.replace(/\.md$/, '').replaceAll(/[/_.-]/g, ' ')} ${title ?? ''}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return [...new Set(words)].toSorted((a, b) => a.localeCompare(b));
};

const SOURCE_MENTION_PATTERN = /\b(?:apps|packages|scripts|eslint)\/[\w./[\]-]+\.[a-z]+/g;

const asStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];

const buildEntry = (path) => {
  const text = readText(path);
  const { frontmatter, body } = parseDocumentFrontmatter(text);
  const meta = frontmatter ?? {};
  const dir = topDirOf(path);
  const title = typeof meta.title === 'string' ? meta.title : extractTitle(body);
  const keywords =
    asStringArray(meta.keywords).length > 0
      ? asStringArray(meta.keywords).map((keyword) => keyword.toLowerCase())
      : derivedKeywords(path, title);
  return {
    authority: typeof meta.authority === 'string' ? meta.authority : 'canonical',
    contextTier:
      typeof meta.contextTier === 'number' ? meta.contextTier : (DEFAULT_TIER_BY_DIR[dir] ?? 3),
    generated: meta.generated === true,
    hasFrontmatter: frontmatter !== null,
    hash: sha256Text(text),
    headings: extractHeadings(body)
      .filter((heading) => heading.depth <= 2)
      .map((heading) => heading.text),
    id: typeof meta.id === 'string' ? meta.id : slugOf(path),
    keywords,
    links: extractRelativeLinkTargets(body),
    path,
    relatedCode: asStringArray(meta.relatedCode),
    relatedDocs: asStringArray(meta.relatedDocs),
    relatedTests: asStringArray(meta.relatedTests),
    sourceMentions: [...new Set(body.match(SOURCE_MENTION_PATTERN))].toSorted((a, b) =>
      a.localeCompare(b),
    ),
    summary: typeof meta.summary === 'string' ? meta.summary : firstParagraph(body),
    title: title ?? slugOf(path),
    tokens: estimateTokens(text),
    type: typeof meta.type === 'string' ? meta.type : (DEFAULT_TYPE_BY_DIR[dir] ?? 'doc'),
  };
};

const listDocumentPaths = () => {
  const paths = [];
  for (const dir of CANONICAL_DOC_DIRS) {
    paths.push(...walkFiles(dir, { extensions: ['.md'] }));
  }
  for (const rootFile of ROOT_DOC_FILES) {
    if (fileExists(rootFile)) {
      paths.push(rootFile);
    }
  }
  return paths.toSorted((a, b) => a.localeCompare(b));
};

export const scanDocuments = () => {
  const paths = listDocumentPaths();
  return { count: paths.length, documents: paths.map((path) => buildEntry(path)) };
};

export const writeDocumentsManifest = () => {
  const manifest = scanDocuments();
  writeGeneratedJson(
    `${AI_DIRS.manifests}/documents.json`,
    manifest,
    manifest.documents.map((document) => document.path),
  );
  return `${manifest.count} documents`;
};

await runAsCli(import.meta.url, 'scan-documents', () => writeDocumentsManifest());
