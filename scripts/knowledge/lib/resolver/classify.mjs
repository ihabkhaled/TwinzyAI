/**
 * Task classification — scores the task text and touched files against the
 * compiled task-type index (keywords already vocabulary-expanded at build
 * time) and the risk classification. Pure functions over pre-loaded indexes;
 * no filesystem work at classify time beyond the initial index load.
 */
import { fileExists } from '../fs-walk.mjs';
import { indexPath } from '../manifest-io.mjs';
import { readJson } from '../stable-json.mjs';

const LANE_ORDER = { fast: 0, standard: 1, critical: 2 };

const KEYWORD_SCORE_LONG = 3;
const KEYWORD_SCORE_SHORT = 2;
const PATH_HINT_SCORE = 4;
const LONG_KEYWORD_LENGTH = 9;

export const loadResolverRuntime = () => {
  const required = ['task-types', 'modules', 'symbols', 'risks', 'paths'];
  for (const name of required) {
    if (!fileExists(indexPath(name))) {
      throw new Error(`missing index ${indexPath(name)} — run: npm run knowledge:build`);
    }
  }
  return {
    modules: readJson(indexPath('modules')),
    pathsIndex: readJson(indexPath('paths')),
    risks: readJson(indexPath('risks')),
    symbols: readJson(indexPath('symbols')),
    taskTypes: readJson(indexPath('task-types')),
    tests: readJson(indexPath('tests')),
  };
};

const normalize = (text) => ` ${text.toLowerCase().replaceAll(/[^a-z0-9]+/g, ' ')} `;

const containsKeyword = (normalizedText, keyword) => {
  const lowered = keyword.toLowerCase();
  return (
    normalizedText.includes(` ${lowered} `) ||
    normalizedText.includes(` ${lowered}s `) ||
    (lowered.includes(' ') && normalizedText.includes(lowered))
  );
};

const NAME_MENTION_SCORE = 3;

const scoreTaskType = (entry, normalizedText, files) => {
  let score = 0;
  const hits = [];
  const keywords = entry.keywords ?? [];
  for (const keyword of keywords) {
    if (!containsKeyword(normalizedText, String(keyword))) {
      continue;
    }

    score +=
      String(keyword).length >= LONG_KEYWORD_LENGTH ? KEYWORD_SCORE_LONG : KEYWORD_SCORE_SHORT;
    hits.push(String(keyword));
  }
  const hints = entry.pathHints ?? [];
  for (const hint of hints) {
    if (files.every((file) => !(file.startsWith(hint) || file.includes(hint)))) {
      continue;
    }

    score += PATH_HINT_SCORE;
    hits.push(`path:${hint}`);
  }
  return { hits, score };
};

export const classifyTaskType = (runtime, taskText, files) => {
  const normalizedText = normalize(taskText);
  const scored = Object.entries(runtime.taskTypes)
    .map(([name, entry]) => {
      const base = scoreTaskType(entry, normalizedText, files);
      if (normalizedText.includes(` ${name.replaceAll('-', ' ')} `)) {
        base.score += NAME_MENTION_SCORE;
        base.hits.push(`name:${name}`);
      }
      return { name, ...base };
    })
    .toSorted((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const top = scored[0];
  const second = scored[1];
  const name = top.score === 0 ? 'routine-fix' : top.name;
  return {
    confidence:
      top.score === 0
        ? 0
        : Math.round((top.score / (top.score + (second?.score ?? 0) + 1)) * 100) / 100,
    hits: top.hits,
    runnersUp: scored
      .slice(1, 4)
      .filter((entry) => entry.score > 0)
      .map((entry) => entry.name),
    taskType: name,
  };
};

const laneFromRiskSection = (section, normalizedText, files) => {
  const patternHit = (section.pathPatterns ?? []).some((pattern) =>
    files.some((file) => file.includes(pattern)),
  );
  const keywordHit = (section.keywords ?? []).some((keyword) =>
    containsKeyword(normalizedText, String(keyword)),
  );
  return patternHit || keywordHit;
};

export const classifyLane = (runtime, taskText, files, taskTypeLane) => {
  const normalizedText = normalize(taskText);
  const reasons = [];
  let lane = taskTypeLane ?? 'standard';
  for (const candidate of ['fast', 'standard', 'critical']) {
    const section = runtime.risks[candidate];
    if (section !== undefined && laneFromRiskSection(section, normalizedText, files)) {
      reasons.push(`risk-classification:${candidate}`);
      if (LANE_ORDER[candidate] > LANE_ORDER[lane]) {
        lane = candidate;
      }
    }
  }
  return { lane, reasons };
};

export const matchModules = (runtime, taskText, files) => {
  const matched = new Set();
  for (const [root, module] of Object.entries(runtime.pathsIndex)) {
    if (files.some((file) => file.startsWith(root))) {
      matched.add(module);
    }
  }
  const normalizedText = normalize(taskText);
  for (const module of Object.keys(runtime.modules)) {
    const shortName = module.split(':').pop().replaceAll('-', ' ');
    const singular = shortName.endsWith('s') ? shortName.slice(0, -1) : shortName;
    if (
      shortName.length > 2 &&
      (normalizedText.includes(` ${shortName} `) || normalizedText.includes(` ${singular} `))
    ) {
      matched.add(module);
    }
  }
  return [...matched].toSorted((a, b) => a.localeCompare(b));
};

export const matchSymbols = (runtime, taskText) => {
  const words = new Set(taskText.split(/[^\w$]+/).filter((word) => word.length > 3));
  const matched = [];
  for (const word of words) {
    const paths = runtime.symbols[word];
    if (paths !== undefined) {
      matched.push({ files: paths, symbol: word });
    }
  }
  return matched.toSorted((a, b) => a.symbol.localeCompare(b.symbol));
};
