/**
 * Contradiction detector — runs the machine checks from
 * `knowledge/contradiction-checks.yaml` (assert-absent / assert-present /
 * assert-file-exists / env-example-mirror) and carries the open registry
 * entries into `.ai/generated/contradictions.json`. Check findings fail the
 * process; registry entries are recorded, never silently merged.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists, readText, walkFiles } from './lib/fs-walk.mjs';
import { generatedPath, recordGeneratedFrom } from './lib/manifest-io.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';

const CHECKS_FILE = 'knowledge/contradiction-checks.yaml';
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mjs'];

const isExcluded = (path, excludes) =>
  (excludes ?? []).some((fragment) => path.includes(String(fragment)));

const runAssertAbsent = (check) => {
  const pattern = new RegExp(check.pattern, 'm');
  const findings = [];
  for (const root of check.paths) {
    const candidates = walkFiles(root, { extensions: SOURCE_EXTENSIONS });
    for (const path of candidates) {
      if (!isExcluded(path, check.excludePathContains) && pattern.test(readText(path))) {
        findings.push({
          checkId: check.id,
          file: path,
          message: check.message,
          severity: check.severity,
        });
      }
    }
  }
  return findings;
};

const runAssertPresent = (check) => {
  if (!fileExists(check.file) || !new RegExp(check.pattern, 'm').test(readText(check.file))) {
    return [
      { checkId: check.id, file: check.file, message: check.message, severity: check.severity },
    ];
  }
  return [];
};

const runAssertFileExists = (check) =>
  fileExists(check.file)
    ? []
    : [{ checkId: check.id, file: check.file, message: check.message, severity: check.severity }];

const envValue = (text, key) => {
  const match = new RegExp(`^${key}=(.*)$`, 'm').exec(text);
  return match === null ? null : match[1].trim();
};

const runEnvExampleMirror = (check) => {
  const text = readText('.env.example');
  const serverValue = envValue(text, check.serverKey);
  const publicValue = envValue(text, check.publicKey);
  if (serverValue !== null && publicValue !== null && serverValue !== publicValue) {
    return [
      {
        checkId: check.id,
        file: '.env.example',
        message: `${check.message} (${check.serverKey}=${serverValue} vs ${check.publicKey}=${publicValue})`,
        severity: check.severity,
      },
    ];
  }
  return [];
};

const RUNNERS = {
  'assert-absent': runAssertAbsent,
  'assert-file-exists': runAssertFileExists,
  'assert-present': runAssertPresent,
  'env-example-mirror': runEnvExampleMirror,
};

export const findContradictions = () => {
  const definition = loadYamlFile(CHECKS_FILE);
  const findings = [];
  const checks = definition.checks ?? [];
  for (const check of checks) {
    const runner = RUNNERS[check.kind];
    if (runner === undefined) {
      findings.push({
        checkId: check.id,
        file: CHECKS_FILE,
        message: `unknown check kind: ${check.kind}`,
        severity: 'critical',
      });
    } else {
      findings.push(...runner(check));
    }
  }
  const registryOpen = (definition.registry ?? []).filter((entry) => entry.status === 'open');
  const output = generatedPath('contradictions');
  writeJson(output, { checkFindings: findings, registryOpen });
  recordGeneratedFrom(output, [CHECKS_FILE]);
  return { findings, registryOpen };
};

await runAsCli(import.meta.url, 'find-contradictions', () => {
  const { findings, registryOpen } = findContradictions();
  if (findings.length > 0) {
    throw new Error(
      `${findings.length} contradiction check finding(s): ${findings
        .map((finding) => `${finding.checkId}@${finding.file}`)
        .join(', ')}`,
    );
  }
  return `0 check findings, ${registryOpen.length} open registry entries`;
});
