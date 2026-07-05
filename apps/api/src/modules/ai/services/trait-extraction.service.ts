import { Inject, Injectable } from '@nestjs/common';

import type { Traits } from '@twinzy/shared';
import { TraitExtractionResponseSchema } from '@twinzy/shared';

import { LoggerService } from '../../../infrastructure/logger/logger.service';
import type { AiProviderAdapter } from '../interfaces/ai-provider-adapter.interface';
import { AI_PROVIDER_ADAPTER } from '../interfaces/ai-provider-adapter.interface';
import { PromptLoaderService } from '../prompts/prompt-loader.service';
import { PromptKey } from '../prompts/prompt-version.constant';
import { parseAiJsonResponse } from '../utils/json-response.util';

import { AiSafetyService } from './ai-safety.service';

const LOG_CONTEXT = 'TraitExtraction';

/**
 * The ONLY pipeline step allowed to send the image to the AI provider.
 * Output is exactly 15 written, non-identifying traits — validated by
 * schema (strict: 14 or 16 fields both fail) and safety-scanned.
 */
@Injectable()
export class TraitExtractionService {
  public constructor(
    @Inject(AI_PROVIDER_ADAPTER) private readonly aiProvider: AiProviderAdapter,
    private readonly promptLoader: PromptLoaderService,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: LoggerService,
  ) {}

  public async extractTraits(imageBuffer: Buffer, mimeType: string): Promise<Traits> {
    const prompt = this.promptLoader.buildPrompt(PromptKey.TraitExtraction, {});

    const rawText = await this.aiProvider.generateFromImage(prompt, {
      mimeType,
      base64Data: imageBuffer.toString('base64'),
    });

    const response = parseAiJsonResponse(rawText, TraitExtractionResponseSchema);
    this.aiSafety.assertTraitTextSafe(Object.values(response.traits));

    this.logger.log(LOG_CONTEXT, 'Extracted 15 visible traits');
    return response.traits;
  }
}
