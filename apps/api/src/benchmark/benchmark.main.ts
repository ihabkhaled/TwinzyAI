import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { AppConfigService } from '../config/app-config.service';
import { ProviderRegistryService } from '../modules/ai/adapters/provider-registry.service';
import { PromptTemplateRepository } from '../modules/ai/infrastructure/prompt-template.repository';

import { runRealBenchmark } from './benchmark-real-runner';
import { toJsonReport, toMarkdownReport } from './benchmark-report';
import { runMockBenchmark } from './benchmark-runner';
import type { BenchmarkCliOptions, BenchmarkReport } from './model/benchmark.types';

const DEFAULT_SAMPLES = 3;
const CLI_ARGV_OFFSET = 2;
const DEFAULT_OUT_DIR = 'benchmark-results';

/** Parse `--key=value` CLI arguments (mock by default; real is explicit). */
const parseCliOptions = (argv: readonly string[]): BenchmarkCliOptions => {
  const read = (key: string): string | undefined =>
    argv
      .find((argument) => argument.startsWith(`--${key}=`))
      ?.split('=')
      .slice(1)
      .join('=');
  const mode = read('mode') === 'real' ? 'real' : 'mock';
  const samples = Number(read('samples') ?? DEFAULT_SAMPLES);
  return {
    mode,
    samples: Number.isSafeInteger(samples) && samples > 0 ? samples : DEFAULT_SAMPLES,
    photoPath: read('photo'),
    outDir: read('out') ?? DEFAULT_OUT_DIR,
  };
};

const writeReports = (report: BenchmarkReport, outDir: string): string => {
  const stamp = report.startedAtIso.replaceAll(/[:.]/g, '-');
  const runDir = path.join(outDir, `run-${report.mode}-${stamp}`);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(path.join(runDir, 'report.md'), toMarkdownReport(report));
  writeFileSync(path.join(runDir, 'report.json'), toJsonReport(report));
  return runDir;
};

const runReal = async (options: BenchmarkCliOptions): Promise<BenchmarkReport> => {
  process.stderr.write('REAL mode: live, billed provider calls are about to run.\n');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    return await runRealBenchmark(
      {
        config: app.get(AppConfigService),
        registry: app.get(ProviderRegistryService),
        promptTemplate: app.get(PromptTemplateRepository),
      },
      options.samples,
      new Date().toISOString(),
      options.photoPath,
    );
  } finally {
    await app.close();
  }
};

const main = async (): Promise<void> => {
  const options = parseCliOptions(process.argv.slice(CLI_ARGV_OFFSET));
  const report =
    options.mode === 'real'
      ? await runReal(options)
      : runMockBenchmark(options.samples, new Date().toISOString());
  const runDir = writeReports(report, options.outDir);

  process.stdout.write(`ai:benchmark ${report.mode} run complete -> ${runDir}\n`);
  for (const step of report.steps) {
    const summary = step.recommendation ?? step.notes.join('; ');
    process.stdout.write(`  ${step.step}: ${summary}\n`);
  }
};

void main().catch((error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`ai:benchmark failed: ${message}\n`);
  process.exitCode = 1;
});
