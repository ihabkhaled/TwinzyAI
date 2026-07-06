import type { ComponentPropsWithRef, ReactElement } from 'react';

import { type AlertVariantProps, alertVariants } from './alert.variants';
import { cn } from './cn';
import type { Testable } from './testable';

export type AlertProps = ComponentPropsWithRef<'div'> & AlertVariantProps & Testable;

export function Alert({
  className,
  tone,
  testId,
  children,
  ref,
  ...props
}: AlertProps): ReactElement {
  return (
    <div
      role="status"
      ref={ref}
      data-testid={testId}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
