import type { ReactElement } from 'react';

import { cn } from './cn';
import { type SpinnerVariantProps, spinnerVariants } from './spinner.variants';
import type { Testable } from './testable';

export type SpinnerProps = SpinnerVariantProps &
  Testable & {
    label: string;
    className?: string;
  };

export function Spinner({ label, testId, className }: SpinnerProps): ReactElement {
  return (
    <span
      role="status"
      aria-label={label}
      data-testid={testId}
      className={cn(spinnerVariants(), className)}
    />
  );
}
