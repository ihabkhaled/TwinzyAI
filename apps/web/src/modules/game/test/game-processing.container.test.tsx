import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GameProcessing } from '../containers/game-processing.container';

const baseProps = {
  stageLabel: 'Reading visible traits...',
  hint: 'This usually takes a few seconds.',
  traitsTitle: 'Traits we are reading',
  candidatesTitle: 'Rough matches',
  traits: [],
  candidateNames: [],
};

describe('GameProcessing', () => {
  it('shows only the live status before any intermediate data arrives', () => {
    render(<GameProcessing {...baseProps} />);

    expect(screen.getByText('Reading visible traits...')).toBeInTheDocument();
    expect(screen.queryByText('Traits we are reading')).not.toBeInTheDocument();
    expect(screen.queryByText('Rough matches')).not.toBeInTheDocument();
  });

  it('writes down traits and candidate names as they stream in', () => {
    render(
      <GameProcessing
        {...baseProps}
        traits={[{ key: 'hairColor', label: 'Hair color', value: 'Brown' }]}
        candidateNames={['Ada Lovelace']}
      />,
    );

    expect(screen.getByText('Traits we are reading')).toBeInTheDocument();
    expect(screen.getByText('Hair color')).toBeInTheDocument();
    expect(screen.getByText('Brown')).toBeInTheDocument();
    expect(screen.getByText('Rough matches')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });
});
