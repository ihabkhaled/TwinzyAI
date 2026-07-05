import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps): ReactNode => (
  <section className={`rounded-2xl border border-border bg-surface p-5 shadow-sm ${className ?? ''}`}>
    {children}
  </section>
);
