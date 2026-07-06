import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Class recipe for {@link Alert}. `tone` selects the semantic role colour
 * (info/success/warning/danger); defaults to the neutral info tone.
 */
export const alertVariants = cva('flex items-start gap-3 rounded-xl border p-4 text-sm', {
  variants: {
    tone: {
      info: 'border-border bg-surface text-foreground',
      success: 'border-success/30 bg-success/10 text-foreground',
      warning: 'border-warning/30 bg-warning/10 text-foreground',
      danger: 'border-danger/30 bg-danger/10 text-danger',
    },
  },
  defaultVariants: {
    tone: 'info',
  },
});

export type AlertVariantProps = VariantProps<typeof alertVariants>;
