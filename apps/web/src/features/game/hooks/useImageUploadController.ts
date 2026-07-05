'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { t } from '@/i18n';

import { validateFileForUpload } from '../services/game.service';

export interface ImageUploadController {
  file: File | undefined;
  previewUrl: string | undefined;
  fileError: string | undefined;
  onFileSelected: (files: FileList | null) => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  clearFile: () => void;
}

/**
 * Owns the selected file, its object-URL preview (revoked on change and
 * unmount), and client-side validation errors. The image is NEVER written
 * to any browser storage — it exists only as this in-memory File.
 */
export const useImageUploadController = (): ImageUploadController => {
  const [file, setFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [fileError, setFileError] = useState<string | undefined>();
  const previewRef = useRef<string | undefined>(undefined);

  const revokePreview = useCallback(() => {
    if (previewRef.current !== undefined) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = undefined;
    }
  }, []);

  useEffect(() => revokePreview, [revokePreview]);

  const clearFile = useCallback(() => {
    revokePreview();
    setFile(undefined);
    setPreviewUrl(undefined);
    setFileError(undefined);
  }, [revokePreview]);

  const onFileSelected = useCallback(
    (files: FileList | null) => {
      revokePreview();

      if (files !== null && files.length > 1) {
        setFile(undefined);
        setPreviewUrl(undefined);
        setFileError(t('error.multipleFiles'));
        return;
      }

      const selected = files?.[0];
      if (selected === undefined) {
        setFile(undefined);
        setPreviewUrl(undefined);
        setFileError(undefined);
        return;
      }

      const validation = validateFileForUpload(selected);
      if (!validation.ok) {
        setFile(undefined);
        setPreviewUrl(undefined);
        setFileError(t(validation.errorKey));
        return;
      }

      const nextPreview = URL.createObjectURL(selected);
      previewRef.current = nextPreview;
      setFile(selected);
      setPreviewUrl(nextPreview);
      setFileError(undefined);
    },
    [revokePreview],
  );

  const onFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onFileSelected(event.target.files);
    },
    [onFileSelected],
  );

  return { file, previewUrl, fileError, onFileSelected, onFileInputChange, clearFile };
};
