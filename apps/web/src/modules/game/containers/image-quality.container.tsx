import type { ReactElement } from 'react';

import { AccordionItem, Card, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { TraitItem } from '../components/trait-item.component';
import type { ImageQualityProps } from '../model/game-component.types';

import { uncertaintyGroupTitleClass, uncertaintyNoteClass } from './image-quality.variants';

/**
 * The "Image quality & uncertainty" section: the model's own read of the
 * photo conditions plus its honest unclear/limitation notes. A container so
 * it may map the field and note lists.
 */
export const ImageQuality = ({
  title,
  uncertaintyTitle,
  fields,
  uncertainty,
}: ImageQualityProps): ReactElement => {
  const noteGroups = uncertainty.map((group) => (
    <div key={group.key}>
      <p className={uncertaintyGroupTitleClass}>{group.label}</p>
      <ul>
        {group.notes.map((note) => (
          <li key={note} className={uncertaintyNoteClass}>
            {note}
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    <section data-testid={TEST_IDS.imageQuality}>
      <AccordionItem title={title}>
        <Stack gap="sm">
          {fields.map((field) => (
            <TraitItem key={field.key} label={field.label} value={field.value} />
          ))}
        </Stack>
        {uncertainty.length > 0 ? (
          <Card>
            <p className={uncertaintyGroupTitleClass}>{uncertaintyTitle}</p>
            <Stack gap="sm">{noteGroups}</Stack>
          </Card>
        ) : null}
      </AccordionItem>
    </section>
  );
};
