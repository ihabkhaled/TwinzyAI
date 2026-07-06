'use client';
// client-boundary-reason: forwards a focus ref and binds change and blur handlers on a native text input

import type { ComponentPropsWithRef, ReactElement } from 'react';

import { cn } from './cn';
import { type InputVariantProps, inputVariants } from './input.variants';
import type { Testable } from './testable';

export type InputProps = ComponentPropsWithRef<'input'> & InputVariantProps & Testable;

export function Input({
  className,
  type = 'text',
  testId,
  ref,
  ...props
}: InputProps): ReactElement {
  return (
    <input
      type={type}
      ref={ref}
      data-testid={testId}
      className={cn(inputVariants(), className)}
      {...props}
    />
  );
}
