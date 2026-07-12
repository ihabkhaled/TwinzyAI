/**
 * Index builder — compiles the fast lookup tables under `.ai/indexes/` that
 * the context resolver reads at runtime: keywords→docs, symbols→files,
 * task-types (routing-map resolved + vocabulary-expanded), file patterns,
 * modules, and compact views of rules/skills/agents/routes/errors/configs.
 */
import { runAsCli } from './lib/cli.mjs';
import { indexPath } from './lib/manifest-io.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';
import { scanConfig } from './scan-config.mjs';
import { scanDocuments } from './scan-documents.mjs';
import { scanErrors } from './scan-errors.mjs';
import { scanOwnership } from './scan-ownership.mjs';
import { scanPrompts } from './scan-prompts.mjs';
import { scanRoutes } from './scan-routes.mjs';
import { scanSource } from './scan-source.mjs';
import { scanSymbols } from './scan-symbols.mjs';
import { scanTests } from './scan-tests.mjs';

/** Keywords hitting more docs than this are non-discriminative and skipped. */
const MAX_DOCS_PER_KEYWORD = 25;

const buildKeywordIndex = (documents) => {
  const byKeyword = new Map();
  for (const document of documents.documents) {
    for (const keyword of document.keywords) {
      const list = byKeyword.get(keyword) ?? [];
      list.push(document.path);
      byKeyword.set(keyword, list);
    }
  }
  const index = {};
  for (const [keyword, paths] of byKeyword) {
    if (paths.length <= MAX_DOCS_PER_KEYWORD) {
      index[keyword] = [...new Set(paths)].toSorted((a, b) => a.localeCompare(b));
    }
  }
  return index;
};

const buildSymbolIndex = (symbols) => {
  const index = {};
  for (const symbol of symbols.symbols) {
    index[symbol.name] = [...new Set([...(index[symbol.name] ?? []), symbol.path])].toSorted(
      (a, b) => a.localeCompare(b),
    );
  }
  return index;
};

const expandKeywords = (keywords, vocabulary) => {
  const expanded = new Set(keywords.map((keyword) => keyword.toLowerCase()));
  const terms = Object.entries(vocabulary.terms ?? {});
  for (const [term, definition] of terms) {
    if (!expanded.has(term)) {
      continue;
    }

    const synonyms = definition.synonyms ?? [];
    for (const synonym of synonyms) {
      expanded.add(String(synonym).toLowerCase());
    }
  }
  return [...expanded].toSorted((a, b) => a.localeCompare(b));
};

const buildTaskTypeIndex = (routingMap, vocabulary) => {
  const index = {};
  for (const [name, entry] of Object.entries(routingMap.taskTypes)) {
    index[name] = { ...entry, keywords: expandKeywords(entry.keywords ?? [], vocabulary) };
  }
  return index;
};

const buildFilePatternIndex = (routingMap) => {
  const index = {};
  for (const [name, entry] of Object.entries(routingMap.taskTypes)) {
    const hints = entry.pathHints ?? [];
    for (const hint of hints) {
      index[hint] = [...new Set([...(index[hint] ?? []), name])].toSorted((a, b) =>
        a.localeCompare(b),
      );
    }
  }
  return index;
};

const docViewForDir = (documents, dirPrefix) => {
  const view = {};
  for (const document of documents.documents) {
    if (document.path.startsWith(dirPrefix)) {
      view[document.path] = {
        keywords: document.keywords,
        summary: document.summary,
        title: document.title,
        tokens: document.tokens,
      };
    }
  }
  return view;
};

const buildModuleIndex = (ownership) => {
  const index = {};
  for (const record of ownership.modules) {
    index[record.module] = {
      docs: record.docs,
      fileCount: record.fileCount,
      lane: record.lane,
      layers: record.layers,
      responsibility: record.responsibility,
      root: record.root,
    };
  }
  return index;
};

const buildTestsIndex = (tests) => {
  const byModule = {};
  for (const test of tests.tests) {
    byModule[test.module] = [...(byModule[test.module] ?? []), test.path].toSorted((a, b) =>
      a.localeCompare(b),
    );
  }
  return { byModule };
};

export const buildIndexes = ({ repository = scanSource(), documents = scanDocuments() } = {}) => {
  const routingMap = loadYamlFile('knowledge/routing-map.yaml');
  const vocabulary = loadYamlFile('knowledge/vocabulary.yaml');
  const riskClassification = loadYamlFile('knowledge/risk-classification.yaml');
  const symbols = scanSymbols(repository);
  const tests = scanTests(repository);
  const routes = scanRoutes(repository);
  const errors = scanErrors(repository);
  const configs = scanConfig(repository);
  const prompts = scanPrompts();
  const ownership = scanOwnership(repository);

  writeJson(indexPath('keywords'), buildKeywordIndex(documents));
  writeJson(indexPath('symbols'), buildSymbolIndex(symbols));
  writeJson(indexPath('task-types'), buildTaskTypeIndex(routingMap, vocabulary));
  writeJson(indexPath('file-patterns'), buildFilePatternIndex(routingMap));
  writeJson(indexPath('modules'), buildModuleIndex(ownership));
  writeJson(
    indexPath('paths'),
    Object.fromEntries(ownership.modules.map((m) => [m.root, m.module])),
  );
  writeJson(indexPath('risks'), riskClassification);
  writeJson(indexPath('domains'), vocabulary.terms ?? {});
  writeJson(indexPath('rules'), docViewForDir(documents, 'rules/'));
  writeJson(indexPath('skills'), docViewForDir(documents, 'skills/'));
  writeJson(indexPath('agents'), docViewForDir(documents, 'agents/'));
  writeJson(indexPath('tests'), buildTestsIndex(tests));
  writeJson(
    indexPath('routes'),
    Object.fromEntries(routes.api.map((route) => [`${route.method} ${route.path}`, route.file])),
  );
  writeJson(
    indexPath('errors'),
    Object.fromEntries(errors.errors.map((error) => [error.name, error.path])),
  );
  writeJson(
    indexPath('configs'),
    Object.fromEntries(configs.configs.map((entry) => [entry.name, entry.isPublic])),
  );
  writeJson(
    indexPath('prompts'),
    Object.fromEntries(prompts.prompts.map((prompt) => [prompt.name, prompt.path])),
  );
  return `${Object.keys(routingMap.taskTypes).length} task types indexed`;
};

await runAsCli(import.meta.url, 'build-indexes', () => buildIndexes());
