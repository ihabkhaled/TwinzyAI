'use client';
// client-boundary-reason: owns the public-figure dialog ref and focus lifecycle.

import { type ReactElement, useRef } from 'react';

import { PublicFigureModal } from '../components/public-figure-modal.component';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog.hook';
import type { PublicFigureModalContainerProps } from '../model/public-figure-modal.types';

export const PublicFigureModalContainer = (
  props: Readonly<PublicFigureModalContainerProps>,
): ReactElement => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useAccessibleDialog({ dialogRef, onClose: props.onClose });
  return <PublicFigureModal {...props} dialogRef={dialogRef} />;
};
