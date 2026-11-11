import { render, screen } from '@testing-library/react';
import React from 'react';

import { DispositionForm } from '../../src/ringcx/components/DispositionForm';

// The shared Spring UI mock has no form fields.
jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('@ringcentral/spring-ui'),
  Select: ({ children }) => <div>{children}</div>,
  Option: ({ children }) => <div>{children}</div>,
  Textarea: ({ 'data-sign': dataSign, helperText }) => (
    <div>
      <textarea data-sign={dataSign} />
      {helperText ? <span>{helperText}</span> : null}
    </div>
  ),
}));

const DISPOSITIONS = [
  { dispositionId: 'disp-1', disposition: 'Sale', requireNote: true },
];

function renderForm(overrides = {}) {
  return render(
    <DispositionForm
      dispositionPickList={DISPOSITIONS}
      dispositionData={{ dispositionId: 'disp-1', notes: '' }}
      validated={{ dispositionId: true, notes: true }}
      required={{ notes: false }}
      onFieldChange={jest.fn()}
      {...overrides}
    />,
  );
}

describe('DispositionForm notes', () => {
  test('always shows the notes field', () => {
    const { container } = renderForm();

    expect(container.querySelector('[data-sign="notesTextarea"]')).toBeTruthy();
  });

  test('shows why Submit is blocked when the disposition requires notes', () => {
    // A disposition that requires notes must never hide the field that
    // unblocks it, or Submit silently does nothing.
    const { container } = renderForm({
      required: { notes: true },
      validated: { dispositionId: true, notes: false },
    });

    expect(container.querySelector('[data-sign="notesTextarea"]')).toBeTruthy();
    expect(screen.getByText('Notes are required for this disposition.')).toBeTruthy();
  });
});
