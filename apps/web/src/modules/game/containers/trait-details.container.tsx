import type { ReactElement } from 'react';

import { AccordionItem, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '@/shared/testing/test-id.helper';

import { TraitItem } from '../components/trait-item.component';
import type { TraitDetailsProps } from '../model/game-component.types';

import { traitDetailsTitleClass } from './trait-details.variants';

/**
 * The grouped "Detailed traits" accordion: one accessible disclosure section
 * per trait category, rows rendered lazily only when a group is opened (the
 * 200+ fields never mount as one block). A container so it may map.
 */
export const TraitDetails = ({ title, categories }: TraitDetailsProps): ReactElement => {
  const sections = categories.map((category, index) => (
    <AccordionItem
      key={category.key}
      title={category.title}
      testId={buildIndexedTestId(TEST_IDS.traitCategory, index)}
    >
      <Stack gap="sm">
        {category.fields.map((field) => (
          <TraitItem key={field.key} label={field.label} value={field.value} />
        ))}
      </Stack>
    </AccordionItem>
  ));

  return (
    <section data-testid={TEST_IDS.traitDetails}>
      <h2 className={traitDetailsTitleClass}>{title}</h2>
      <Stack gap="sm">{sections}</Stack>
    </section>
  );
};
