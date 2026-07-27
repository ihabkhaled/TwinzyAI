import type { ReactElement } from 'react';

import { Button } from '@/packages/ui-primitives';

import { PUBLIC_FIGURE_MODAL_TITLE_ID } from '../model/public-figure-modal.constants';
import type { PublicFigureModalProps } from '../model/public-figure-modal.types';

import {
  publicFigureModalBackdropClass,
  publicFigureModalCardClass,
  publicFigureModalHeaderClass,
  publicFigureModalTitleClass,
} from './public-figure-modal.variants';
import { PublicFigureModalContent } from './public-figure-modal-content.component';

export const PublicFigureModal = ({
  publicFigure,
  labels,
  onClose,
  dialogRef,
}: Readonly<PublicFigureModalProps>): ReactElement => {
  return (
    <div className={publicFigureModalBackdropClass}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={true}
        aria-labelledby={PUBLIC_FIGURE_MODAL_TITLE_ID}
        className={publicFigureModalCardClass}
      >
        <div className={publicFigureModalHeaderClass}>
          <h2 id={PUBLIC_FIGURE_MODAL_TITLE_ID} className={publicFigureModalTitleClass}>
            {labels.detailsTitle}:{' '}
            <bdi dir="auto">{publicFigure.localizedName ?? publicFigure.canonicalName}</bdi>
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label={labels.detailsClose}>
            ×
          </Button>
        </div>
        <PublicFigureModalContent publicFigure={publicFigure} labels={labels} />
      </div>
    </div>
  );
};
