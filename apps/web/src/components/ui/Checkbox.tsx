import type { ChangeEvent, ReactNode } from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = ({ id, label, checked, onChange }: CheckboxProps): ReactNode => (
  <label htmlFor={id} className="flex min-h-12 cursor-pointer items-start gap-3 text-start">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]"
    />
    <span className="text-sm leading-6">{label}</span>
  </label>
);
