const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Textarea: ({
      clearBtn,
      fullWidth,
      id,
      inputProps,
      maxRows,
      minRows,
      rows,
      size,
      value,
      variant,
    }) =>
      ReactForMock.createElement('textarea', {
        ...inputProps,
        'data-clear-btn': clearBtn === false ? 'false' : undefined,
        'data-full-width': fullWidth ? 'true' : undefined,
        'data-id': id,
        'data-max-rows': maxRows,
        'data-min-rows': minRows,
        'data-rows': rows,
        'data-size': size,
        'data-value': value,
        'data-variant': variant,
      }),
  };
});

jest.mock('@ringcentral/spring-icon', () => {
  const IconMock = () => null;
  IconMock.displayName = 'IconMock';
  return {
    AddMd: IconMock,
    AttachMd: IconMock,
    CalendarMd: IconMock,
    CaretDownMd: IconMock,
    CaretUpMd: IconMock,
    ClockMd: IconMock,
    CloseMd: IconMock,
    DeleteMd: IconMock,
    SearchMd: IconMock,
    TrashMd: IconMock,
  };
});

jest.mock('@ringcentral-integration/rjsf-spring', () => ({
  generateWidgets: () => {
    const ReactForMock = require('react');
    return {
      TextareaWidget: () =>
        ReactForMock.createElement('div', { 'data-generated-textarea': 'true' }),
    };
  },
}));

const TextareaWidget = require('../src/Widgets/TextareaWidget').default;
const { widgets } = require('../src/Widgets');

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    formContext: {},
    hideError: false,
    hideLabel: false,
    id: 'root_description',
    label: 'Description',
    name: 'description',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {
      rows: 5,
    },
    readonly: false,
    registry: {},
    required: false,
    schema: {
      type: 'string',
    },
    uiSchema: {},
    value: 'Product details',
    ...overrides,
  };
}

describe('jsonschema-spring-page TextareaWidget', () => {
  it('renders Spring UI Textarea with large size', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextareaWidget, createWidgetProps()),
    );

    expect(html).toContain('data-id="root_description"');
    expect(html).toContain('data-sign="description"');
    expect(html).toContain('data-size="large"');
    expect(html).toContain('data-variant="outlined"');
    expect(html).toContain('data-full-width="true"');
    expect(html).toContain('data-rows="5"');
    expect(html).toContain('data-min-rows="4"');
    expect(html).toContain('data-max-rows="12"');
    expect(html).toContain('data-clear-btn="false"');
  });

  it('overrides the generated Spring textarea widget registration', () => {
    expect(widgets.TextareaWidget).toBe(TextareaWidget);
    expect(widgets.textarea).toBe(TextareaWidget);
  });
});
