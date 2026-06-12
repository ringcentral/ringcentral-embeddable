const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    TextField: ({
      error,
      fullWidth,
      helperText,
      inputProps = {},
      InputLabelProps,
      label,
      ...props
    }) =>
      ReactForMock.createElement(
        'label',
        {
          'data-error': error ? 'true' : undefined,
          'data-helper-text': helperText,
          'data-label': label,
        },
        ReactForMock.createElement('input', {
          ...props,
          ...inputProps,
          'data-full-width': fullWidth ? 'true' : undefined,
          'data-label-shrink': InputLabelProps?.shrink ? 'true' : undefined,
        }),
      ),
  };
});

const BaseInputTemplate =
  require('../src/Templates/BaseInputTemplate').default;

function createBaseInputProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    formContext: {},
    hideError: false,
    hideLabel: false,
    id: 'root_field',
    label: 'Field',
    name: 'field',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {},
    placeholder: 'Enter value',
    rawErrors: [],
    readonly: false,
    registry: {},
    required: false,
    schema: {
      description: 'Helpful description',
      type: 'string',
    },
    type: 'text',
    uiSchema: {},
    value: '',
    ...overrides,
  };
}

describe('jsonschema-spring-page BaseInputTemplate', () => {
  it('preserves password input type for masked values', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseInputTemplate,
        createBaseInputProps({
          id: 'root_password',
          label: 'Password',
          name: 'password',
          placeholder: 'Enter password',
          type: 'password',
          value: 'secret',
        }),
      ),
    );
    expect(html).toContain('type="password"');
    expect(html).toContain('value="secret"');
    expect(html).not.toContain('type="text"');
  });

  it('defaults empty input type to text', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseInputTemplate,
        createBaseInputProps({
          type: undefined,
        }),
      ),
    );
    expect(html).toContain('type="text"');
  });

  it('uses number input type for integer schemas', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseInputTemplate,
        createBaseInputProps({
          schema: {
            type: 'integer',
          },
          type: 'text',
          value: 42,
        }),
      ),
    );
    expect(html).toContain('type="number"');
    expect(html).toContain('step="1"');
    expect(html).toContain('value="42"');
  });

  it('uses number input type for number schemas', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseInputTemplate,
        createBaseInputProps({
          schema: {
            type: 'number',
          },
          type: 'text',
          value: 12.5,
        }),
      ),
    );
    expect(html).toContain('type="number"');
    expect(html).toContain('step="any"');
    expect(html).toContain('value="12.5"');
  });

  it('preserves date input type for date widgets', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseInputTemplate,
        createBaseInputProps({
          schema: {
            format: 'date',
            type: 'string',
          },
          type: 'date',
          value: '2026-04-15',
        }),
      ),
    );
    expect(html).toContain('type="date"');
    expect(html).toContain('value="2026-04-15"');
    expect(html).not.toContain('type="text"');
  });

  it('preserves datetime-local input type for datetime widgets', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseInputTemplate,
        createBaseInputProps({
          schema: {
            format: 'date-time',
            type: 'string',
          },
          type: 'datetime-local',
          value: '2026-04-15T09:30',
        }),
      ),
    );
    expect(html).toContain('type="datetime-local"');
    expect(html).toContain('value="2026-04-15T09:30"');
    expect(html).not.toContain('type="text"');
  });

  it('uses Spring UI TextField helper text for field errors', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseInputTemplate,
        createBaseInputProps({
          rawErrors: ['Must be at least 3 characters long'],
        }),
      ),
    );
    expect(html).toContain('data-error="true"');
    expect(html).toContain('data-helper-text="Must be at least 3 characters long"');
    expect(html).not.toContain('Helpful description');
  });

  it('does not duplicate schema description as TextField helper text', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseInputTemplate, createBaseInputProps()),
    );
    expect(html).not.toContain('data-error="true"');
    expect(html).not.toContain('data-helper-text=');
  });
});
