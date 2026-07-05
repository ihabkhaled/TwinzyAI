import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { en } from '@/i18n/en';

import HomePage from '../app/page';

describe('HomePage', () => {
  it('renders the tagline, subtitle, and privacy notice', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: en['app.tagline'] })).toBeInTheDocument();
    expect(screen.getByText(en['app.subtitle'])).toBeInTheDocument();
    expect(screen.getByText(en['landing.privacyNotice'])).toBeInTheDocument();
  });

  it('links the start button to the game page', () => {
    render(<HomePage />);

    const startLink = screen.getByRole('link', { name: en['landing.startButton'] });

    expect(startLink).toHaveAttribute('href', '/game');
  });
});
