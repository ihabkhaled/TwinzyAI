import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GameResult } from '../containers/game-result.container';
import { buildGameScreenLabels } from '../helpers/game-display.helper';
import { mapFinalResultToView } from '../mappers/game.mapper';

import { buildFinalResult, fakeTranslate } from './game-fixtures';

const labels = buildGameScreenLabels(fakeTranslate);
const view = mapFinalResultToView(buildFinalResult(), fakeTranslate);

const baseProps = {
  view,
  labels: labels.result,
  traitCountLabel: 'Traits read: 221',
  translatingLabel: 'Translating…',
  retryTranslationLabel: 'Retry translation',
  isTranslating: false,
  translationError: undefined,
  canRetryTranslation: false,
  onRetryTranslation: vi.fn(),
  shareFeedback: undefined,
  onShare: vi.fn(),
  onRetry: vi.fn(),
};

describe('GameResult translation status', () => {
  it('shows neither the loading banner nor a retry button in the steady state', () => {
    render(<GameResult {...baseProps} />);

    expect(screen.queryByText('Translating…')).not.toBeInTheDocument();
    expect(screen.queryByTestId('translation-retry')).not.toBeInTheDocument();
  });

  it('shows the loading banner while a language switch is translating', () => {
    render(<GameResult {...baseProps} isTranslating />);

    expect(screen.getByText('Translating…')).toBeInTheDocument();
  });

  it('renders a working retry button when translation failed', async () => {
    const onRetryTranslation = vi.fn();
    render(
      <GameResult
        {...baseProps}
        translationError="We could not translate the result. Still showing the previous language."
        canRetryTranslation
        onRetryTranslation={onRetryTranslation}
      />,
    );

    expect(
      screen.getByText('We could not translate the result. Still showing the previous language.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('translation-retry'));
    expect(onRetryTranslation).toHaveBeenCalledTimes(1);
  });
});
