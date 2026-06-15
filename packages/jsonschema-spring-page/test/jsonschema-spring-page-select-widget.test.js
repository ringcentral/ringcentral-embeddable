const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    MenuItemText: ({ info, primary }) =>
      ReactForMock.createElement(
        'span',
        {
          'data-menu-item-info': info,
        },
        primary,
      ),
    Option: ({ children, disabled, value }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-disabled': disabled ? 'true' : 'false',
          'data-option-value': value,
        },
        children,
      ),
    Select: ({
      'aria-describedby': ariaDescribedBy,
      children,
      'data-sign': dataSign,
      disabled,
      error,
      focused,
      formContext,
      hideError,
      id,
      label,
      name,
      placeholder,
      registry,
      renderValue,
      required,
      schema,
      selectMode,
      size,
      uiSchema,
      value,
      variant,
    }) =>
      ReactForMock.createElement(
        'div',
        {
          'aria-describedby': ariaDescribedBy,
          'data-disabled': disabled ? 'true' : 'false',
          'data-error': error ? 'true' : 'false',
          'data-focused': focused ? 'true' : 'false',
          'data-label': label,
          'data-placeholder': placeholder,
          'data-required': required ? 'true' : 'false',
          'data-select-mode': selectMode,
          'data-sign': dataSign,
          'data-size': size,
          'data-value': JSON.stringify(value),
          'data-variant': variant,
          id,
          name,
        },
        children,
      ),
  };
});

const SelectWidget = require('../src/Widgets/SelectWidget').default;

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    formContext: {},
    hideError: false,
    hideLabel: false,
    id: 'root_country',
    label: 'Country',
    multiple: false,
    name: 'country',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {
      enumOptions: [
        {
          label: 'United States',
          value: 'us',
        },
        {
          label: 'Canada',
          value: 'ca',
        },
      ],
    },
    placeholder: 'Choose a country',
    rawErrors: [],
    readonly: false,
    registry: {},
    required: false,
    schema: {
      enum: ['us', 'ca'],
      type: 'string',
    },
    uiSchema: {},
    value: 'us',
    ...overrides,
  };
}

describe('jsonschema-spring-page SelectWidget', () => {
  it('uses Spring UI large size by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(SelectWidget, createWidgetProps()),
    );
    expect(html).toContain('data-size="large"');
    expect(html).toContain('data-variant="outlined"');
    expect(html).toContain('data-select-mode="single"');
    expect(html).toContain('United States');
  });
});
