const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    IconButton: ({ color, disabled, label, size }) =>
      ReactForMock.createElement('button', {
        'aria-label': label,
        'data-color': color,
        'data-component': 'IconButton',
        'data-size': size,
        disabled,
        type: 'button',
      }),
    List: ({ children }) =>
      ReactForMock.createElement('ul', { 'data-component': 'List' }, children),
    ListItem: ({ children, hoverActions }) =>
      ReactForMock.createElement(
        'li',
        { 'data-component': 'ListItem' },
        children,
        hoverActions,
      ),
    ListItemText: ({ primary, secondary }) =>
      ReactForMock.createElement(
        'span',
        { 'data-component': 'ListItemText' },
        primary,
        secondary,
      ),
    Text: ({ children, className }) =>
      ReactForMock.createElement('span', { className, 'data-component': 'Text' }, children),
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

const FileWidget = require('../src/Widgets/FileWidget').default;

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    hideLabel: false,
    id: 'root_file',
    label: 'Attachment',
    name: 'file',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {},
    rawErrors: [],
    readonly: false,
    registry: {},
    required: false,
    schema: {
      format: 'data-url',
      type: 'string',
    },
    value: undefined,
    ...overrides,
  };
}

describe('jsonschema-spring-page file widget', () => {
  it('renders the file label with the normal Spring UI form-field label classes', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        FileWidget,
        createWidgetProps({
          required: true,
        }),
      ),
    );

    expect(html).toContain(
      '<label class="sui-form-field-label sui-form-field-outlined-label" for="root_file">Attachment *</label>',
    );
    expect(html).not.toContain('sui-form-label-label');
  });

  it('adds the Spring UI form-field error label class when the file field has errors', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        FileWidget,
        createWidgetProps({
          rawErrors: ['Required'],
        }),
      ),
    );

    expect(html).toContain(
      'class="sui-form-field-label sui-form-field-outlined-label sui-form-field-error-label"',
    );
  });

  it('keeps the native file input hidden and does not render a bordered file input wrapper', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileWidget, createWidgetProps()),
    );

    expect(html).toContain('type="file"');
    expect(html).toContain('style="display:none"');
    expect(html).toContain('style="display:flex;align-items:center;gap:8px"');
    expect(html).not.toContain('data-component="Block"');
    expect(html).not.toContain('sui-form-field-content');
  });
});
