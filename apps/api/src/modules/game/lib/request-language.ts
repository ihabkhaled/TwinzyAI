import type { LanguageCodeValue } from '@twinzy/shared';
import { normalizeLanguageCode } from '@twinzy/shared';

import { AnalyzeRequestBodySchema } from '../api/dto/analyze-request.dto';

/**
 * Resolve the analyze request's language: parse the multipart body leniently
 * and normalize whatever arrived (absent, junk, unsupported) to a supported
 * code with the shared default. Dynamic AI output is produced in this
 * language; static UI copy stays with the frontend i18n.
 */
export const resolveRequestLanguage = (body: unknown): LanguageCodeValue => {
  const parsed = AnalyzeRequestBodySchema.safeParse(body);
  return normalizeLanguageCode(parsed.success ? parsed.data.languageCode : undefined);
};
