import type { ComponentPropsWithRef, ReactElement } from 'react';

import { cn } from './cn';
import { type PageContainerVariantProps, pageContainerVariants } from './page-container.variants';
import type { Testable } from './testable';

export type PageContainerProps = ComponentPropsWithRef<'div'> &
  PageContainerVariantProps &
  Testable;

export function PageContainer({
  className,
  children,
  testId,
  ref,
  ...props
}: PageContainerProps): ReactElement {
  return (
    <div
      ref={ref}
      data-testid={testId}
      className={cn(pageContainerVariants(), className)}
      {...props}
    >
      {children}
    </div>
  );
}
