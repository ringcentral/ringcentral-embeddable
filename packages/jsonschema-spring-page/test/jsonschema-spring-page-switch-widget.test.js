const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Link: ({ children, ...props }) =>
      ReactForMock.createElement('a', props, children),
    Switch: ({
      checked,
      className,
      disabled,
      inputProps = {},
      onChange,
      required,
      rootProps = {},
    }) =>
      ReactForMock.createElement(
        'span',
        {
          ...rootProps,
          className,
          'data-component': 'Switch',
        },
        ReactForMock.createElement('input', {
          ...inputProps,
          checked,
          disabled,
          onChange,
          required,
          type: 'checkbox',
        }),
        ReactForMock.createElement('span', { className: 'sui-switch-track' }),
        ReactForMock.createElement('span', { className: 'sui-switch-dot' }),
      ),
    Text: ({
      children,
      className,
      component: Component = 'span',
      style,
      ...props
    }) =>
      ReactForMock.createElement(
        Component,
        {
          ...props,
          'data-text-color': style?.color,
          'data-text-class': className,
        },
        children,
      ),
  };
});

jest.mock('@ringcentral/spring-icon', () => {
  const IconMock = () => null;
  IconMock.displayName = 'IconMock';
  return {
    AttachMd: IconMock,
    TrashMd: IconMock,
  };
});

jest.mock('@ringcentral-integration/rjsf-spring', () => ({
  generateWidgets: () => ({}),
}));

const SwitchWidget = require('../src/Widgets/SwitchWidget').default;
const CheckboxWidget = require('../src/Widgets/CheckboxWidget').default;
const BooleanField = require('../src/Fields/BooleanField').default;
const { widgets } = require('../src/Widgets');

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    formContext: {},
    hideError: false,
    hideLabel: false,
    id: 'root_notifications',
    label: 'Push Notifications',
    name: 'notifications',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {},
    readonly: false,
    registry: {},
    required: false,
    schema: {
      description: 'Allow push notifications',
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
    formData: false,
    hideError: false,
    idSchema: {
      $id: 'root_notifications',
    },
    name: 'notifications',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    rawErrors: [],
    readonly: false,
    registry: {
      formContext: {},
      translateString: (value) => String(value),
      widgets,
    },
    required: false,
    schema: {
      description: 'Allow push notifications',
      title: 'Push Notifications',
      type: 'boolean',
    },
    title: 'Push Notifications',
    uiSchema: {},
    ...overrides,
  };
}

describe('jsonschema-spring-page SwitchWidget', () => {
  it('renders a JUNO-style label and description with Spring UI Switch on the right', () => {
    const html = renderToStaticMarkup(
      React.createElement(SwitchWidget, createWidgetProps()),
    );
    expect(html).toContain('class="flex w-full items-center justify-between gap-3"');
    expect(html).toContain('for="root_notifications"');
    expect(html).toContain('data-text-class="typography-mainText"');
    expect(html).toContain('Push Notifications');
    expect(html).toContain('id="root_notifications__description"');
    expect(html).toContain('data-text-class="typography-descriptor"');
    expect(html).toContain('data-text-color="var(--sui-colors-neutral-b2)"');
    expect(html).toContain('Allow push notifications');
    expect(html).toContain('data-component="Switch"');
    expect(html).toContain('--tw-translate-y:0');
    expect(html).toContain('--tw-scale-x:1');
    expect(html).toContain('id="root_notifications"');
    expect(html).toContain('name="notifications"');
    expect(html.indexOf('Push Notifications')).toBeLessThan(
      html.indexOf('data-component="Switch"'),
    );
  });

  it('uses aria-label when the visual label is hidden', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        SwitchWidget,
        createWidgetProps({
          hideLabel: true,
        }),
      ),
    );
    expect(html).not.toContain('for="root_notifications"');
    expect(html).toContain('aria-label="Push Notifications"');
    expect(html).toContain('data-component="Switch"');
  });

  it('registers switch and toggle widget aliases', () => {
    expect(widgets.SwitchWidget).toBe(SwitchWidget);
    expect(widgets.switch).toBe(SwitchWidget);
    expect(widgets.toggle).toBe(SwitchWidget);
    expect(widgets.CheckboxWidget).toBe(CheckboxWidget);
    expect(widgets.checkbox).toBe(CheckboxWidget);
  });

  it('uses switch as the default boolean field widget', () => {
    const html = renderToStaticMarkup(
      React.createElement(BooleanField, createBooleanFieldProps()),
    );
    expect(html).toContain('data-component="Switch"');
    expect(html).toContain('Push Notifications');
  });
});
