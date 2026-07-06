import type { ReactElement } from 'react';

import { Button, Stack } from '@/packages/ui-primitives';

import type { ShareButtonProps } from '../model/game-component.types';

import { shareFeedbackClass } from './share-button.variants';

/** Share-result button with an inline, polite "copied" confirmation. */
export function ShareButton({
  label,
  feedback,
  onShare,
  testId,
}: Readonly<ShareButtonProps>): ReactElement {
  return (
    <Stack direction="row" gap="sm" align="center">
      <Button onClick={onShare} testId={testId}>
        {label}
      </Button>
      {feedback !== undefined && (
        <span role="status" className={shareFeedbackClass}>
          {feedback}
        </span>
      )}
    </Stack>
  );
}
