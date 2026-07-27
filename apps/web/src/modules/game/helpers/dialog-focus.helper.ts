import type { KeyboardEvent as NativeKeyboardEvent } from 'react';

import { getSafeDocument } from '@/packages/browser';

import { DIALOG_FOCUSABLE_SELECTOR } from '../model/public-figure-modal.constants';

export const focusFirstDialogControl = (dialog: HTMLDivElement): void => {
  dialog.querySelector<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR)?.focus();
};

export const trapDialogTabKey = (
  event: KeyboardEvent | NativeKeyboardEvent,
  dialog: HTMLDivElement,
): void => {
  if (event.key !== 'Tab') {
    return;
  }
  const controls = [...dialog.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR)];
  const activeElement = getSafeDocument()?.activeElement;
  const first = controls[0];
  const last = controls.at(-1);
  if (first === undefined || last === undefined) {
    return;
  }
  if (activeElement === first && event.shiftKey) {
    event.preventDefault();
    last.focus();
  } else if (activeElement === last && !event.shiftKey) {
    event.preventDefault();
    first.focus();
  }
};
