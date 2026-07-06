import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Flex layout recipe for {@link Stack}. Uses logical flex/gap utilities only
 * (no physical margins) so layouts flip correctly under RTL. Defaults to a
 * vertical stack with medium spacing.
 */
export const stackVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    wrap: {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      reverse: 'flex-wrap-reverse',
    },
  },
  defaultVariants: {
    direction: 'column',
    gap: 'md',
  },
});

export type StackVariantProps = VariantProps<typeof stackVariants>;
