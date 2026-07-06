import { AnalyzeRequestBodySchema } from '../api/dto/analyze-request.dto';

/**
 * True only when the request body carries an explicit consent flag ("true"
 * from multipart clients, or boolean true from JSON clients). Consent is the
 * first gate of the analyze pipeline — enforced before any file or AI work.
 */
export const isConsentGiven = (body: unknown): boolean => {
  const parsed = AnalyzeRequestBodySchema.safeParse(body);
  return parsed.success && parsed.data.consent !== undefined;
};
