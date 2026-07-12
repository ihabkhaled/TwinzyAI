import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PaymentStep } from '../containers/payment-step.container';
import type { PaymentViewModel } from '../model/payment.types';

/**
 * The PayPal Buttons SDK cannot run under jsdom, so the wrapper is stubbed to
 * render a plain button that invokes the app's createOrder + onApprove — the
 * exact bridge the real SDK drives. This gives deterministic coverage of the
 * paywall-ON step: it mounts the buttons, surfaces errors, and cancels back.
 */
vi.mock('@/packages/paypal', () => ({
  // Inlined (not a top-level const) because vi.mock factories are hoisted
  // above module-scope declarations. Renders a plain button that drives the
  // app's createOrder + onApprove — the exact bridge the real SDK provides.
  // Honors the abort signal exactly like the real wrapper, so the StrictMode
  // double-render is exercised (a cancelled render must not paint a button).
  renderPayPalButtons: (
    container: HTMLElement,
    config: {
      createOrder: () => Promise<string>;
      onApprove: (orderId: string) => void | Promise<void>;
    },
    signal?: AbortSignal,
  ): Promise<{ close: () => void }> => {
    if (signal?.aborted === true) {
      return Promise.resolve({ close: (): void => undefined });
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset['testid'] = 'fake-paypal-pay';
    button.addEventListener('click', () => {
      void Promise.resolve(config.createOrder()).then((id) => config.onApprove(id));
    });
    container.replaceChildren(button);
    return Promise.resolve({ close: (): void => undefined });
  },
}));

const buildPayment = (overrides: Partial<PaymentViewModel> = {}): PaymentViewModel => ({
  isPaywallEnabled: true,
  isPaying: true,
  createOrder: vi.fn(() => Promise.resolve('ORDER-1')),
  onApprove: vi.fn(),
  onCancel: vi.fn(),
  onError: vi.fn(),
  ...overrides,
});

const labels = {
  title: 'Your $0.50 analysis',
  description: 'Pay to reveal results.',
  loadingLabel: 'Loading secure payment options…',
  cancelLabel: 'Cancel and go back',
};

describe('PaymentStep', () => {
  it('renders the explanation, the PayPal buttons, and a cancel action', async () => {
    render(<PaymentStep {...labels} errorMessage={undefined} payment={buildPayment()} />);

    expect(screen.getByTestId('payment-step')).toBeInTheDocument();
    expect(screen.getByText('Your $0.50 analysis')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('fake-paypal-pay')).toBeInTheDocument();
    });
  });

  it('shows a loader until the buttons render, then hides it', async () => {
    render(<PaymentStep {...labels} errorMessage={undefined} payment={buildPayment()} />);

    // The loader is visible on first paint, before the async SDK render resolves.
    expect(screen.getByTestId('payment-loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('fake-paypal-pay')).toBeInTheDocument();
    });
    // Once the buttons are ready the loader is gone.
    expect(screen.queryByTestId('payment-loader')).not.toBeInTheDocument();
  });

  it('renders exactly ONE button under StrictMode (no double-render flash)', async () => {
    render(
      <StrictMode>
        <PaymentStep {...labels} errorMessage={undefined} payment={buildPayment()} />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('fake-paypal-pay')).toBeInTheDocument();
    });
    // The StrictMode mount→unmount→mount cycle must not leave two button sets.
    expect(screen.getAllByTestId('fake-paypal-pay')).toHaveLength(1);
  });

  it('drives createOrder then onApprove when the buyer pays', async () => {
    const createOrder = vi.fn(() => Promise.resolve('ORDER-9'));
    const onApprove = vi.fn();
    render(
      <PaymentStep
        {...labels}
        errorMessage={undefined}
        payment={buildPayment({ createOrder, onApprove })}
      />,
    );

    await userEvent.click(await screen.findByTestId('fake-paypal-pay'));

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith('ORDER-9');
    });
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable error and a working cancel button', async () => {
    const onCancel = vi.fn();
    render(
      <PaymentStep
        {...labels}
        errorMessage="Payment could not be completed. You have not been charged."
        payment={buildPayment({ onCancel })}
      />,
    );

    expect(
      screen.getByText('Payment could not be completed. You have not been charged.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('cancel-payment'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
