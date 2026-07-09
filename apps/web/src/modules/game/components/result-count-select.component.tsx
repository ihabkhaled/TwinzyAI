import type { ReactElement } from 'react';

import { Label } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { ResultCountSelectProps } from '../model/game-component.types';

import { resultCountHintClass, resultCountSelectClass } from './result-count-select.variants';

/**
 * Accessible native select for the user to choose how many style/vibe matches
 * they want (1–10). Native `<select>` is used so it is keyboard-friendly, screen
 * reader friendly, and mobile-friendly without extra touch handling. The
 * `<option>` children and change handler are prepared upstream by the container
 * so this component stays pure JSX.
 */
export function ResultCountSelect({
  id,
  label,
  hint,
  value,
  onChange,
  children,
  testId,
}: Readonly<ResultCountSelectProps>): ReactElement {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <p className={resultCountHintClass}>{hint}</p>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={resultCountSelectClass}
        data-testid={testId ?? TEST_IDS.resultCountSelect}
      >
        {children}
      </select>
    </div>
  );
}
