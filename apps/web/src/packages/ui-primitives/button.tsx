'use client';
// client-boundary-reason: renders an interactive <button> that binds click and keyboard handlers on the client

import type { ComponentPropsWithRef, ReactElement } from 'react';

import { type ButtonVariantProps, buttonVariants } from './button.variants';
import { cn } from './cn';
import type { Testable } from './testable';

export type ButtonProps = ComponentPropsWithRef<'button'> & ButtonVariantProps & Testable;

export function Button({
  className,
  variant,
  size,
  type = 'button',
  testId,
  ref,
  children,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      type={type}
      ref={ref}
      data-testid={testId}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
