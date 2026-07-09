import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppTranslation } from '@/packages/i18n';

import { SharePageContainer } from '../containers/share-page.container';
import * as useSharePageModule from '../hooks/useSharePage.hook';
import { SharePagePhase } from '../model/share.enums';
import type { SharePageController } from '../model/share.types';

import { buildFinalResult } from './game-fixtures';

vi.mock('@/packages/i18n', () => ({ useAppTranslation: vi.fn() }));
vi.mock('../hooks/useSharePage.hook', () => ({ useSharePage: vi.fn() }));

const echoTranslate = (key: string): string => key;
const useSharePageMock = vi.mocked(useSharePageModule.useSharePage);
const setController = (controller: SharePageController): void => {
  useSharePageMock.mockReturnValue(controller);
};

const RESULT = buildFinalResult();
const RESULT_NAME = RESULT.results[0]?.name ?? '';

describe('SharePageContainer', () => {
  beforeEach(() => {
    useSharePageMock.mockReset();
    vi.mocked(useAppTranslation).mockReturnValue(echoTranslate as never);
  });

  it('renders the loading state while fetching', () => {
    setController({ phase: SharePagePhase.Loading, result: undefined, remainingSeconds: 0 });
    render(<SharePageContainer shareId="x" />);
    expect(screen.getByTestId('share-page')).toBeInTheDocument();
  });

  it('renders the active result with a countdown, a CTA, and no image or forbidden wording', () => {
    setController({ phase: SharePagePhase.Active, result: RESULT, remainingSeconds: 540 });
    render(<SharePageContainer shareId="x" />);

    expect(screen.getByTestId('share-page')).toBeInTheDocument();
    expect(screen.getByTestId('share-countdown')).toBeInTheDocument();
    expect(screen.getByTestId('create-own-result')).toBeInTheDocument();
    expect(screen.getByText(RESULT_NAME)).toBeInTheDocument();
    // No uploaded image is ever rendered on the share page…
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // …and no forbidden identity/biometric wording appears anywhere.
    expect(
      screen.queryByText(/face recognition|biometric|identity match/iu),
    ).not.toBeInTheDocument();
  });

  it('hides the result and shows the expired state once the countdown ends', () => {
    setController({ phase: SharePagePhase.Expired, result: undefined, remainingSeconds: 0 });
    render(<SharePageContainer shareId="x" />);

    expect(screen.getByTestId('share-expired')).toBeInTheDocument();
    expect(screen.queryByText(RESULT_NAME)).not.toBeInTheDocument();
    expect(screen.queryByTestId('share-countdown')).not.toBeInTheDocument();
  });

  it('shows the not-found state for a missing/expired link', () => {
    setController({ phase: SharePagePhase.NotFound, result: undefined, remainingSeconds: 0 });
    render(<SharePageContainer shareId="x" />);

    expect(screen.getByTestId('share-not-found')).toBeInTheDocument();
    expect(screen.queryByText(RESULT_NAME)).not.toBeInTheDocument();
  });
});
