import { cva } from 'class-variance-authority';

/** Recipe for one accordion item shell. */
export const accordionItemVariants = cva('rounded-xl border border-border bg-surface');

/** Recipe for the accordion trigger button (full-width disclosure control). */
export const accordionTriggerVariants = cva(
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-4 py-3 text-start text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

/** Recipe for the disclosure chevron; rotates when open (motion-safe only). */
export const accordionChevronVariants = cva('shrink-0 motion-safe:transition-transform', {
  variants: {
    open: {
      true: 'rotate-180',
      false: '',
    },
  },
  defaultVariants: { open: false },
});

/** Recipe for the revealed content region. */
export const accordionContentVariants = cva('border-t border-border px-4 py-3');
