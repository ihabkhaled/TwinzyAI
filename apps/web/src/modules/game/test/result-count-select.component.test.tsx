import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ResultCountSelect } from '../components/result-count-select.component';

const baseProps = {
  id: 'result-count',
  label: 'Number of matches',
  hint: 'Choose how many matches.',
  value: 5,
  onChange: vi.fn(),
  testId: 'result-count-select',
};

const options = [
  <option key={1} value={1}>
    1
  </option>,
  <option key={5} value={5}>
    5
  </option>,
  <option key={10} value={10}>
    10
  </option>,
];

describe('ResultCountSelect', () => {
  it('renders the accessible label and hint', () => {
    render(<ResultCountSelect {...baseProps}>{options}</ResultCountSelect>);

    expect(screen.getByLabelText('Number of matches')).toBeInTheDocument();
    expect(screen.getByText('Choose how many matches.')).toBeInTheDocument();
  });

  it('reflects the current value', () => {
    render(<ResultCountSelect {...baseProps}>{options}</ResultCountSelect>);

    expect(screen.getByTestId('result-count-select')).toHaveValue('5');
  });

  it('calls onChange when the user selects another option', () => {
    const onChange = vi.fn();
    render(
      <ResultCountSelect {...baseProps} onChange={onChange}>
        {options}
      </ResultCountSelect>,
    );

    fireEvent.change(screen.getByTestId('result-count-select'), { target: { value: '10' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
