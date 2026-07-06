import { cva, type VariantProps } from 'class-variance-authority';

/** Class recipe for the CSS ring rendered by {@link Spinner}. */
export const spinnerVariants = cva(
  'inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground',
);

export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;
