/**
 * Graph builder — compiles the relationship graphs under `.ai/graphs/`:
 * module dependencies, source↔test, source↔doc, contract usage, and the
 * per-module impact view. Every edge is labeled `explicit`, `generated`, or
 * `inferred` — the compiler never claims certainty it does not have.
 */
import { runAsCli } from './lib/cli.mjs';
import { graphPath } from './lib/manifest-io.mjs';
import { moduleOf } from './lib/source-scan.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { scanDependencies } from './scan-dependencies.mjs';
import { scanDocuments } from './scan-documents.mjs';
import { scanSchemas } from './scan-schemas.mjs';
import { scanSource } from './scan-source.mjs';
import { scanTests } from './scan-tests.mjs';

const sortedUnique = (items) => [...new Set(items)].toSorted((a, b) => a.localeCompare(b));

const buildSourceTestGraph = (tests) => {
  const testsBySource = {};
  for (const test of tests.tests) {
    for (const target of test.targets) {
      testsBySource[target] = sortedUnique([...(testsBySource[target] ?? []), test.path]);
    }
  }
  return testsBySource;
};

const buildSourceDocGraph = (documents, knownPaths) => {
  const edges = [];
  for (const document of documents.documents) {
    for (const source of document.relatedCode) {
      edges.push({ doc: document.path, label: 'explicit', source });
    }
    for (const source of document.sourceMentions) {
      if (knownPaths.has(source)) {
        edges.push({ doc: document.path, label: 'inferred', source });
      }
    }
  }
  return edges.toSorted(
    (a, b) =>
      a.source.localeCompare(b.source) ||
      a.doc.localeCompare(b.doc) ||
      a.label.localeCompare(b.label),
  );
};

const buildImpactGraph = ({ dependencies, testsBySource, sourceDocEdges, repository }) => {
  const impact = {};
  const ensure = (module) => {
    impact[module] ??= { consumers: [], dependsOn: [], docs: [], tests: [] };
    return impact[module];
  };
  for (const edge of dependencies.moduleEdges) {
    ensure(edge.from).dependsOn.push(edge.to);
    ensure(edge.to).consumers.push(edge.from);
  }
  for (const [source, tests] of Object.entries(testsBySource)) {
    ensure(moduleOf(source)).tests.push(...tests);
  }
  for (const edge of sourceDocEdges) {
    ensure(moduleOf(edge.source)).docs.push(edge.doc);
  }
  for (const file of repository.files) {
    ensure(file.module);
  }
  for (const record of Object.values(impact)) {
    record.consumers = sortedUnique(record.consumers);
    record.dependsOn = sortedUnique(record.dependsOn);
    record.docs = sortedUnique(record.docs);
    record.tests = sortedUnique(record.tests);
  }
  return impact;
};

const buildRelationships = ({ dependencies, testsBySource, sourceDocEdges, schemas }) => {
  const relationships = Array.from(dependencies.moduleEdges, (edge) => ({
    from: edge.from,
    label: 'generated',
    to: edge.to,
    type: 'imports',
  }));
  for (const [source, tests] of Object.entries(testsBySource)) {
    for (const test of tests) {
      relationships.push({ from: test, label: 'generated', to: source, type: 'covers' });
    }
  }
  for (const edge of sourceDocEdges) {
    relationships.push({ from: edge.doc, label: edge.label, to: edge.source, type: 'describes' });
  }
  for (const contract of schemas.contracts) {
    for (const consumer of contract.usedBy) {
      relationships.push({
        from: consumer,
        label: 'generated',
        to: `${contract.path}#${contract.name}`,
        type: 'uses-contract',
      });
    }
  }
  return relationships.toSorted(
    (a, b) =>
      a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.type.localeCompare(b.type),
  );
};

export const buildGraphs = ({ repository = scanSource(), documents = scanDocuments() } = {}) => {
  const tests = scanTests(repository);
  const dependencies = scanDependencies(repository);
  const schemas = scanSchemas(repository);
  const knownPaths = new Set(repository.files.map((file) => file.path));

  const testsBySource = buildSourceTestGraph(tests);
  const sourceDocEdges = buildSourceDocGraph(documents, knownPaths);
  const impact = buildImpactGraph({ dependencies, testsBySource, sourceDocEdges, repository });
  const relationships = buildRelationships({
    dependencies,
    testsBySource,
    sourceDocEdges,
    schemas,
  });

  writeJson(graphPath('dependency-graph'), { edges: dependencies.moduleEdges });
  writeJson(graphPath('source-test-graph'), testsBySource);
  writeJson(graphPath('source-doc-graph'), { edges: sourceDocEdges });
  writeJson(graphPath('contract-graph'), {
    contracts: schemas.contracts.map(({ name, path, usedBy }) => ({ name, path, usedBy })),
  });
  writeJson(graphPath('impact-graph'), impact);
  writeJson(graphPath('relationships'), { count: relationships.length, relationships });
  return `${relationships.length} relationships across ${Object.keys(impact).length} modules`;
};

await runAsCli(import.meta.url, 'build-graphs', () => buildGraphs());
