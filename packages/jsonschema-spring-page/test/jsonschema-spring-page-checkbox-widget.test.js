const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { optionId } = require('@rjsf/utils');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Checkbox: ({ checked, inputProps = {} }) =>
      ReactForMock.createElement('input', {
        ...inputProps,
        defaultChecked: checked,
        type: 'checkbox',
      }),
    FormLabel: ({ children, id, label, rootProps = {} }) =>
      ReactForMock.createElement(
        'div',
        {
          ...rootProps,
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
const BooleanField = require('../src/Fields/BooleanField').default;

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

function createBooleanFieldProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    formData: true,
    hideError: false,
    idSchema: {
      $id: 'root_enabled',
    },
    name: 'enabled',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    rawErrors: [],
    readonly: false,
    registry: {
      formContext: {},
      templates: {
        DescriptionFieldTemplate: ({ description, id }) =>
          React.createElement('p', { id }, description),
      },
      translateString: (value) => String(value),
      widgets: {
        checkbox: CheckboxWidget,
        CheckboxWidget,
      },
    },
    required: false,
    schema: {
      title: 'Enable feature',
      type: 'boolean',
    },
    title: 'Enable feature',
    uiSchema: {
      'ui:widget': 'checkbox',
    },
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

  it('uses checkbox as the explicit boolean checkbox widget alias', () => {
    const html = renderToStaticMarkup(
      React.createElement(BooleanField, createBooleanFieldProps()),
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
    expect(html).toContain('Features');
    expect(html).toContain('style="margin-bottom:var(--sui-spacing-2)"');
    expect(html).toContain('class="flex flex-col gap-2"');
  });

  it('renders checkbox group items inline when inline option is enabled', () => {
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
            inline: true,
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

    expect(html).toContain('class="flex flex-wrap gap-x-4 gap-y-2"');
  });
});
