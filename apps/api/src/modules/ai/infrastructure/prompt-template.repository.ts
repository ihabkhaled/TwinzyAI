import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import { ERROR_MESSAGE_KEY_BY_CODE, ErrorCode, IntegrationError } from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import type { PromptKeyValue } from '../model/prompt-version.constants';
import {
  GENERIC_PROMPT_ERROR,
  PROMPT_FILES,
  PromptPlaceholder,
  REQUIRED_PLACEHOLDERS,
} from '../model/prompt-version.constants';

const LOG_CONTEXT = 'PromptLoader';

/**
 * __dirname exists in the CJS build (nest build output and SWC-transformed
 * tests); pure-ESM runners throw a ReferenceError, in which case we fall
 * back to cwd-based candidates.
 */
const moduleDir = ((): string | undefined => {
  try {
    return __dirname;
  } catch {
    return undefined;
  }
})();

/**
 * The prompt templates ship as module resources under modules/ai/prompts and
 * are copied verbatim to dist by nest-cli. This repository lives one folder
 * deeper (infrastructure/), so the primary candidate resolves ../prompts
 * relative to the compiled file; cwd-based candidates cover pure-ESM runners.
 * Computed once here (not a shared constant) because it depends on this file's
 * own module directory.
 */
const buildPromptDirCandidates = (): readonly string[] => [
  ...(moduleDir === undefined ? [] : [path.join(moduleDir, '..', 'prompts')]),
  path.resolve(process.cwd(), 'src/modules/ai/prompts'),
  path.resolve(process.cwd(), 'apps/api/src/modules/ai/prompts'),
];

/**
 * Bounded, read-only template store: loads versioned prompt templates from
 * files (never inlined in services), caches them in memory, validates that
 * required placeholders exist, replaces them safely (plain split/join — no
 * regex injection), and verifies nothing is left unreplaced before the prompt
 * may reach the provider.
 */
@Injectable()
export class PromptTemplateRepository {
  private readonly cache = new Map<PromptKeyValue, string>();

  private readonly promptDirCandidates = buildPromptDirCandidates();

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public buildPrompt(key: PromptKeyValue, replacements: Partial<Record<string, string>>): string {
    let prompt = this.loadTemplate(key);

    const requiredPlaceholders = REQUIRED_PLACEHOLDERS[key];
    for (const placeholder of requiredPlaceholders) {
      const value = replacements[placeholder];
      if (value === undefined) {
        throw this.promptError(`Missing replacement for ${placeholder} in ${key}`);
      }
      prompt = prompt.split(placeholder).join(value);
    }

    this.assertNoUnreplacedPlaceholders(key, prompt);

    if (!this.config.isProduction) {
      this.logger.debug(`Built prompt ${key} (${prompt.length} chars)`);
    }

    return prompt;
  }

  private loadTemplate(key: PromptKeyValue): string {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const fileName = PROMPT_FILES[key];
    const directory = this.promptDirCandidates.find((candidate) =>
      existsSync(path.join(candidate, fileName)),
    );
    if (directory === undefined) {
      throw this.promptError(`Prompt file not found for ${key}`);
    }

    let template: string;
    try {
      template = readFileSync(path.join(directory, fileName), 'utf8');
    } catch {
      throw this.promptError(`Prompt file not readable for ${key}`);
    }

    this.assertRequiredPlaceholdersExist(key, template);
    this.cache.set(key, template);
    return template;
  }

  private assertRequiredPlaceholdersExist(key: PromptKeyValue, template: string): void {
    const requiredPlaceholders = REQUIRED_PLACEHOLDERS[key];
    for (const placeholder of requiredPlaceholders) {
      if (!template.includes(placeholder)) {
        throw this.promptError(`Prompt ${key} is missing required placeholder ${placeholder}`);
      }
    }
  }

  private assertNoUnreplacedPlaceholders(key: PromptKeyValue, prompt: string): void {
    for (const placeholder of Object.values(PromptPlaceholder)) {
      if (prompt.includes(placeholder)) {
        throw this.promptError(`Prompt ${key} still contains unreplaced ${placeholder}`);
      }
    }
  }

  private promptError(internalReason: string): IntegrationError {
    this.logger.error(internalReason);
    return new IntegrationError(
      GENERIC_PROMPT_ERROR,
      ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.InternalError],
      ErrorCode.InternalError,
    );
  }
}
