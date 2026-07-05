import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    'bg-primary text-primary-contrast hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-muted',
};

export const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className,
}: ButtonProps): ReactNode => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`min-h-12 rounded-xl px-6 py-3 text-base font-semibold transition-colors ${VARIANT_CLASSES[variant] ?? ''} ${className ?? ''}`}
  >
    {children}
  </button>
);
