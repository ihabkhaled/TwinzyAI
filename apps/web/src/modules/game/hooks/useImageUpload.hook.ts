'use client';
// client-boundary-reason: owns selected-File state and the object-URL preview lifecycle (create/revoke), which exist only in the browser.

import { useCallback, useEffect, useRef, useState } from 'react';

import { createObjectUrl, revokeObjectUrl } from '@/packages/browser';
import { ERROR_MESSAGE_KEYS, type ErrorMessageKey } from '@/shared/errors/error-keys.constants';

import type { UploadController } from '../model/game.types';
import { validateFileForUpload } from '../services/game.service';

/**
 * Owns the selected file, its object-URL preview (revoked on change and
 * unmount), and client-side validation. The image is NEVER written to any
 * browser storage — it exists only as this in-memory File.
 */
export const useImageUpload = (): UploadController => {
  const [file, setFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [fileErrorKey, setFileErrorKey] = useState<ErrorMessageKey | undefined>();
  const previewRef = useRef<string | undefined>(undefined);

  const revokePreview = useCallback((): void => {
    if (previewRef.current === undefined) {
      return;
    }

    revokeObjectUrl(previewRef.current);
    previewRef.current = undefined;
  }, []);

  useEffect(() => revokePreview, [revokePreview]);

  const resetSelection = useCallback((errorKey?: ErrorMessageKey): void => {
    setFile(undefined);
    setPreviewUrl(undefined);
    setFileErrorKey(errorKey);
  }, []);

  const clearFile = useCallback((): void => {
    revokePreview();
    resetSelection();
  }, [revokePreview, resetSelection]);

  const acceptFile = useCallback(
    (selected: File): void => {
      revokePreview();

      const validation = validateFileForUpload(selected);
      if (!validation.ok) {
        resetSelection(validation.errorKey);
        return;
      }

      const nextPreview = createObjectUrl(selected);
      previewRef.current = nextPreview;
      setFile(selected);
      setPreviewUrl(nextPreview);
      setFileErrorKey(undefined);
    },
    [revokePreview, resetSelection],
  );

  const onFileChange = useCallback(
    (files: FileList | null): void => {
      if (files !== null && files.length > 1) {
        revokePreview();
        resetSelection(ERROR_MESSAGE_KEYS.validation);
        return;
      }

      const selected = files?.[0];
      if (selected === undefined) {
        revokePreview();
        resetSelection();
        return;
      }

      acceptFile(selected);
    },
    [acceptFile, revokePreview, resetSelection],
  );

  return { file, previewUrl, fileErrorKey, onFileChange, acceptFile, clearFile };
};
