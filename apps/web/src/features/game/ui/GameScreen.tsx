'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui';
import { t } from '@/i18n';

import { useGameController } from '../hooks/useGameController';
import { GamePhase } from '../model/game.enums';

import { ErrorState } from './ErrorState';
import { PrivacyNotice } from './PrivacyNotice';
import { ProcessingCard } from './ProcessingCard';
import { ResultDisclaimer } from './ResultDisclaimer';
import { ResultList } from './ResultList';
import { RetryButton } from './RetryButton';
import { ShareResultButton } from './ShareResultButton';
import { TraitList } from './TraitList';
import { UploadCard } from './UploadCard';
import { UploadConsentCard } from './UploadConsentCard';

/**
 * Container component: the documented wiring point. Calls the feature
 * controller hook once and composes pure components from its props.
 */
export const GameScreen = (): ReactNode => {
  const controller = useGameController();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('game.title')}</h1>

      {controller.phase === GamePhase.Setup && (
        <>
          <PrivacyNotice />
          <UploadCard
            previewUrl={controller.upload.previewUrl}
            fileError={controller.upload.fileError}
            onFileInputChange={controller.upload.onFileInputChange}
          />
          <UploadConsentCard
            consentGiven={controller.consentGiven}
            onConsentChange={controller.onConsentInputChange}
          />
          <Button onClick={controller.onAnalyze} disabled={!controller.canAnalyze}>
            {t('game.analyzeButton')}
          </Button>
        </>
      )}

      {controller.phase === GamePhase.Processing && (
        <ProcessingCard stageLabel={controller.processingStageLabel} />
      )}

      {controller.phase === GamePhase.Error && controller.errorMessage !== undefined && (
        <>
          <ErrorState message={controller.errorMessage} />
          <RetryButton onRetry={controller.onRetry} />
        </>
      )}

      {controller.phase === GamePhase.Success && controller.result !== undefined && (
        <>
          <ResultList
            results={controller.result.results}
            fallbackMessage={controller.result.fallbackMessage}
          />
          <TraitList traits={controller.result.traits} />
          <ResultDisclaimer disclaimer={controller.result.disclaimer} />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {controller.result.results.length > 0 && (
              <ShareResultButton
                onShare={controller.onShareResult}
                feedback={controller.share.shareFeedback}
              />
            )}
            <RetryButton onRetry={controller.onRetry} />
          </div>
        </>
      )}
    </div>
  );
};
