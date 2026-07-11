import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type * as EnvModule from '@/packages/env';

import { DonateLink } from '../containers/donate-link.container';

const envState: { paypalMeUsername: string | undefined } = { paypalMeUsername: undefined };

vi.mock('@/packages/env', async (importOriginal) => {
  const actual = await importOriginal<typeof EnvModule>();
  return {
    ...actual,
    publicEnv: {
      appEnv: 'test',
      apiBaseUrl: 'http://localhost:4000',
      get paypalMeUsername(): string | undefined {
        return envState.paypalMeUsername;
      },
    },
  };
});

describe('DonateLink', () => {
  it('renders nothing when no PayPal.me handle is configured', () => {
    envState.paypalMeUsername = undefined;
    render(<DonateLink label="Support Twinzy on PayPal (voluntary)" />);

    expect(screen.queryByTestId('donate-link')).not.toBeInTheDocument();
  });

  it('renders a safe outbound link when a handle is configured', () => {
    envState.paypalMeUsername = 'twinzytest';
    render(<DonateLink label="Support Twinzy on PayPal (voluntary)" />);

    const link = screen.getByTestId('donate-link');
    expect(link).toHaveAttribute('href', 'https://paypal.me/twinzytest');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('Support Twinzy on PayPal (voluntary)');
  });
});
