import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from './alert';

describe('<Alert />', () => {
  it('exposes a status role and defaults to the neutral info tone', () => {
    render(<Alert>Heads up</Alert>);

    const alert = screen.getByRole('status');

    expect(alert).toHaveTextContent('Heads up');
    expect(alert).toHaveClass('bg-surface');
  });

  it('applies the danger tone', () => {
    render(<Alert tone="danger">Broken</Alert>);

    expect(screen.getByRole('status')).toHaveClass('text-danger');
  });
});
