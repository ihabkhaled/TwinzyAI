'use client';
// client-boundary-reason: manages focus containment and restoration for a browser dialog.

import { useEffect } from 'react';

import { getSafeDocument } from '@/packages/browser';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey.hook';

import { focusFirstDialogControl, trapDialogTabKey } from '../helpers/dialog-focus.helper';
import type { AccessibleDialogInput } from '../model/public-figure-modal.types';

export const useAccessibleDialog = ({ dialogRef, onClose }: AccessibleDialogInput): void => {
  useEscapeKey(onClose);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    const previousFocus = getSafeDocument()?.activeElement;
    focusFirstDialogControl(dialog);
    const handleKeyDown = (event: KeyboardEvent): void => {
      trapDialogTabKey(event, dialog);
    };
    dialog.addEventListener('keydown', handleKeyDown);
    return (): void => {
      dialog.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [dialogRef]);
};
