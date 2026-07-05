import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GameScreen } from '@/features/game';
import { analyzeImageRequest } from '@/features/game/gateways/game.gateway';
import { en } from '@/i18n/en';
import { HttpClientError } from '@/lib/http';

import { buildFinalResult, buildImageFile } from './fixtures/game-fixtures';

vi.mock('@/features/game/gateways/game.gateway', () => ({
  analyzeImageRequest: vi.fn(),
}));

const mockedAnalyze = vi.mocked(analyzeImageRequest);

const renderGameScreen = (): void => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <GameScreen />
    </QueryClientProvider>,
  );
};

const selectValidFileAndConsent = async (): Promise<void> => {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText(en['game.uploadLabel'], { exact: false }), buildImageFile());
  await user.click(screen.getByRole('checkbox', { name: en['game.consentLabel'] }));
};

beforeEach(() => {
  mockedAnalyze.mockReset();
});

describe('GameScreen', () => {
  it('renders the game setup with privacy notice and accessible upload control', () => {
    renderGameScreen();

    expect(screen.getByRole('heading', { name: en['game.title'] })).toBeInTheDocument();
    expect(screen.getByText(en['landing.privacyNotice'])).toBeInTheDocument();
    expect(screen.getByLabelText(en['game.uploadLabel'], { exact: false })).toBeInTheDocument();
  });

  it('keeps analyze disabled until both a valid file and consent are given', async () => {
    const user = userEvent.setup();
    renderGameScreen();

    const analyzeButton = screen.getByRole('button', { name: en['game.analyzeButton'] });
    expect(analyzeButton).toBeDisabled();

    await user.upload(
      screen.getByLabelText(en['game.uploadLabel'], { exact: false }),
      buildImageFile(),
    );
    expect(analyzeButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: en['game.consentLabel'] }));
    expect(analyzeButton).toBeEnabled();
  });

  it('rejects an invalid extension with a friendly message', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderGameScreen();

    await user.upload(
      screen.getByLabelText(en['game.uploadLabel'], { exact: false }),
      buildImageFile('animation.gif', 'image/gif'),
    );

    expect(screen.getByText(en['error.fileTypeNotAllowed'])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en['game.analyzeButton'] })).toBeDisabled();
  });

  it('rejects an oversized file with a friendly message', async () => {
    const user = userEvent.setup();
    renderGameScreen();

    await user.upload(
      screen.getByLabelText(en['game.uploadLabel'], { exact: false }),
      buildImageFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024),
    );

    expect(screen.getByText(en['error.fileTooLarge'])).toBeInTheDocument();
  });

  it('shows the processing state while analyzing', async () => {
    mockedAnalyze.mockReturnValue(new Promise(vi.fn()));
    renderGameScreen();
    await selectValidFileAndConsent();

    await userEvent.click(screen.getByRole('button', { name: en['game.analyzeButton'] }));

    expect(await screen.findByText(en['game.processingText'])).toBeInTheDocument();
  });

  it('renders traits, results, and the disclaimer on success', async () => {
    mockedAnalyze.mockResolvedValue(buildFinalResult());
    renderGameScreen();
    await selectValidFileAndConsent();

    await userEvent.click(screen.getByRole('button', { name: en['game.analyzeButton'] }));

    expect(await screen.findByText('Sample Star')).toBeInTheDocument();
    expect(screen.getByText(en['game.traitsTitle'])).toBeInTheDocument();
    expect(screen.getByText('observed faceShape')).toBeInTheDocument();
    expect(screen.getByText(en['game.disclaimer'])).toBeInTheDocument();
    expect(screen.getByText(/87%/)).toBeInTheDocument();
  });

  it('shows a friendly message when the API fails and supports retry', async () => {
    mockedAnalyze.mockRejectedValue(
      new HttpClientError(502, 'AI_PROVIDER_UNAVAILABLE', 'upstream'),
    );
    renderGameScreen();
    await selectValidFileAndConsent();

    await userEvent.click(screen.getByRole('button', { name: en['game.analyzeButton'] }));

    expect(await screen.findByText(en['error.aiUnavailable'])).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: en['game.retryButton'] }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: en['game.analyzeButton'] })).toBeDisabled();
    });
    expect(screen.queryByText(en['error.aiUnavailable'])).not.toBeInTheDocument();
  });

  it('never renders forbidden wording anywhere in the flow', async () => {
    mockedAnalyze.mockResolvedValue(buildFinalResult());
    renderGameScreen();
    await selectValidFileAndConsent();
    await userEvent.click(screen.getByRole('button', { name: en['game.analyzeButton'] }));
    await screen.findByText('Sample Star');

    // The disclaimer legitimately NEGATES sensitive concepts ("It is not
    // face recognition...") — so scan for affirmative claim phrases only.
    const rendered = document.body.textContent.toLowerCase();
    const forbiddenClaims = [
      'looks exactly like',
      'same face',
      'recognized you',
      'exact lookalike',
      'the person is ',
      'you are sample',
      'biometric match',
    ];
    for (const phrase of forbiddenClaims) {
      expect(rendered).not.toContain(phrase);
    }
  });

  it('never stores image data in localStorage or sessionStorage', async () => {
    const localSet = vi.spyOn(Storage.prototype, 'setItem');
    mockedAnalyze.mockResolvedValue(buildFinalResult());
    renderGameScreen();
    await selectValidFileAndConsent();
    await userEvent.click(screen.getByRole('button', { name: en['game.analyzeButton'] }));
    await screen.findByText('Sample Star');

    expect(localSet).not.toHaveBeenCalled();
  });
});
