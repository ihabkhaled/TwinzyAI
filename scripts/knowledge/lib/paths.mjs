/**
 * Shared path conventions for the knowledge compiler.
 *
 * Every path handled by the compiler is repo-relative and POSIX-style so the
 * generated artifacts are byte-identical across operating systems. Scripts are
 * always executed from the repository root via the `knowledge:*` npm commands.
 */
import path from 'node:path';
import process from 'node:process';

export const REPO_ROOT = process.cwd();

export const AI_ROOT = '.ai';

export const AI_DIRS = {
  manifests: `${AI_ROOT}/manifests`,
  indexes: `${AI_ROOT}/indexes`,
  packs: `${AI_ROOT}/packs`,
  summaries: `${AI_ROOT}/summaries`,
  graphs: `${AI_ROOT}/graphs`,
  hashes: `${AI_ROOT}/hashes`,
  generated: `${AI_ROOT}/generated`,
  local: `${AI_ROOT}/local`,
};

/** Source trees scanned for code facts (modules, symbols, routes, tests). */
export const SOURCE_ROOTS = ['apps/api/src', 'apps/web/src', 'packages/shared/src'];

/** Canonical documentation directories scanned for the document manifest. */
export const CANONICAL_DOC_DIRS = [
  'rules',
  'skills',
  'context',
  'memory',
  'agents',
  'testing',
  'support',
  'runbooks',
  'architecture',
  'structure',
  'product',
  'domain',
  'contracts',
  'operations',
  'incidents',
  'quality',
  'knowledge',
  'docs',
  'release-notes',
  'test-cases',
];

/** Root-level Markdown files that belong to the canonical plane. */
export const ROOT_DOC_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'CODEX.md',
  'cursor.md',
  'GEMINI.md',
  'KIMI.md',
  'GLM.md',
  'QWEN.md',
  'DEEPSEEK.md',
  'OPENAI.md',
  'ANTHROPIC.md',
  'MISTRAL.md',
  'README.md',
  'SECURITY.md',
  'TEST_CASES.md',
];

export const toPosix = (value) => value.split(path.sep).join('/');

export const fromRepo = (relPath) => path.join(REPO_ROOT, relPath);

export const parentDir = (relPath) => {
  const posix = toPosix(relPath);
  const index = posix.lastIndexOf('/');
  return index === -1 ? '' : posix.slice(0, index);
};
