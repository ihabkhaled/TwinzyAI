import Image from 'next/image';
import type { ChangeEvent, ReactNode } from 'react';

import { Alert, Card } from '@/components/ui';
import { t } from '@/i18n';

import { UPLOAD_INPUT_ACCEPT } from '../model/game.constants';

interface UploadCardProps {
  previewUrl: string | undefined;
  fileError: string | undefined;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenCamera: () => void;
}

const SOURCE_BUTTON_CLASS =
  'flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-center hover:bg-surface-muted focus-within:ring-2 focus-within:ring-primary';

export const UploadCard = ({
  previewUrl,
  fileError,
  onFileInputChange,
  onOpenCamera,
}: UploadCardProps): ReactNode => (
  <Card>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label htmlFor="game-photo-input" className={SOURCE_BUTTON_CLASS}>
        <span className="text-base font-semibold">
          {previewUrl === undefined ? t('game.uploadLabel') : t('game.uploadChangeButton')}
        </span>
        <span className="text-sm text-text-muted">{t('game.uploadHint')}</span>
        <input
          id="game-photo-input"
          type="file"
          accept={UPLOAD_INPUT_ACCEPT}
          onChange={onFileInputChange}
          className="sr-only"
        />
      </label>

      <button type="button" onClick={onOpenCamera} className={SOURCE_BUTTON_CLASS}>
        <span className="text-base font-semibold">{t('game.cameraLabel')}</span>
        <span className="text-sm text-text-muted">{t('game.cameraHint')}</span>
      </button>
    </div>

    {previewUrl !== undefined && (
      <div className="mt-4 flex justify-center">
        <Image
          src={previewUrl}
          alt={t('game.previewAlt')}
          width={160}
          height={160}
          unoptimized
          className="max-h-60 w-auto rounded-xl object-contain"
        />
      </div>
    )}
    {fileError !== undefined && (
      <div className="mt-3">
        <Alert tone="danger">{fileError}</Alert>
      </div>
    )}
  </Card>
);
