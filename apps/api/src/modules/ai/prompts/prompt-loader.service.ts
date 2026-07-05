import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { HttpStatus, Injectable } from '@nestjs/common';

import { APP_NAME, MODEL_PROVIDER } from '@twinzy/shared';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { AppConfigService } from '../../../config/app-config.service';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

import type { PromptKeyValue } from './prompt-version.constant';
import {
  PROMPT_FILES,
  PromptPlaceholder,
  REQUIRED_PLACEHOLDERS,
} from './prompt-version.constant';

const LOG_CONTEXT = 'PromptLoader';

const GENERIC_PROMPT_ERROR = 'The game is temporarily unavailable. Please try again.';

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

const PROMPT_DIR_CANDIDATES: readonly string[] = [
  ...(moduleDir === undefined ? [] : [moduleDir]),
  path.resolve(process.cwd(), 'src/modules/ai/prompts'),
  path.resolve(process.cwd(), 'apps/api/src/modules/ai/prompts'),
];

/**
 * Loads versioned prompt templates from files (never inlined in services),
 * validates that required placeholders exist, replaces them safely (plain
 * split/join — no regex injection), and verifies nothing is left
 * unreplaced before the prompt may reach the provider.
 */
@Injectable()
export class PromptLoaderService {
  private readonly cache = new Map<PromptKeyValue, string>();

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  public buildPrompt(key: PromptKeyValue, replacements: Partial<Record<string, string>>): string {
    let prompt = this.loadTemplate(key);

    for (const placeholder of REQUIRED_PLACEHOLDERS[key]) {
      const value = replacements[placeholder];
      if (value === undefined) {
        throw this.promptError(`Missing replacement for ${placeholder} in ${key}`);
      }
      prompt = prompt.split(placeholder).join(value);
    }

    prompt = prompt
      .split(PromptPlaceholder.AppName)
      .join(APP_NAME)
      .split(PromptPlaceholder.ModelProvider)
      .join(MODEL_PROVIDER);

    this.assertNoUnreplacedPlaceholders(key, prompt);

    if (!this.config.isProduction) {
      this.logger.debug(LOG_CONTEXT, `Built prompt ${key} (${prompt.length} chars)`);
    }

    return prompt;
  }

  private loadTemplate(key: PromptKeyValue): string {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const fileName = PROMPT_FILES[key];
    const directory = PROMPT_DIR_CANDIDATES.find((candidate) =>
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
    for (const placeholder of REQUIRED_PLACEHOLDERS[key]) {
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

  private promptError(internalReason: string): DomainException {
    this.logger.error(LOG_CONTEXT, internalReason);
    return new DomainException(
      ErrorCode.InternalError,
      GENERIC_PROMPT_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
