import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Mobile-first page shell recipe for {@link PageContainer}. Centres content in
 * a narrow `max-w-xl` column with comfortable vertical rhythm.
 */
export const pageContainerVariants = cva('mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-8');

export type PageContainerVariantProps = VariantProps<typeof pageContainerVariants>;
