import type { ReactElement } from 'react';

import { AppLink } from '@/packages/link';
import { Alert, Stack } from '@/packages/ui-primitives';
import { contentLinksItemClass } from '@/shared/components/content/content-links.variants';
import { buildGuidePath } from '@/shared/constants/guides.constants';

import type { ResultImproveTipsProps } from '../model/game-component.types';

import { resultImproveTipsTitleClass } from './result-improve-tips.variants';

/**
 * The "how to get a better result" note shown alongside every result: what
 * commonly weakens a reading, plus a link to the full guide. Shown for strong
 * and weak results alike, since the same factors (lighting, angle, clarity)
 * explain both a confident match and an uncertain one.
 */
export function ResultImproveTips({
  title,
  body,
  linkLabel,
  testId,
}: Readonly<ResultImproveTipsProps>): ReactElement {
  return (
    <Alert tone="info" testId={testId}>
      <Stack gap="xs">
        <p className={resultImproveTipsTitleClass}>{title}</p>
        <p>{body}</p>
        <AppLink href={buildGuidePath('weak-results-checklist')} className={contentLinksItemClass}>
          {linkLabel}
        </AppLink>
      </Stack>
    </Alert>
  );
}
