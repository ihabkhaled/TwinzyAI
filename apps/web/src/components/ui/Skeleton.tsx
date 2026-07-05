import type { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps): ReactNode => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-lg bg-surface-muted ${className ?? ''}`}
  />
);
