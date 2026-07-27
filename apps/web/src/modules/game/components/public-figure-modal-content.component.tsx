import type { ReactElement } from 'react';

import { AppImage } from '@/packages/image';
import { Stack } from '@/packages/ui-primitives';

import type { PublicFigureModalProps } from '../model/public-figure-modal.types';

import {
  publicFigureModalImageClass,
  publicFigureModalLinkClass,
  publicFigureModalLinksClass,
  publicFigureModalTextClass,
} from './public-figure-modal.variants';

export const PublicFigureModalContent = ({
  publicFigure,
  labels,
}: Pick<PublicFigureModalProps, 'publicFigure' | 'labels'>): ReactElement => (
  <Stack gap="md">
    {publicFigure.image === undefined ? null : (
      <AppImage
        unoptimized
        src={publicFigure.image.fullUrl}
        alt={publicFigure.image.alt}
        width={640}
        height={480}
        className={publicFigureModalImageClass}
      />
    )}
    {publicFigure.biographySummary === undefined ? null : (
      <p className={publicFigureModalTextClass}>
        <strong>{labels.biographyLabel}: </strong>
        {publicFigure.biographySummary}
      </p>
    )}
    <p className={publicFigureModalTextClass}>
      <strong>{labels.occupationsLabel}: </strong>
      {publicFigure.occupations.join(', ')}
    </p>
    <div className={publicFigureModalLinksClass}>
      {publicFigure.wikipediaUrl === undefined ? null : (
        <a
          className={publicFigureModalLinkClass}
          href={publicFigure.wikipediaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {labels.wikipediaLink}
        </a>
      )}
      <a
        className={publicFigureModalLinkClass}
        href={publicFigure.googleSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {labels.googleSearchLink}
      </a>
    </div>
    {publicFigure.image === undefined ? null : (
      <p className={publicFigureModalTextClass}>
        <strong>{labels.imageAttributionLabel}: </strong>
        {publicFigure.image.credit ??
          publicFigure.image.author ??
          publicFigure.image.licenseName ??
          ''}
      </p>
    )}
  </Stack>
);
