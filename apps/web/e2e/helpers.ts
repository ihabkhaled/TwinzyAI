import type { Page } from '@playwright/test';

import {
  DEFAULT_RESULT_COUNT,
  GAME_PROMPT_VERSION,
  RESULT_DISCLAIMER,
  TOTAL_TRAIT_FIELDS,
  TRAIT_CATEGORY_FIELDS,
  UNCERTAINTY_NOTE_FIELDS,
} from '@twinzy/shared';

/** The UI uses the streaming endpoint; the glob covers /analyze and /analyze/stream. */
export const ANALYZE_ROUTE = '**/api/v1/game/analyze/stream';

/** The text-only language-switch endpoint. */
export const TRANSLATE_ROUTE = '**/api/v1/game/translate-result';

export const DISCLAIMER = RESULT_DISCLAIMER;

/** Full nested advanced traits: every field of every category filled. */
const buildTraits = (): Record<string, unknown> => ({
  ...Object.fromEntries(
    Object.entries(TRAIT_CATEGORY_FIELDS).map(([category, fields]) => [
      category,
      Object.fromEntries(fields.map((field) => [field, `observed ${field}`])),
    ]),
  ),
  uncertaintyNotes: Object.fromEntries(UNCERTAINTY_NOTE_FIELDS.map((field) => [field, []])),
});

const buildJudgeSafetyCheck = (meetsMinimumEvidence = true): Record<string, boolean> => ({
  containsFaceRecognitionClaim: false,
  containsBiometricClaim: false,
  containsIdentityClaim: false,
  containsExactLookalikeClaim: false,
  containsSensitiveInference: false,
  meetsMinimumEvidence,
});

export const buildSuccessBody = (
  resultCount: number = DEFAULT_RESULT_COUNT,
): Record<string, unknown> => ({
  promptVersion: GAME_PROMPT_VERSION,
  languageCode: 'en',
  resultCount,
  traitCount: TOTAL_TRAIT_FIELDS,
  traits: buildTraits(),
  compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  results: Array.from({ length: resultCount }, (_unused, index) => ({
    name: `Sample Star ${index + 1}`,
    rank: index + 1,
    finalStyleVibeFitScore: 90 - index * 3,
    confidenceLevel: 'high',
    verdict: 'strong',
    countryOrRegion: 'Global',
    publicCategory: 'actor',
    finalReason: 'Shares a similar public style impression based on hair and jawline traits.',
    topMatchingTraits: ['wavy dark hair'],
    secondaryMatchingTraits: [],
    weakOrUncertainTraits: [],
    mismatchWarnings: [],
    judgeNotes: 'Score kept conservative.',
    safetyCheck: buildJudgeSafetyCheck(),
  })),
  fallbackMessage: '',
  disclaimer: DISCLAIMER,
});

/** Serializes messages into an SSE event-stream body. */
export const toEventStream = (messages: Record<string, unknown>[]): string =>
  messages
    .map(
      (message) => `event: ${String(message['event'])}
data: ${JSON.stringify(message)}

`,
    )
    .join('');

export const SUCCESS_STREAM = (
  resultCount: number = DEFAULT_RESULT_COUNT,
): Record<string, unknown>[] => [
  { event: 'accepted' },
  { event: 'stage', stage: 'validating' },
  { event: 'stage', stage: 'scanning' },
  { event: 'stage', stage: 'extracting-traits' },
  {
    event: 'traits',
    traitCount: TOTAL_TRAIT_FIELDS,
    compactTraitSummary: ['clear oval face', 'wavy dark hair'],
  },
  { event: 'stage', stage: 'generating-candidates' },
  {
    event: 'candidates',
    resultCount,
    names: Array.from({ length: resultCount }, (_unused, index) => `Sample Star ${index + 1}`),
  },
  { event: 'stage', stage: 'judging' },
  { event: 'stage', stage: 'aggregating' },
  { event: 'result', result: buildSuccessBody(resultCount) },
];

export const mockAnalyzeSuccess = async (
  page: Page,
  resultCount: number = DEFAULT_RESULT_COUNT,
): Promise<void> => {
  await page.route(ANALYZE_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: toEventStream(SUCCESS_STREAM(resultCount)),
    });
  });
};

export const mockAnalyzeFailure = async (page: Page): Promise<void> => {
  await page.route(ANALYZE_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: toEventStream([
        { event: 'accepted' },
        { event: 'stage', stage: 'validating' },
        { event: 'error', errorCode: 'AI_PROVIDER_UNAVAILABLE', message: 'unavailable' },
      ]),
    });
  });
};

export const mockAnalyzeTimeout = async (page: Page): Promise<void> => {
  await page.route(ANALYZE_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: toEventStream([
        { event: 'accepted' },
        { event: 'stage', stage: 'validating' },
        { event: 'error', errorCode: 'AI_TIMEOUT', message: 'timeout' },
      ]),
    });
  });
};

export const mockAnalyzeSafety = async (page: Page): Promise<void> => {
  await page.route(ANALYZE_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: toEventStream([
        { event: 'accepted' },
        { event: 'stage', stage: 'validating' },
        { event: 'error', errorCode: 'AI_RESPONSE_UNSAFE', message: 'unsafe' },
      ]),
    });
  });
};

export const mockAnalyzeOversized = async (page: Page): Promise<void> => {
  await page.route(ANALYZE_ROUTE, async (route) => {
    await route.fulfill({
      status: 413,
      contentType: 'application/json',
      body: JSON.stringify({
        messageKey: 'errors.game.uploadTooLarge',
        title: 'Photo too large',
        description: 'Please choose a smaller photo.',
      }),
    });
  });
};

export const mockTranslateSuccess = async (page: Page): Promise<void> => {
  await page.route(TRANSLATE_ROUTE, async (route) => {
    const body = (await route.request().postDataJSON()) as { results: Record<string, unknown>[] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...body,
        languageCode: 'ar',
        results: body.results.map((result: Record<string, unknown>) => ({
          ...result,
          finalReason: 'تطابق أسلوبي عام بناءً على الملامح المرئية المكتوبة.',
          judgeNotes: 'النقاط محفوظة بشكل محافظ.',
        })),
        disclaimer:
          'هذه نتيجة ممتعة عن الأسلوب والانطباع العام تعتمد على الملامح الظاهرة المكتوبة فقط. وهي ليست تعرّفًا على الوجه ولا مطابقة هوية ولا مقارنة بيومترية.',
      }),
    });
  });
};

/** Minimal structurally-valid JPEG the client-side validator accepts. */
export const buildJpegPayload = (): { name: string; mimeType: string; buffer: Buffer } => {
  const bytes = [
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02,
    0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ];
  return { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes) };
};

export const playHappyPathUntilAnalyze = async (page: Page): Promise<void> => {
  await page.goto('/game');
  await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Analyze my vibe' }).click();
};

export const setResultCount = async (page: Page, value: number): Promise<void> => {
  const select = page.getByTestId('result-count-select');
  await select.selectOption(String(value));
};
