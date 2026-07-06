import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('<Button />', () => {
  it('renders primary + md classes and a safe default type', () => {
    render(<Button>Go</Button>);

    const button = screen.getByRole('button', { name: 'Go' });

    expect(button).toHaveClass('bg-primary', 'h-11');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies the danger variant at the large size', () => {
    render(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-danger', 'h-12');
  });

  it('forwards testId as data-testid and merges a custom className', () => {
    render(
      <Button testId="submit" className="w-full">
        Send
      </Button>,
    );

    expect(screen.getByTestId('submit')).toHaveClass('w-full');
  });
});
