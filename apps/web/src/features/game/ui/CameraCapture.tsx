import type { ReactNode, RefObject } from 'react';

import { Alert, Button, Card } from '@/components/ui';
import { t } from '@/i18n';

interface CameraCaptureProps {
  isStarting: boolean;
  errorMessage: string | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onCancel: () => void;
}

export const CameraCapture = ({
  isStarting,
  errorMessage,
  videoRef,
  onCapture,
  onCancel,
}: CameraCaptureProps): ReactNode => (
  <Card>
    <p className="mb-2 text-base font-semibold">{t('game.cameraTitle')}</p>
    <div className="overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label={t('game.cameraPreviewLabel')}
        className="mx-auto max-h-72 w-full object-contain"
      >
        {/* Live preview carries no audio; an empty captions track satisfies a11y. */}
        <track kind="captions" />
      </video>
    </div>
    {isStarting ? <p className="mt-2 text-sm text-text-muted">{t('game.cameraStarting')}</p> : null}
    {errorMessage !== undefined && (
      <div className="mt-3">
        <Alert tone="danger">{errorMessage}</Alert>
      </div>
    )}
    <div className="mt-4 flex flex-wrap gap-3">
      <Button onClick={onCapture} disabled={isStarting}>
        {t('game.cameraCaptureButton')}
      </Button>
      <Button variant="secondary" onClick={onCancel}>
        {t('game.cameraCancelButton')}
      </Button>
    </div>
  </Card>
);
