import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicFigureModalContainer } from '../containers/public-figure-modal.container';
import { buildGameScreenLabels } from '../helpers/game-display.helper';
import type { PublicFigureView } from '../model/public-figure.types';

const labels = buildGameScreenLabels((key) => key).result;
const publicFigure: PublicFigureView = {
  entityId: 'Q170515',
  canonicalName: 'Omar Sharif',
  localizedName: 'عمر الشريف',
  biographySummary: 'Verified summary.',
  occupations: ['actor'],
  googleSearchUrl: 'https://www.google.com/search?q=Omar+Sharif',
};

describe('PublicFigureModalContainer', () => {
  it('isolates the name, traps focus, closes on Escape, and restores focus', () => {
    const onClose = vi.fn();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const view = render(
      <PublicFigureModalContainer publicFigure={publicFigure} labels={labels} onClose={onClose} />,
    );

    const close = screen.getByRole('button', { name: 'result.detailsClose' });
    expect(close).toHaveFocus();
    expect(screen.getByText('عمر الشريف')).toHaveAttribute('dir', 'auto');
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('link', { name: 'result.googleSearchLink' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    view.unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});
