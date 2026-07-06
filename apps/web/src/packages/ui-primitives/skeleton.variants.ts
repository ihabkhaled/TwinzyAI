import { cva, type VariantProps } from 'class-variance-authority';

/** Class recipe for {@link Skeleton} loading placeholders. */
export const skeletonVariants = cva('animate-pulse rounded-md bg-muted');

export type SkeletonVariantProps = VariantProps<typeof skeletonVariants>;
