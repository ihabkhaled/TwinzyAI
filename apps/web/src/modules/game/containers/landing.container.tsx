'use client';
// client-boundary-reason: resolves landing copy through the i18n hook and composes the hero, how-it-works, and privacy note.

import type { ReactElement } from 'react';

import { useAppTranslation } from '@/packages/i18n';
import { Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { GameIntro } from '../components/game-intro.component';
import { LandingHero } from '../components/landing-hero.component';
import { PrivacyNotice } from '../components/privacy-notice.component';
import { buildLandingLabels } from '../helpers/game-display.helper';

const renderSteps = (steps: readonly string[]): ReactElement[] =>
  steps.map((step) => <li key={step}>{step}</li>);

/**
 * Self-contained landing section: resolves copy, then composes the hero,
 * how-it-works steps, and the privacy note. The app route wraps this in its
 * page shell.
 */
export const LandingContainer = (): ReactElement => {
  const t = useAppTranslation();
  const translate = (key: string, values?: Record<string, string | number>): string =>
    t(key, values);
  const labels = buildLandingLabels(translate);

  return (
    <Stack gap="lg">
      <LandingHero
        badge={labels.badge}
        tagline={labels.tagline}
        subtitle={labels.subtitle}
        startButton={labels.startButton}
        testId={TEST_IDS.landingHero}
        ctaTestId={TEST_IDS.playCta}
      />
      <GameIntro title={labels.howItWorksTitle}>{renderSteps(labels.steps)}</GameIntro>
      <PrivacyNotice message={labels.privacyNotice} testId={TEST_IDS.privacyNotice} />
    </Stack>
  );
};
