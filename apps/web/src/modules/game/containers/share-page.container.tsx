'use client';
// client-boundary-reason: fetches the shared result by UUID and drives the live per-second countdown via the share-page hook.

import type { ReactElement } from 'react';

import type { FinalGameResult } from '@twinzy/shared';

import { useAppTranslation } from '@/packages/i18n';
import { AppLink } from '@/packages/link';
import { Spinner, Stack } from '@/packages/ui-primitives';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { CountdownTimer } from '../components/countdown-timer.component';
import { ShareStateMessage } from '../components/share-state-message.component';
import { shareStateCtaClass } from '../components/share-state-message.variants';
import { formatCountdown } from '../helpers/countdown.helper';
import { buildGameScreenLabels, resolveTraitCountLabel } from '../helpers/game-display.helper';
import { useSharePage } from '../hooks/useSharePage.hook';
import { mapFinalResultToView } from '../mappers/game.mapper';
import type { TranslateMessage } from '../model/game.types';
import { SharePagePhase } from '../model/share.enums';
import type { SharePageProps } from '../model/share-component.types';

import { DonateLink } from './donate-link.container';
import { ResultSections } from './result-sections.container';
import { sharePageTitleClass } from './share-page.variants';

/** The active share: countdown + the reused read-only result body + a CTA. */
const renderActive = (
  result: FinalGameResult,
  remainingSeconds: number,
  translate: TranslateMessage,
): ReactElement => {
  const view = mapFinalResultToView(result, translate);
  const labels = buildGameScreenLabels(translate);
  const countdownLabel = translate('share.expiresIn', {
    time: formatCountdown(remainingSeconds),
  });

  return (
    <Stack gap="lg" testId={TEST_IDS.sharePage}>
      <h1 className={sharePageTitleClass}>{labels.result.title}</h1>
      <CountdownTimer label={countdownLabel} />
      <ResultSections
        view={view}
        labels={labels.result}
        traitCountLabel={resolveTraitCountLabel(translate, view.traitCount)}
      />
      <AppLink
        href={ROUTE_PATHS.game}
        className={shareStateCtaClass}
        data-testid={TEST_IDS.createOwnResult}
      >
        {translate('share.createOwn')}
      </AppLink>
      <DonateLink label={translate('result.donate')} />
    </Stack>
  );
};

/**
 * The public temporary-result page. Renders loading, then either the active
 * result with a live countdown, or a terminal expired/not-found state — the
 * result is never shown once the countdown ends or the link is gone. The photo
 * is never fetched or rendered here.
 */
export const SharePageContainer = ({ shareId }: SharePageProps): ReactElement => {
  const t = useAppTranslation();
  const translate = (key: string, values?: Record<string, string | number>): string =>
    t(key, values);
  const { phase, result, remainingSeconds } = useSharePage(shareId);

  if (phase === SharePagePhase.Loading) {
    return (
      <Stack align="center" testId={TEST_IDS.sharePage}>
        <h1 className={sharePageTitleClass}>{t('result.title')}</h1>
        <Spinner label={t('share.loading')} />
      </Stack>
    );
  }
  if (phase === SharePagePhase.NotFound) {
    return (
      <ShareStateMessage
        title={t('share.notFoundTitle')}
        description={t('share.notFoundDescription')}
        createLabel={t('share.createOwn')}
        testId={TEST_IDS.shareNotFound}
      />
    );
  }
  if (phase === SharePagePhase.Expired || result === undefined) {
    return (
      <ShareStateMessage
        title={t('share.expiredTitle')}
        description={t('share.expiredDescription')}
        createLabel={t('share.createOwn')}
        testId={TEST_IDS.shareExpired}
      />
    );
  }
  return renderActive(result, remainingSeconds, translate);
};
