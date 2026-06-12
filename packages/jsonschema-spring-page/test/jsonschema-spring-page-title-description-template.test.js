const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-icon', () => {
  const IconMock = () => null;
  IconMock.displayName = 'IconMock';
  return {
    CaretDownMd: IconMock,
    CaretUpMd: IconMock,
  };
});

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Divider: () => ReactForMock.createElement('hr'),
    Icon: () => ReactForMock.createElement('span'),
    Link: ({ children, ...props }) =>
      ReactForMock.createElement('a', props, children),
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
          'data-text-class': className,
          'data-text-color': style?.color,
        },
        children,
      ),
  };
});

const DescriptionField =
  require('../src/Templates/DescriptionField').default;
const FieldTemplate =
  require('../src/Templates/FieldTemplate').default;
const FieldHelpTemplate =
  require('../src/Templates/FieldHelpTemplate').default;
const TitleField =
  require('../src/Templates/TitleField').default;

function createFieldTemplateProps(overrides = {}) {
  return {
    children: React.createElement('input', { id: 'root_notifications' }),
    classNames: 'field field-boolean',
    disabled: false,
    displayLabel: true,
    errors: null,
    help: null,
    hidden: false,
    id: 'root_notifications',
    label: 'Push Notifications',
    onDropPropertyClick: jest.fn(),
    onKeyChange: jest.fn(),
    readonly: false,
    rawDescription: 'Allow push notifications',
    registry: {
      templates: {
        WrapIfAdditionalTemplate: ({ children }) =>
          React.createElement('section', { 'data-wrap': 'true' }, children),
      },
    },
    required: false,
    schema: {
      type: 'boolean',
    },
    style: {},
    uiSchema: {},
    ...overrides,
  };
}

describe('jsonschema-spring-page title and description templates', () => {
  it('uses Spring UI palette variables for description text', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionField, {
        description: 'Helpful description',
        id: 'root_description',
        uiSchema: {},
      }),
    );
    expect(html).toContain('data-text-color="var(--sui-colors-neutral-b2)"');
  });

  it('uses Spring UI palette variables for disabled title and description text', () => {
    const descriptionHtml = renderToStaticMarkup(
      React.createElement(DescriptionField, {
        description: 'Disabled description',
        id: 'root_description',
        uiSchema: {
          'ui:disabled': true,
        },
      }),
    );
    const titleHtml = renderToStaticMarkup(
      React.createElement(TitleField, {
        id: 'root_title',
        title: 'Disabled title',
        uiSchema: {
          'ui:disabled': true,
        },
      }),
    );
    expect(descriptionHtml).toContain(
      'data-text-color="var(--sui-colors-neutral-b3)"',
    );
    expect(titleHtml).toContain(
      'data-text-color="var(--sui-colors-neutral-b3)"',
    );
  });

  it('uses Spring UI descriptor typography for field help text', () => {
    const html = renderToStaticMarkup(
      React.createElement(FieldHelpTemplate, {
        help: 'Only alphabetic characters are allowed',
        idSchema: {
          $id: 'root_patternText',
        },
      }),
    );
    expect(html).toContain('id="root_patternText__help"');
    expect(html).toContain('class="typography-descriptor"');
    expect(html).toContain('data-text-color="var(--sui-colors-neutral-b2)"');
    expect(html).toContain('Only alphabetic characters are allowed');
  });

  it('renders normal field descriptions after the widget', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        FieldTemplate,
        createFieldTemplateProps({
          description: React.createElement(
            'span',
            { 'data-field-description': 'true' },
            'Allow push notifications',
          ),
          schema: {
            type: 'string',
          },
        }),
      ),
    );
    expect(html).toContain('data-field-description="true"');
    expect(html).toContain('data-text-class="typography-mainText"');
  });

  it('does not render duplicate field descriptions for switch widgets', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        FieldTemplate,
        createFieldTemplateProps({
          children: React.createElement(
            'div',
            { 'data-switch-row': 'true' },
            'Allow push notifications',
          ),
          description: React.createElement(
            'span',
            { 'data-field-description': 'true' },
            'Allow push notifications',
          ),
          uiSchema: {
            'ui:widget': 'switch',
          },
        }),
      ),
    );
    expect(html).toContain('data-switch-row="true"');
    expect(html).not.toContain('data-field-description="true"');
  });

  it('does not render duplicate field descriptions for default boolean widgets', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        FieldTemplate,
        createFieldTemplateProps({
          children: React.createElement(
            'div',
            { 'data-switch-row': 'true' },
            'Allow push notifications',
          ),
          description: React.createElement(
            'span',
            { 'data-field-description': 'true' },
            'Allow push notifications',
          ),
        }),
      ),
    );
    expect(html).toContain('data-switch-row="true"');
    expect(html).not.toContain('data-field-description="true"');
  });
});
