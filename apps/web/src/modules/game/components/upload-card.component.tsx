import type { ReactElement } from 'react';

import { AppImage } from '@/packages/image';
import { Alert, Card } from '@/packages/ui-primitives';

import { PHOTO_INPUT_ID, PREVIEW_IMAGE_SIZE } from '../model/game.constants';
import type { UploadCardProps } from '../model/game-component.types';

import {
  uploadErrorClass,
  uploadGridClass,
  uploadPreviewImageClass,
  uploadPreviewWrapClass,
  uploadSourceButtonClass,
  uploadSourceHintClass,
  uploadSourceTitleClass,
  uploadSrOnlyClass,
} from './upload-card.variants';

/**
 * Photo/camera source picker with an in-memory preview. The selected file is
 * never written to storage — the preview is a transient object URL owned by
 * the upload hook.
 */
export function UploadCard({
  uploadLabel,
  changeButton,
  hint,
  cameraLabel,
  cameraHint,
  previewAlt,
  previewUrl,
  fileError,
  uploadAccept,
  onFileInputChange,
  onOpenCamera,
  testId,
}: Readonly<UploadCardProps>): ReactElement {
  return (
    <Card testId={testId}>
      <div className={uploadGridClass}>
        <label htmlFor={PHOTO_INPUT_ID} className={uploadSourceButtonClass}>
          <span className={uploadSourceTitleClass}>
            {previewUrl === undefined ? uploadLabel : changeButton}
          </span>
          <span className={uploadSourceHintClass}>{hint}</span>
          <input
            id={PHOTO_INPUT_ID}
            type="file"
            accept={uploadAccept}
            onChange={onFileInputChange}
            className={uploadSrOnlyClass}
          />
        </label>

        <button type="button" onClick={onOpenCamera} className={uploadSourceButtonClass}>
          <span className={uploadSourceTitleClass}>{cameraLabel}</span>
          <span className={uploadSourceHintClass}>{cameraHint}</span>
        </button>
      </div>

      {previewUrl !== undefined && (
        <div className={uploadPreviewWrapClass}>
          <AppImage
            src={previewUrl}
            alt={previewAlt}
            width={PREVIEW_IMAGE_SIZE}
            height={PREVIEW_IMAGE_SIZE}
            unoptimized
            className={uploadPreviewImageClass}
          />
        </div>
      )}

      {fileError !== undefined && (
        <Alert tone="danger" className={uploadErrorClass}>
          {fileError}
        </Alert>
      )}
    </Card>
  );
}
