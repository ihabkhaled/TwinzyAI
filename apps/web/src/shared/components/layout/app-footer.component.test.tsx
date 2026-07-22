import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppFooter } from './app-footer.component';
import { FooterNavLink } from './footer-nav-link.component';

const renderFooter = (): void => {
  render(
    <AppFooter navigationLabel="Site navigation" note="Entertainment only.">
      <FooterNavLink href="/about" label="About" />
      <FooterNavLink href="/faq" label="FAQ" />
    </AppFooter>,
  );
};

describe('<AppFooter />', () => {
  it('renders a labelled site navigation with every link', () => {
    renderFooter();

    const nav = screen.getByRole('navigation', { name: 'Site navigation' });

    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
  });

  it('renders the entertainment-only note inside a contentinfo landmark', () => {
    renderFooter();

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Entertainment only.');
  });
});
