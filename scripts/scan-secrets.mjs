#!/usr/bin/env node
/**
 * Lightweight secret scanner complementing Trivy. Scans files that should not
 * contain plaintext secrets (e.g., `.env`, `.env.example`, source files) for
 * common high-risk patterns. Fails the process if a match is found.
 *
 * This is intentionally simple: it does not replace a dedicated secret scanner,
 * but it catches patterns Trivy's default secret rules may miss (e.g., Google
 * API keys not recognized by the current Trivy database).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process, { cwd } from 'node:process';

const ROOT = cwd();

const PATTERNS = [
  {
    name: 'Google API key',
    regex: /AIza[\w-]{35}/g,
    allowedFiles: [],
  },
  {
    name: 'AWS access key ID',
    regex: /AKIA[0-9A-Z]{16}/g,
    allowedFiles: [],
  },
  {
    name: 'Generic secret assignment',
    regex: /(API_KEY|SECRET_KEY|PRIVATE_KEY|TOKEN|PASSWORD)\s*=\s*['"]\w{16,}['"]/g,
    allowedFiles: ['.env.example'],
  },
];

const SCAN_PATHS = ['.env', '.env.example', '.env.local', '.env.development', '.env.production'];

const isPlainTextFile = (name) => {
  const plainTextExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
    '.md',
    '.yml',
    '.yaml',
    '.sh',
    '.env',
    '.example',
  ];
  return plainTextExtensions.some((ext) => name.endsWith(ext));
};

const walk = async (dir, callback) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        [
          'node_modules',
          'dist',
          '.next',
          '.git',
          'coverage',
          'playwright-report',
          'test-results',
        ].includes(entry.name)
      ) {
        continue;
      }
      await walk(fullPath, callback);
    } else if (entry.isFile() && isPlainTextFile(entry.name)) {
      callback(fullPath);
    }
  }
};

const scanFile = (filePath, content) => {
  const findings = [];
  for (const pattern of PATTERNS) {
    if (pattern.allowedFiles.some((allowed) => filePath.endsWith(allowed))) {
      continue;
    }
    const matches = content.match(pattern.regex) ?? [];
    for (const match of matches) {
      findings.push({ path: filePath, pattern: pattern.name, snippet: match });
    }
  }
  return findings;
};

const main = async () => {
  const filesToScan = new Set(SCAN_PATHS.map((p) => path.resolve(ROOT, p)));
  await walk(ROOT, (filePath) => {
    if (
      filePath.includes('/node_modules/') ||
      filePath.includes('/dist/') ||
      filePath.includes('/.next/')
    ) {
      return;
    }
    filesToScan.add(filePath);
  });

  const findings = [];
  for (const filePath of filesToScan) {
    try {
      const content = await readFile(filePath, 'utf8');
      findings.push(...scanFile(filePath, content));
    } catch {
      // File does not exist or is not readable; skip.
    }
  }

  if (findings.length === 0) {
    process.stdout.write('No plaintext secrets detected by the custom scanner.\n');
    return;
  }

  process.stderr.write('Plaintext secret(s) detected:\n');
  for (const finding of findings) {
    process.stderr.write(`  ${finding.path}: [${finding.pattern}] ${finding.snippet}\n`);
  }
  process.exit(1);
};

main().catch((error) => {
  process.stderr.write(`Secret scan failed: ${String(error)}\n`);
  process.exit(1);
});
