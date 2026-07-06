import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Class recipe for {@link Input}. Invalid state is driven purely by the
 * `aria-invalid` attribute so validation styling stays accessibility-first.
 */
export const inputVariants = cva(
  'flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger',
);

export type InputVariantProps = VariantProps<typeof inputVariants>;
