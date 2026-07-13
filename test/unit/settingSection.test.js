/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SettingParamInput } from '../../src/components/SettingSection/SettingParamInput';
import { SettingSection } from '../../src/components/SettingSection';

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    InfoBorder: createIcon('InfoBorder'),
    Lock: createIcon('Lock'),
    Delete: createIcon('Delete'),
    Add: createIcon('Add'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  function getText(value) {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(getText).join(' ');
    }
    if (React.isValidElement(value)) {
      return getText(value.props.children);
    }
    return '';
  }
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'autoFocus',
        'color',
        'component',
        'formControlLabelProps',
        'fullWidth',
        'helperText',
        'loading',
        'primaryTypographyProps',
        'radius',
        'renderValue',
        'size',
        'startIcon',
        'symbol',
        'variant',
      ].includes(key)
    ) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const createComponent = (tag) => React.forwardRef((props, ref) => (
    React.createElement(tag, { ...cleanProps(props), ref }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div');
  styled.span = () => createComponent('span');
  return {
    RcAlert: ({ children, severity, className }) => (
      <div role="alert" className={className} data-severity={severity}>
        {children}
      </div>
    ),
    RcButton: ({ children, disabled, onClick }) => (
      <button type="button" disabled={disabled} onClick={onClick}>
        {children}
      </button>
    ),
    RcCheckbox: ({ checked, disabled, label, onChange }) => (
      <label>
        <input
          type="checkbox"
          checked={!!checked}
          disabled={disabled}
          onChange={(event) => onChange(event, event.target.checked)}
        />
        {label}
      </label>
    ),
    RcFormGroup: createComponent('div'),
    RcFormLabel: ({ children, required }) => (
      <label>
        {children}
        {required ? '*' : ''}
      </label>
    ),
    RcIcon: createComponent('span'),
    RcIconButton: ({ onClick, symbol }) => (
      <button type="button" onClick={onClick}>
        {symbol?.name || 'icon'}
      </button>
    ),
    RcListItemText: ({ primary, secondary }) => (
      <span>
        {primary}
        {secondary}
      </span>
    ),
    RcMenuItem: ({ children, value }) => (
      <option value={value}>{children}</option>
    ),
    RcSelect: ({
      children,
      label,
      multiple,
      onChange,
      readOnly,
      renderValue,
      value,
    }) => (
      <label>
        {label}
        <select
          aria-label={getText(label)}
          multiple={multiple}
          value={value || (multiple ? [] : '')}
          onChange={(event) => {
            if (readOnly) {
              return;
            }
            onChange({
              target: {
                value: multiple
                  ? event.target.value.split(',')
                  : event.target.value,
              },
            });
          }}
        >
          {children}
        </select>
        {renderValue ? <span>{renderValue(value)}</span> : null}
      </label>
    ),
    RcSwitch: ({ checked, label, onChange, readOnly }) => (
      <label>
        {label}
        <input
          type="checkbox"
          checked={!!checked}
          readOnly={readOnly}
          onChange={(event) => onChange(event, event.target.checked)}
        />
      </label>
    ),
    RcTextarea: ({ helperText, label, onChange, readOnly, value }) => (
      <label>
        {label}
        <textarea
          aria-label={getText(label)}
          readOnly={readOnly}
          value={value}
          onChange={onChange}
        />
        {helperText}
      </label>
    ),
    RcTextField: ({ helperText, label, onChange, readOnly, value }) => (
      <label>
        {label}
        <input
          aria-label={getText(label)}
          readOnly={readOnly}
          value={value}
          onChange={onChange}
        />
        {helperText}
      </label>
    ),
    RcTooltip: ({ children }) => <span>{children}</span>,
    RcTypography: ({ children }) => <span>{children}</span>,
    css: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    styled,
  };
});

jest.mock('@ringcentral/juno/foundation', () => {
  const { palette2, styled } = require('@ringcentral/juno');
  return { palette2, styled };
});

jest.mock('@ringcentral-integration/jsonschema-page', () => ({
  TextWithMarkdown: ({ text }) => <span>{text}</span>,
}));

jest.mock('../../src/components/BackHeaderView', () => ({
  BackHeaderView: ({ children, onBack, title }) => (
    <div>
      <button type="button" onClick={onBack}>back</button>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock('../../src/components/SaveButton', () => ({
  SaveButton: ({ disabled, onClick }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      save
    </button>
  ),
}));

describe('SettingParamInput', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders editable primitive, option, message, and array setting inputs', () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <SettingParamInput
        setting={{
          id: 'enabled',
          name: 'Enabled',
          type: 'boolean',
          value: false,
          description: 'Turn it on',
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Enabled/ }));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(
      <SettingParamInput
        setting={{
          id: 'apiKey',
          name: 'API key',
          type: 'string',
          value: '',
          helper: 'Required',
          required: true,
        }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('API key'), {
      target: { value: 'secret' },
    });
    expect(onChange).toHaveBeenLastCalledWith('secret');

    rerender(
      <SettingParamInput
        setting={{
          id: 'description',
          name: 'Description',
          type: 'text',
          value: 'old',
        }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'new text' },
    });
    expect(onChange).toHaveBeenLastCalledWith('new text');

    rerender(
      <SettingParamInput
        setting={{
          id: 'mode',
          name: 'Mode',
          type: 'option',
          value: 'basic',
          options: [
            { id: 'basic', name: 'Basic' },
            { id: 'advanced', name: 'Advanced', description: 'More controls' },
          ],
        }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Mode'), {
      target: { value: 'advanced' },
    });
    expect(onChange).toHaveBeenLastCalledWith('advanced');

    rerender(
      <SettingParamInput
        setting={{
          id: 'channels',
          name: 'Channels',
          type: 'option',
          value: ['sms'],
          multiple: true,
          checkbox: true,
          options: [
            { id: 'sms', name: 'SMS' },
            { id: 'voice', name: 'Voice' },
          ],
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Voice' }));
    expect(onChange).toHaveBeenLastCalledWith(['sms', 'voice']);
    fireEvent.click(screen.getByRole('checkbox', { name: 'SMS' }));
    expect(onChange).toHaveBeenLastCalledWith([]);

    rerender(
      <SettingParamInput
        setting={{
          id: 'status',
          name: 'Status',
          type: 'admonition',
          value: 'Invalid severity falls back',
          severity: 'invalid',
        }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('alert').getAttribute('data-severity')).toBe('info');
    expect(console.warn).toHaveBeenCalledWith('Invalid severity value for admonition setting');

    rerender(
      <SettingParamInput
        setting={{
          id: 'help',
          name: 'Help',
          type: 'typography',
          value: 'Markdown help',
        }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Markdown help')).toBeTruthy();

    rerender(
      <SettingParamInput
        setting={{
          id: 'domains',
          name: 'Domains',
          type: 'array',
          value: ['example.com'],
          maxItems: 2,
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onChange).toHaveBeenLastCalledWith(['example.com', '']);
    fireEvent.change(screen.getByDisplayValue('example.com'), {
      target: { value: 'ringcentral.com' },
    });
    expect(onChange).toHaveBeenLastCalledWith(['ringcentral.com']);
    fireEvent.click(screen.getByRole('button', { name: 'MockIcon' }));
    expect(onChange).toHaveBeenLastCalledWith([]);

    rerender(
      <SettingParamInput
        setting={{
          id: 'unknown',
          name: 'Unknown',
          type: 'unknown',
        }}
        onChange={onChange}
      />,
    );
    expect(container.textContent).toBe('');
  });

  it('does not emit changes for read-only inputs', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <SettingParamInput
        setting={{
          id: 'lockedBoolean',
          name: 'Locked boolean',
          type: 'boolean',
          value: false,
          readOnly: true,
          readOnlyReason: 'Policy',
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Locked boolean/ }));
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <SettingParamInput
        setting={{
          id: 'lockedString',
          name: 'Locked string',
          type: 'string',
          value: 'old',
          readOnly: true,
          description: 'Cannot edit',
        }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Locked string/), {
      target: { value: 'new' },
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('SettingSection', () => {
  it('filters conditional settings and saves changed valid settings', async () => {
    const onSave = jest.fn();
    const onBackButtonClick = jest.fn();
    const section = {
      name: 'CRM Settings',
      items: [
        {
          id: 'mode',
          name: 'Mode',
          type: 'string',
          value: 'basic',
        },
        {
          id: 'features',
          name: 'Features',
          type: 'string',
          value: 'sms,voice',
        },
        {
          id: 'count',
          name: 'Count',
          type: 'string',
          value: 5,
        },
        {
          id: 'requiredToken',
          name: 'Required token',
          type: 'string',
          value: '',
          required: true,
        },
        {
          id: 'equalItem',
          name: 'Equal item',
          type: 'string',
          value: 'shown',
          showWhen: { mode: { operator: 'equal', value: 'basic' } },
        },
        {
          id: 'notEqualItem',
          name: 'Not equal item',
          type: 'string',
          value: 'shown',
          showWhen: { mode: { operator: 'notEqual', value: 'advanced' } },
        },
        {
          id: 'containsItem',
          name: 'Contains item',
          type: 'string',
          value: 'shown',
          showWhen: { features: { operator: 'contains', value: 'sms' } },
        },
        {
          id: 'notContainsItem',
          name: 'Not contains item',
          type: 'string',
          value: 'shown',
          showWhen: { features: { operator: 'notContains', value: 'fax' } },
        },
        {
          id: 'startsWithItem',
          name: 'Starts with item',
          type: 'string',
          value: 'shown',
          showWhen: { features: { operator: 'startsWith', value: 'sms' } },
        },
        {
          id: 'endsWithItem',
          name: 'Ends with item',
          type: 'string',
          value: 'shown',
          showWhen: { features: { operator: 'endsWith', value: 'voice' } },
        },
        {
          id: 'greaterThanItem',
          name: 'Greater than item',
          type: 'string',
          value: 'shown',
          showWhen: { count: { operator: 'greaterThan', value: 4 } },
        },
        {
          id: 'lessThanItem',
          name: 'Less than item',
          type: 'string',
          value: 'shown',
          showWhen: { count: { operator: 'lessThan', value: 6 } },
        },
        {
          id: 'greaterThanOrEqualItem',
          name: 'Greater than or equal item',
          type: 'string',
          value: 'shown',
          showWhen: { count: { operator: 'greaterThanOrEqual', value: 5 } },
        },
        {
          id: 'lessThanOrEqualItem',
          name: 'Less than or equal item',
          type: 'string',
          value: 'shown',
          showWhen: { count: { operator: 'lessThanOrEqual', value: 5 } },
        },
        {
          id: 'hiddenRequired',
          name: 'Hidden required',
          type: 'string',
          value: '',
          required: true,
          showWhen: { mode: { operator: 'equal', value: 'advanced' } },
        },
        {
          id: 'unknownOperator',
          name: 'Unknown operator',
          type: 'string',
          value: 'hidden',
          showWhen: { mode: { operator: 'unknown', value: 'basic' } },
        },
      ],
    };

    render(
      <SettingSection
        section={section}
        onSave={onSave}
        onBackButtonClick={onBackButtonClick}
      />,
    );

    expect(screen.getByText('CRM Settings')).toBeTruthy();
    expect(screen.getByLabelText('Equal item')).toBeTruthy();
    expect(screen.getByLabelText('Less than or equal item')).toBeTruthy();
    expect(screen.queryByLabelText('Hidden required')).toBeNull();
    expect(screen.queryByLabelText('Unknown operator')).toBeNull();
    expect(screen.getByRole('button', { name: 'save' }).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    fireEvent.change(screen.getByLabelText('Required token'), {
      target: { value: 'token-value' },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'save' }).disabled).toBe(false);
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(onBackButtonClick).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'CRM Settings',
      items: expect.arrayContaining([
        expect.objectContaining({
          id: 'requiredToken',
          value: 'token-value',
        }),
      ]),
    }));
  });

  it('renders nothing for missing setting items', () => {
    const { container } = render(
      <SettingSection
        section={{ name: 'Empty' }}
        onSave={jest.fn()}
        onBackButtonClick={jest.fn()}
      />,
    );
    expect(container.textContent).toBe('');
  });
});
