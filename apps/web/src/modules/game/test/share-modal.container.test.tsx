import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppTranslation } from '@/packages/i18n';

import { ShareModal } from '../containers/share-modal.container';
import { buildPlatformLinks } from '../helpers/share-platform.helper';
import type { ShareModalProps } from '../model/share-modal.types';

vi.mock('@/packages/i18n', () => ({ useAppTranslation: vi.fn() }));

const echoTranslate = (key: string): string => key;

const SHARE_URL = 'https://twinzy.app/share/3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b';

const buildProps = (overrides: Partial<ShareModalProps> = {}): ShareModalProps => ({
  labels: {
    title: 'Share your result',
    description: 'Temporary link.',
    creating: 'Creating…',
    copyLink: 'Copy link',
    nativeShare: 'Share…',
    platformsTitle: 'Or share to',
    close: 'Close',
    createFailed: 'Failed',
    copyFeedback: undefined,
  },
  isCreating: false,
  shareUrl: SHARE_URL,
  errorMessage: undefined,
  canNativeShare: true,
  platformLinks: buildPlatformLinks({ url: SHARE_URL, text: 'text' }),
  onCopyLink: vi.fn(),
  onNativeShare: vi.fn(),
  onClose: vi.fn(),
  ...overrides,
});

describe('ShareModal', () => {
  beforeEach(() => {
    vi.mocked(useAppTranslation).mockReturnValue(echoTranslate as never);
  });

  it('is an accessible dialog labelled by its title', () => {
    render(<ShareModal {...buildProps()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Share your result')).toBeInTheDocument();
  });

  it('shows the creating state while the link is being minted', () => {
    render(<ShareModal {...buildProps({ isCreating: true, shareUrl: undefined })} />);
    expect(screen.getAllByText('Creating…').length).toBeGreaterThan(0);
  });

  it('shows a failure alert when creation failed', () => {
    render(
      <ShareModal
        {...buildProps({ shareUrl: undefined, errorMessage: 'Could not create link' })}
      />,
    );
    expect(screen.getByText('Could not create link')).toBeInTheDocument();
  });

  it('renders the read-only link, copy + native buttons, and encoded platform links', async () => {
    const props = buildProps();
    render(<ShareModal {...props} />);

    expect(screen.getByTestId('share-link-input')).toHaveValue(SHARE_URL);

    await userEvent.click(screen.getByTestId('copy-link-button'));
    expect(props.onCopyLink).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByTestId('native-share-button'));
    expect(props.onNativeShare).toHaveBeenCalledTimes(1);

    const whatsapp = screen.getByTestId('share-platform-link-whatsapp');
    expect(whatsapp).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(SHARE_URL)),
    );
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(whatsapp).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('hides the native-share button when Web Share is unavailable', () => {
    render(<ShareModal {...buildProps({ canNativeShare: false })} />);
    expect(screen.queryByTestId('native-share-button')).not.toBeInTheDocument();
  });

  it('closes from the close button', async () => {
    const props = buildProps();
    render(<ShareModal {...props} />);
    await userEvent.click(screen.getByTestId('close-share-modal'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
