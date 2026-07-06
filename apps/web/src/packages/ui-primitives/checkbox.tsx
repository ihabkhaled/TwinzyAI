'use client';
// client-boundary-reason: binds a change handler and forwards a focus ref to a native checkbox input

import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import { type CheckboxVariantProps, checkboxVariants } from './checkbox.variants';
import { cn } from './cn';
import type { Testable } from './testable';

export type CheckboxProps = ComponentPropsWithRef<'input'> &
  CheckboxVariantProps &
  Testable & {
    label?: ReactNode;
  };

export function Checkbox({ className, label, testId, ref, ...props }: CheckboxProps): ReactElement {
  return (
    <label className="inline-flex items-start gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        ref={ref}
        data-testid={testId}
        className={cn(checkboxVariants(), className)}
        {...props}
      />
      {label === undefined ? null : <span>{label}</span>}
    </label>
  );
}
