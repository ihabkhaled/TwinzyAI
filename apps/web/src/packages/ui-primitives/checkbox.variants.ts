import { cva, type VariantProps } from 'class-variance-authority';

/** Class recipe for the native checkbox input rendered by {@link Checkbox}. */
export const checkboxVariants = cva(
  'size-5 shrink-0 rounded border border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
);

export type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;
