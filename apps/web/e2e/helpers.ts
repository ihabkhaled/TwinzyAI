import type { Page } from '@playwright/test';

export const ANALYZE_ROUTE = '**/api/v1/game/analyze';

const TRAIT_KEYS = [
  'faceShape',
  'skinToneUndertone',
  'hairColor',
  'hairTexture',
  'hairStyleLength',
  'hairline',
  'foreheadShapeSize',
  'eyebrowShapeThickness',
  'eyeColorEyeShape',
  'noseShape',
  'cheekbonesCheeks',
  'lipsMouthShape',
  'beardMustacheColor',
  'beardMustacheStyleDensity',
  'jawlineChinOverallStructure',
];

export const DISCLAIMER =
  'This is a playful style/vibe result based on written visible traits only. It is not face recognition, identity matching, or biometric comparison.';

export const buildSuccessBody = (): Record<string, unknown> => ({
  traits: Object.fromEntries(TRAIT_KEYS.map((key) => [key, `observed ${key}`])),
  results: [
    {
      name: 'Sample Star',
      rank: 1,
      finalStyleVibeFitScore: 87,
      verdict: 'strong',
      reason: 'Shares a similar public style impression based on hair and jawline traits.',
      matchingTraits: ['hairColor'],
      weakOrUncertainTraits: [],
    },
  ],
  fallbackMessage: '',
  disclaimer: DISCLAIMER,
});

export const mockAnalyzeSuccess = async (page: Page): Promise<void> => {
  await page.route(ANALYZE_ROUTE, async (route) => {
    await route.fulfill({ status: 200, json: buildSuccessBody() });
  });
};

export const mockAnalyzeFailure = async (page: Page, status = 502): Promise<void> => {
  await page.route(ANALYZE_ROUTE, async (route) => {
    await route.fulfill({
      status,
      json: {
        statusCode: status,
        errorCode: 'AI_PROVIDER_UNAVAILABLE',
        message: 'unavailable',
      },
    });
  });
};

/** Minimal structurally-valid JPEG the client-side validator accepts. */
export const buildJpegPayload = (): { name: string; mimeType: string; buffer: Buffer } => {
  const bytes = [
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x03, 0x01, 0x22, 0x00,
    0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ];
  return { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes) };
};

export const playHappyPathUntilAnalyze = async (page: Page): Promise<void> => {
  await page.goto('/game');
  await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Analyze my vibe' }).click();
};
