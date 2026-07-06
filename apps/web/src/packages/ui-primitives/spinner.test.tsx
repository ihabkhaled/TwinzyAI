import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './spinner';

describe('<Spinner />', () => {
  it('is an accessible status region labelled by its label prop', () => {
    render(<Spinner label="Loading results" />);

    const spinner = screen.getByRole('status');

    expect(spinner).toHaveAttribute('aria-label', 'Loading results');
    expect(screen.getByRole('status', { name: 'Loading results' })).toBe(spinner);
  });
});
