/**
 * Stable `data-testid` values for the whole game UI. Unit and e2e suites query
 * these instead of copy or DOM structure, so wording and markup can change
 * without breaking tests. One canonical source shared by every layer.
 */
export const TEST_IDS = {
  landingHero: 'landing-hero',
  playCta: 'play-cta',
  uploadCard: 'upload-card',
  uploadInput: 'upload-input',
  cameraCard: 'camera-card',
  consentCheckbox: 'consent-checkbox',
  analyzeButton: 'analyze-button',
  processing: 'processing',
  resultList: 'result-list',
  resultCard: 'result-card',
  traitList: 'trait-list',
  traitItem: 'trait-item',
  shareButton: 'share-button',
  retryButton: 'retry-button',
  errorState: 'error-state',
  disclaimer: 'disclaimer',
  privacyNotice: 'privacy-notice',
  skipLink: 'skip-link',
  homeLink: 'home-link',
  localeSwitch: 'locale-switch',
  themeToggle: 'theme-toggle',
} as const;

export type AppTestId = (typeof TEST_IDS)[keyof typeof TEST_IDS];
