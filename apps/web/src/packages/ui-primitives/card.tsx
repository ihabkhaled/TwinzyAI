import type { ComponentPropsWithRef, ReactElement } from 'react';

import {
  type CardContentVariantProps,
  cardContentVariants,
  type CardDescriptionVariantProps,
  cardDescriptionVariants,
  type CardTitleVariantProps,
  cardTitleVariants,
  type CardVariantProps,
  cardVariants,
} from './card.variants';
import { cn } from './cn';
import type { Testable } from './testable';

export type CardProps = ComponentPropsWithRef<'div'> & CardVariantProps & Testable;

export type CardTitleProps = ComponentPropsWithRef<'h2'> & CardTitleVariantProps & Testable;

export type CardDescriptionProps = ComponentPropsWithRef<'p'> &
  CardDescriptionVariantProps &
  Testable;

export type CardContentProps = ComponentPropsWithRef<'div'> & CardContentVariantProps & Testable;

export function Card({ className, children, testId, ref, ...props }: CardProps): ReactElement {
  return (
    <div ref={ref} data-testid={testId} className={cn(cardVariants(), className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  testId,
  ref,
  ...props
}: CardTitleProps): ReactElement {
  return (
    <h2 ref={ref} data-testid={testId} className={cn(cardTitleVariants(), className)} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
  testId,
  ref,
  ...props
}: CardDescriptionProps): ReactElement {
  return (
    <p
      ref={ref}
      data-testid={testId}
      className={cn(cardDescriptionVariants(), className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  testId,
  ref,
  ...props
}: CardContentProps): ReactElement {
  return (
    <div ref={ref} data-testid={testId} className={cn(cardContentVariants(), className)} {...props}>
      {children}
    </div>
  );
}
