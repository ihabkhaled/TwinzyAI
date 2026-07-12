import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy } from './content-security-policy';

const baseInput = {
  nonce: 'test-nonce',
  isDevRuntime: false,
  apiBaseUrl: 'https://api.twinzy.test',
  paypalClientId: undefined,
};

const directive = (csp: string, name: string): string =>
  csp.split('; ').find((part) => part.startsWith(`${name} `)) ?? '';

describe('buildContentSecurityPolicy without the paywall (free game)', () => {
  it('contains no PayPal origins anywhere', () => {
    const csp = buildContentSecurityPolicy(baseInput);

    expect(csp).not.toContain('paypal');
    expect(directive(csp, 'connect-src')).toBe(`connect-src 'self' https://api.twinzy.test`);
    expect(directive(csp, 'frame-src')).toBe(`frame-src 'self'`);
  });

  it('keeps a minimal font-src (no data:) for the free game', () => {
    expect(directive(buildContentSecurityPolicy(baseInput), 'font-src')).toBe(`font-src 'self'`);
  });

  it('keeps a strict, eval-free script-src in a built environment', () => {
    const csp = buildContentSecurityPolicy(baseInput);

    expect(directive(csp, 'script-src')).toBe(
      `script-src 'self' 'nonce-test-nonce' 'strict-dynamic'`,
    );
  });

  it('allows unsafe-eval only under the dev runtime', () => {
    const csp = buildContentSecurityPolicy({ ...baseInput, isDevRuntime: true });

    expect(directive(csp, 'script-src')).toContain(`'unsafe-eval'`);
  });
});

describe('buildContentSecurityPolicy with the paywall configured', () => {
  const csp = buildContentSecurityPolicy({ ...baseInput, paypalClientId: 'client-1' });

  it('allows the PayPal SDK script host AND the paypalobjects asset host', () => {
    const scriptSrc = directive(csp, 'script-src');
    expect(scriptSrc).toContain('https://www.paypal.com');
    // The bug that rendered the buttons as broken images: this host is a
    // separate domain not covered by *.paypal.com and MUST be present.
    expect(scriptSrc).toContain('https://www.paypalobjects.com');
  });

  it('allows the button logo images from paypalobjects (the broken-image fix)', () => {
    expect(directive(csp, 'img-src')).toContain('https://www.paypalobjects.com');
  });

  it('allows the inline data: button fonts the SDK injects', () => {
    const fontSrc = directive(csp, 'font-src');
    expect(fontSrc).toContain('data:');
    expect(fontSrc).toContain('https://www.paypalobjects.com');
  });

  it('allows the checkout iframe and REST calls to paypal.com', () => {
    expect(directive(csp, 'frame-src')).toContain('https://www.paypal.com');
    expect(directive(csp, 'connect-src')).toContain('https://*.paypal.com');
  });
});
