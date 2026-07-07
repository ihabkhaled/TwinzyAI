import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppHeader } from './app-header.component';

describe('AppHeader', () => {
  it('renders the brand label and its control children', () => {
    render(
      <AppHeader brandLabel="Twinzy">
        <button type="button">control</button>
      </AppHeader>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Twinzy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'control' })).toBeInTheDocument();
  });
});
