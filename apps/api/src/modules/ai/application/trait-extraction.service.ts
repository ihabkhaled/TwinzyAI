import { Inject, Injectable } from '@nestjs/common';

import type { Traits } from '@twinzy/shared';
import { TraitExtractionResponseSchema } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { PromptTemplateRepository } from '../infrastructure/prompt-template.repository';
import { parseAiJsonResponse } from '../lib/json-response.util';
import type { AiProviderAdapter } from '../model/ai-provider-adapter.types';
import { AI_PROVIDER_ADAPTER } from '../model/ai-provider-adapter.types';
import { PromptKey } from '../model/prompt-version.constants';

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
    private readonly promptTemplate: PromptTemplateRepository,
    private readonly aiSafety: AiSafetyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async extractTraits(imageBuffer: Buffer, mimeType: string): Promise<Traits> {
    const prompt = this.promptTemplate.buildPrompt(PromptKey.TraitExtraction, {});

    const rawText = await this.aiProvider.generateFromImageStream(prompt, {
      mimeType,
      base64Data: imageBuffer.toString('base64'),
    });

    const response = parseAiJsonResponse(rawText, TraitExtractionResponseSchema);
    this.aiSafety.assertTraitTextSafe(Object.values(response.traits));

    this.logger.info('Extracted 15 visible traits');
    return response.traits;
  }
}
