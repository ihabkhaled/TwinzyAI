import type { ComponentPropsWithRef, ReactElement } from 'react';

import { cn } from './cn';
import { type LabelVariantProps, labelVariants } from './label.variants';
import type { Testable } from './testable';

export type LabelProps = ComponentPropsWithRef<'label'> & LabelVariantProps & Testable;

export function Label({ className, children, testId, ref, ...props }: LabelProps): ReactElement {
  return (
    <label ref={ref} data-testid={testId} className={cn(labelVariants(), className)} {...props}>
      {children}
    </label>
  );
}
