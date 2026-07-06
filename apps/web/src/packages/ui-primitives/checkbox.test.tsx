import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Checkbox } from './checkbox';

describe('<Checkbox />', () => {
  it('associates the rendered label text with the checkbox input', () => {
    render(<Checkbox label="Accept the rules" />);

    expect(screen.getByLabelText('Accept the rules')).toBe(screen.getByRole('checkbox'));
  });

  it('toggles its checked state when clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Consent" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});
