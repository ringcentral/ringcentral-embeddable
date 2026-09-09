import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ThirdPartySettingSectionPanel } from '../../next/app/views/ThirdPartySettingSectionView/ThirdPartySettingSectionPanel';

jest.mock(
  '@ringcentral-integration/micro-core/src/app/components/AppContext/AppFooter',
  () => ({ AppFooterNav: ({ children }) => <footer>{children}</footer> }),
);

jest.mock(
  '@ringcentral-integration/micro-core/src/app/components/AppContext/AppHeader',
  () => ({ AppHeaderNav: ({ children }) => <div>{children}</div> }),
);

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: ({ children, onBackClick }) => (
    <header>
      <button type="button" aria-label="back" onClick={onBackClick}>
        Back
      </button>
      {children}
    </header>
  ),
}));

jest.mock('@ringcentral/spring-ui', () => {
  const React = require('react');
  const Button = ({ children, fullWidth, loading, startIcon, ...props }) => (
    <button
      type="button"
      data-full-width={Boolean(fullWidth)}
      data-loading={Boolean(loading)}
      {...props}
    >
      {startIcon}
      {children}
    </button>
  );
  const FormLabel = ({ children, disabled, label, rootProps }) => (
    <label {...rootProps}>
      {label}
      {React.cloneElement(children, { disabled })}
    </label>
  );
  const TextField = ({ clearBtn, fullWidth, helperText, label, onChange, value, ...props }) => (
    <label>
      {label}
      <input
        data-clear-button={Boolean(clearBtn)}
        data-full-width={Boolean(fullWidth)}
        value={value}
        onChange={onChange}
        {...props}
      />
      {helperText ? <span>{helperText}</span> : null}
    </label>
  );
  return {
    Alert: ({ children, severity, ...props }) => (
      <div role="alert" data-severity={severity} {...props}>
        {children}
      </div>
    ),
    Button,
    Checkbox: (props) => <input type="checkbox" {...props} />,
    FormLabel,
    Icon: () => null,
    IconButton: (props) => <button type="button" {...props} />,
    Option: ({ children }) => <option>{children}</option>,
    Select: ({ children, helperText, label, onChange, value, ...props }) => (
      <label>
        {label}
        <select value={value} onChange={onChange} {...props}>
          {children}
        </select>
        {helperText ? <span>{helperText}</span> : null}
      </label>
    ),
    Switch: (props) => <input type="checkbox" {...props} />,
    Textarea: ({ clearBtn, fullWidth, helperText, label, onChange, value, ...props }) => (
      <label>
        {label}
        <textarea
          data-clear-button={Boolean(clearBtn)}
          data-full-width={Boolean(fullWidth)}
          value={value}
          onChange={onChange}
          {...props}
        />
        {helperText ? <span>{helperText}</span> : null}
      </label>
    ),
    TextField,
    Tooltip: ({ children }) => children,
  };
});

function createSection() {
  return {
    id: 'crmSettings',
    name: 'CRM settings',
    type: 'section',
    items: [
      {
        id: 'notice',
        name: 'Notice',
        severity: 'warning',
        type: 'admonition',
        value: 'Configure the integration.',
      },
      {
        id: 'enabled',
        name: 'Enable integration',
        type: 'boolean',
        value: false,
      },
      {
        id: 'displayName',
        name: 'Display name',
        required: true,
        showWhen: {
          enabled: { operator: 'equal', value: true },
        },
        type: 'string',
        value: '',
      },
      {
        id: 'managed',
        name: 'Managed setting',
        readOnly: true,
        type: 'boolean',
        value: true,
      },
    ],
  };
}

describe('ThirdPartySettingSectionPanel', () => {
  test('supports conditional required fields and saves the edited section', async () => {
    const onBack = jest.fn();
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <ThirdPartySettingSectionPanel
        section={createSection()}
        onBack={onBack}
        onSave={onSave}
      />,
    );

    expect(screen.getByRole('alert')).toHaveAttribute(
      'data-severity',
      'warning',
    );
    expect(screen.queryByTestId('displayName')).toBeNull();
    expect(screen.getByTestId('managed').querySelector('input')).toBeDisabled();
    const saveButton = screen.getByTestId('thirdPartySettingSectionSave');
    expect(saveButton).toBeDisabled();

    fireEvent.click(
      within(screen.getByTestId('enabled')).getByRole('checkbox'),
    );
    expect(screen.getByTestId('displayName')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    fireEvent.change(screen.getByTestId('displayName'), {
      target: { value: 'Example CRM' },
    });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toMatchObject({
      id: 'crmSettings',
      items: expect.arrayContaining([
        expect.objectContaining({ id: 'enabled', value: true }),
        expect.objectContaining({ id: 'displayName', value: 'Example CRM' }),
      ]),
    });
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
