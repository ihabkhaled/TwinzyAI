import type { ComponentPropsWithRef, ReactElement } from 'react';

import { cn } from './cn';
import { type SkeletonVariantProps, skeletonVariants } from './skeleton.variants';
import type { Testable } from './testable';

export type SkeletonProps = ComponentPropsWithRef<'div'> & SkeletonVariantProps & Testable;

export function Skeleton({ className, testId, ref, ...props }: SkeletonProps): ReactElement {
  return (
    <div
      aria-hidden
      ref={ref}
      data-testid={testId}
      className={cn(skeletonVariants(), className)}
      {...props}
    />
  );
}
