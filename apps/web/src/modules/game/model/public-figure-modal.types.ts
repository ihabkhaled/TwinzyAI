import type { RefObject } from 'react';

import type { PublicFigureView } from './public-figure.types';
import type { ResultLabels } from './result.types';

export interface PublicFigureModalProps {
  publicFigure: PublicFigureView;
  labels: ResultLabels;
  onClose: () => void;
  dialogRef: RefObject<HTMLDivElement | null>;
}

export interface AccessibleDialogInput {
  dialogRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export type PublicFigureModalContainerProps = Omit<PublicFigureModalProps, 'dialogRef'>;
