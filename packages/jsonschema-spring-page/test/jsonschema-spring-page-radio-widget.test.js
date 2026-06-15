const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    FormLabel: ({ children, disabled, id, label, rootProps = {}, value }) =>
      ReactForMock.createElement(
        'label',
        {
          'data-component': 'FormLabel',
          'data-disabled': disabled ? 'true' : 'false',
          'data-id': id,
          'data-value': value,
          htmlFor: id,
          ...rootProps,
        },
        children,
        label,
      ),
    Radio: jest.fn(({ name, rootProps = {} }) =>
      ReactForMock.createElement('input', {
        'data-component': 'Radio',
        name,
        type: 'radio',
        ...rootProps,
      })),
    RadioGroup: ({ children, id, name, onChange, row, value }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-component': 'RadioGroup',
          'data-has-on-change': typeof onChange === 'function' ? 'true' : 'false',
          'data-row': row ? 'true' : 'false',
          'data-value': value,
          id,
          name,
        },
        children,
      ),
    Tab: ({ disabled, id, label, value }) =>
      ReactForMock.createElement(
        'button',
        {
          'data-component': 'Tab',
          'data-disabled': disabled ? 'true' : 'false',
          'data-value': value,
          id,
          type: 'button',
        },
        label,
      ),
    TabContext: jest.fn(({ children, onChange, value }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-component': 'TabContext',
          'data-has-on-change': typeof onChange === 'function' ? 'true' : 'false',
          'data-value': value,
        },
        children,
      )),
    Tabs: ({ children, onChange, size, value, variant }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-component': 'Tabs',
          'data-has-on-change': typeof onChange === 'function' ? 'true' : 'false',
          'data-size': size,
          'data-value': value,
          'data-variant': variant,
        },
        children,
      ),
  };
});

const { Radio, TabContext } = require('@ringcentral/spring-ui');
const RadioWidget = require('../src/Widgets/RadioWidget').default;

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    hideLabel: false,
    id: 'root_priority',
    label: 'Priority',
    name: 'priority',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {
      enumOptions: [
        {
          label: 'Low Priority',
          value: 'low',
        },
        {
          label: 'Medium Priority',
          value: 'medium',
        },
        {
          label: 'High Priority',
          value: 'high',
        },
      ],
    },
    readonly: false,
    registry: {},
    required: false,
    schema: {
      enum: ['low', 'medium', 'high'],
      type: 'string',
    },
    uiSchema: {},
    value: 'medium',
    ...overrides,
  };
}

describe('jsonschema-spring-page RadioWidget', () => {
  beforeEach(() => {
    Radio.mockClear();
    TabContext.mockClear();
  });

  it('renders tab mode with Spring UI TabContext around Tabs', () => {
    const props = createWidgetProps({
      id: 'root_tab',
      label: 'Tab',
      options: {
        enumOptions: [
          {
            label: 'Tab 1',
            value: 'tab1',
          },
          {
            label: 'Tab 2',
            value: 'tab2',
          },
        ],
      },
      uiSchema: {
        'ui:tab': true,
      },
      value: 'tab1',
    });
    const html = renderToStaticMarkup(
      React.createElement(RadioWidget, props),
    );

    expect(html).toContain('data-component="TabContext"');
    expect(html).toContain('data-value="0"');
    expect(html).toContain('data-component="Tabs"');
    expect(html).toContain('data-has-on-change="false"');
    expect(html).toContain('id="root_tab__tab-0"');
    expect(html).toContain('Tab 1');
    expect(html).toContain('Tab 2');

    const tabContextProps = TabContext.mock.calls[0][0];
    tabContextProps.onChange(null, '1');

    expect(props.onChange).toHaveBeenCalledWith('tab2');
  });

  it('renders regular radio groups with Spring UI FormLabel label prop and label gap', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        RadioWidget,
        createWidgetProps({
          options: {
            enumOptions: [
              {
                label: 'Low Priority',
                value: 'low',
              },
              {
                label: 'Medium Priority',
                value: 'medium',
              },
            ],
            inline: true,
          },
          required: true,
        }),
      ),
    );

    expect(html).toContain('data-component="FormLabel"');
    expect(html).toContain('Priority *');
    expect(html).toContain('style="margin-bottom:var(--sui-spacing-2)"');
    expect(html).toContain('data-component="RadioGroup"');
    expect(html).toContain('data-row="true"');
    expect(html).toContain('data-value="1"');
    expect(html).toContain('Low Priority');
    expect(html).toContain('Medium Priority');
  });

  it('uses oneOf schema color for Spring UI Radio checked dot variables', () => {
    renderToStaticMarkup(
      React.createElement(
        RadioWidget,
        createWidgetProps({
          options: {
            enumOptions: [
              {
                label: 'Neutral',
                schema: {
                  color: '#939393',
                },
                value: 'neutral',
              },
              {
                label: 'Yellow',
                schema: {
                  color: '#B17D1A',
                },
                value: 'yellow',
              },
            ],
          },
          value: 'yellow',
        }),
      ),
    );

    expect(Radio.mock.calls[0][0].rootProps.style).toMatchObject({
      '--s-primary-f': '147, 147, 147',
      '--s-primary-f-high-contrast': '147, 147, 147',
      '--s-primary-f-opacity': '1',
      '--s-primary-f-high-contrast-opacity': '1',
      borderColor: '#939393',
    });
    expect(Radio.mock.calls[1][0].rootProps.style).toMatchObject({
      '--s-primary-f': '177, 125, 26',
      '--s-primary-f-high-contrast': '177, 125, 26',
      '--s-primary-f-opacity': '1',
      '--s-primary-f-high-contrast-opacity': '1',
      borderColor: '#B17D1A',
    });
  });
});
