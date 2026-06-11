const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { optionId } = require('@rjsf/utils');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Block: ({ children, id, row }) =>
      ReactForMock.createElement(
        'div',
        {
          id,
          'data-row': row ? 'true' : 'false',
        },
        children,
      ),
    Checkbox: ({ checked, inputProps = {} }) =>
      ReactForMock.createElement('input', {
        ...inputProps,
        defaultChecked: checked,
        type: 'checkbox',
      }),
    FormLabel: ({ children, id, label }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-form-label-id': id,
        },
        children,
        ReactForMock.createElement('label', { htmlFor: id }, label),
      ),
  };
});

const CheckboxWidget =
  require('../src/Widgets/CheckboxWidget').default;
const CheckboxesWidget =
  require('../src/Widgets/CheckboxesWidget').default;

function createRegistry() {
  return {
    templates: {
      DescriptionFieldTemplate: ({ description, id }) =>
        React.createElement('p', { id }, description),
    },
  };
}

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    formContext: {},
    hideError: false,
    hideLabel: false,
    id: 'root_enabled',
    label: 'Enable feature',
    name: 'enabled',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {},
    readonly: false,
    registry: createRegistry(),
    required: false,
    schema: {
      type: 'boolean',
    },
    uiSchema: {},
    value: false,
    ...overrides,
  };
}

describe('jsonschema-spring-page checkbox widgets', () => {
  it('associates the boolean checkbox label with the input id', () => {
    const html = renderToStaticMarkup(
      React.createElement(CheckboxWidget, createWidgetProps()),
    );
    expect(html).toContain('data-form-label-id="root_enabled"');
    expect(html).toContain('id="root_enabled"');
    expect(html).toContain('for="root_enabled"');
    expect(html).toContain('Enable feature');
  });

  it('associates each checkbox group option label with its input id', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CheckboxesWidget,
        createWidgetProps({
          id: 'root_features',
          label: 'Features',
          options: {
            enumOptions: [
              {
                label: 'Advanced Analytics',
                value: 'analytics',
              },
              {
                label: 'API Access',
                value: 'api',
              },
            ],
          },
          schema: {
            items: {
              enum: ['analytics', 'api'],
              type: 'string',
            },
            type: 'array',
            uniqueItems: true,
          },
          value: ['analytics'],
        }),
      ),
    );
    const firstOptionId = optionId('root_features', 0);
    const secondOptionId = optionId('root_features', 1);

    expect(html).toContain(`data-form-label-id="${firstOptionId}"`);
    expect(html).toContain(`for="${firstOptionId}"`);
    expect(html).toContain(`id="${firstOptionId}"`);
    expect(html).toContain('value="0"');
    expect(html).toContain(`data-form-label-id="${secondOptionId}"`);
    expect(html).toContain(`for="${secondOptionId}"`);
    expect(html).toContain(`id="${secondOptionId}"`);
    expect(html).toContain('value="1"');
  });
});
