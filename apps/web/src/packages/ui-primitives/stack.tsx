import type { ComponentPropsWithRef, ReactElement } from 'react';

import { cn } from './cn';
import { type StackVariantProps, stackVariants } from './stack.variants';
import type { Testable } from './testable';

export type StackProps = ComponentPropsWithRef<'div'> & StackVariantProps & Testable;

export function Stack({
  className,
  direction,
  gap,
  align,
  justify,
  wrap,
  testId,
  children,
  ref,
  ...props
}: StackProps): ReactElement {
  return (
    <div
      ref={ref}
      data-testid={testId}
      className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
