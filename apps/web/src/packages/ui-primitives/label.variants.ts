import { cva, type VariantProps } from 'class-variance-authority';

/** Class recipe for {@link Label}. */
export const labelVariants = cva('text-sm font-medium text-foreground');

export type LabelVariantProps = VariantProps<typeof labelVariants>;
