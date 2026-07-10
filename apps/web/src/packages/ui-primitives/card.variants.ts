import { cva, type VariantProps } from 'class-variance-authority';

/** Surface container recipe for {@link Card} and its subcomponents. */
export const cardVariants = cva('rounded-2xl border border-border bg-surface p-6 shadow-sm');

export const cardTitleVariants = cva('text-xl font-semibold text-foreground');

export const cardDescriptionVariants = cva('text-sm text-muted-foreground');

export type CardVariantProps = VariantProps<typeof cardVariants>;

export type CardTitleVariantProps = VariantProps<typeof cardTitleVariants>;

export type CardDescriptionVariantProps = VariantProps<typeof cardDescriptionVariants>;
