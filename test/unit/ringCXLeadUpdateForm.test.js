import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { LeadUpdateForm } from '../../src/ringcx/components/LeadInfoPanel/LeadUpdateForm';

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: ({ children, onBackClick }) => (
    <header data-sign="leadUpdateHeader">
      <button type="button" data-sign="leadUpdateBack" onClick={onBackClick} />
      {children}
    </header>
  ),
}));

// The shared mock has no `Textarea`.
jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('@ringcentral/spring-ui'),
  Textarea: ({
    label,
    value,
    onChange,
    onBlur,
    disabled,
    required,
    error,
    helperText,
    minRows,
    clearBtn,
    fullWidth,
    ...props
  }) => (
    <label>
      {label}
      <textarea
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        {...props}
      />
      <span data-sign="leadUpdatePhoneHelper">{helperText}</span>
    </label>
  ),
}));

const LEAD = {
  leadId: '5725',
  externId: 'ext-1',
  firstName: 'Embbnux',
  lastName: 'Labs',
  city: 'Xiamen',
  auxData1: 'Gold',
};

const bySign = (sign) => document.querySelector(`[data-sign="${sign}"]`);
const inputOf = (field) => bySign(`leadUpdate-${field}`);

function renderForm(props = {}) {
  const formProps = {
    lead: LEAD,
    phoneNumbers: ['+16508446685'],
    auxLabels: ['Tier'],
    canEditPhone: true,
    onClose: jest.fn(),
    onSave: jest.fn(async () => true),
    ...props,
  };
  render(<LeadUpdateForm {...formProps} />);
  return formProps;
}

function typePhone(text) {
  fireEvent.change(inputOf('phone'), { target: { value: text } });
  fireEvent.blur(inputOf('phone'));
}

describe('LeadUpdateForm', () => {
  test("fills the lead's numbers one per line and its fields", () => {
    renderForm({ phoneNumbers: ['+16508446685', '+16505550100'] });

    expect(inputOf('phone')).toHaveValue('+16508446685\n+16505550100');
    expect(inputOf('firstName')).toHaveValue('Embbnux');
    expect(inputOf('city')).toHaveValue('Xiamen');
    expect(inputOf('auxData1')).toHaveValue('Gold');
    // Aux fields take the campaign's labels, else the default ones.
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('aux2')).toBeInTheDocument();
  });

  test('shows its own header with a back only when asked', () => {
    const { onClose } = renderForm();

    fireEvent.click(bySign('leadUpdateBack'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('leaves the header to the side widget tab bar', () => {
    renderForm({ showHeader: false });

    expect(bySign('leadUpdateHeader')).toBeNull();
  });

  test('saves only after a change', () => {
    renderForm();
    expect(bySign('leadUpdateSave')).toBeDisabled();

    fireEvent.change(inputOf('city'), { target: { value: 'Shanghai' } });

    expect(bySign('leadUpdateSave')).not.toBeDisabled();
  });

  test('saves the numbers in E.164 and the fields, then closes', async () => {
    const { onSave, onClose } = renderForm();

    typePhone('+16508446685\n\n(650) 555-0100');
    fireEvent.change(inputOf('lastName'), { target: { value: 'Ji' } });
    await act(async () => {
      fireEvent.click(bySign('leadUpdateSave'));
    });

    expect(onSave).toHaveBeenCalledWith({
      phoneNumbers: ['+16508446685', '+16505550100'],
      fields: expect.objectContaining({
        firstName: 'Embbnux',
        lastName: 'Ji',
        city: 'Xiamen',
        auxData1: 'Gold',
        midName: '',
        externId: 'ext-1',
      }),
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('stays open when the save fails', async () => {
    const { onClose } = renderForm({ onSave: jest.fn(async () => false) });

    fireEvent.change(inputOf('city'), { target: { value: 'Shanghai' } });
    await act(async () => {
      fireEvent.click(bySign('leadUpdateSave'));
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(bySign('leadUpdateSave')).not.toBeDisabled();
  });

  test('names the invalid lines and blocks the save', () => {
    renderForm();

    typePhone('+16508446685\n12,34\nabc');

    expect(inputOf('phone')).toHaveAttribute('aria-invalid', 'true');
    // Locale strings render as their keys in tests.
    expect(bySign('leadUpdatePhoneHelper')).toHaveTextContent(
      'invalidPhoneNumbers',
    );
    expect(bySign('leadUpdateSave')).toBeDisabled();
  });

  test('requires a number', () => {
    renderForm();

    typePhone('');

    expect(bySign('leadUpdatePhoneHelper')).toHaveTextContent('phoneRequired');
    expect(bySign('leadUpdateSave')).toBeDisabled();
  });

  test('keeps the first six lines', () => {
    renderForm();

    fireEvent.change(inputOf('phone'), {
      target: { value: ['1', '2', '3', '4', '5', '6', '7', '8'].join('\n') },
    });

    expect(inputOf('phone').value.split('\n')).toHaveLength(6);
  });

  test("locks the numbers when the campaign does not let agents change them, and saves the lead's own", async () => {
    const { onSave } = renderForm({ canEditPhone: false });

    expect(inputOf('phone')).toBeDisabled();
    fireEvent.change(inputOf('city'), { target: { value: 'Shanghai' } });
    await act(async () => {
      fireEvent.click(bySign('leadUpdateSave'));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumbers: ['+16508446685'] }),
    );
  });

  test('cancels without saving', () => {
    const { onSave, onClose } = renderForm();

    fireEvent.click(bySign('leadUpdateCancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
