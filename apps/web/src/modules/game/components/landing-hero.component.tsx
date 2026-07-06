import type { ReactElement } from 'react';

import { AppLink } from '@/packages/link';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';

import type { LandingHeroProps } from '../model/game-component.types';

import {
  landingBadgeClass,
  landingCtaClass,
  landingSectionClass,
  landingSubtitleClass,
  landingTitleClass,
} from './landing-hero.variants';

/** Landing headline + free badge + primary call-to-action into the game. */
export function LandingHero({
  badge,
  tagline,
  subtitle,
  startButton,
  testId,
  ctaTestId,
}: Readonly<LandingHeroProps>): ReactElement {
  return (
    <section className={landingSectionClass} data-testid={testId}>
      <p className={landingBadgeClass}>{badge}</p>
      <h1 className={landingTitleClass}>{tagline}</h1>
      <p className={landingSubtitleClass}>{subtitle}</p>
      <AppLink href={ROUTE_PATHS.game} className={landingCtaClass} data-testid={ctaTestId}>
        {startButton}
      </AppLink>
    </section>
  );
}
