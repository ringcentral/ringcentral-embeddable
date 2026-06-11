const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-icon', () => ({
  SearchMd: () => null,
}));

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  const IconButton = ReactForMock.forwardRef(
    ({ background, children, shape, TooltipProps, ...props }, ref) =>
      ReactForMock.createElement(
        'button',
        {
          ...props,
          ref,
          title: TooltipProps?.title,
        },
        children,
      ),
  );
  return {
    ExpandCollapseCaret: ({ expanded }) =>
      ReactForMock.createElement('span', {
        'data-expanded': expanded ? 'true' : 'false',
      }),
    Icon: ({ size }) =>
      ReactForMock.createElement('span', {
        'data-icon-size': size,
      }),
    IconButton,
    Menu: ({ children, open }) =>
      open ? ReactForMock.createElement('div', { role: 'menu' }, children) : null,
    MenuItem: ({ children, selected, title }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-selected': selected ? 'true' : 'false',
          title,
        },
        children,
      ),
    MenuList: ({ children }) =>
      ReactForMock.createElement('div', { role: 'list' }, children),
    TextField: ({
      disabled,
      fullWidth,
      inputProps = {},
      onChange,
      placeholder,
      RootProps,
      size,
      startAdornment,
      value,
      variant,
    }) =>
      ReactForMock.createElement(
        'label',
        {
          'data-content-class': RootProps?.classes?.content,
          'data-focus-class': RootProps?.classes?.focusEffect,
          'data-full-width': fullWidth ? 'true' : 'false',
          'data-size': size,
          'data-variant': variant,
        },
        startAdornment,
        ReactForMock.createElement('input', {
          ...inputProps,
          disabled,
          onChange,
          placeholder,
          value,
        }),
      ),
  };
});

const { Search } = require('../src/Fields/Search');

function renderSearch(overrides = {}) {
  return renderToStaticMarkup(
    React.createElement(Search, {
      disabled: false,
      formData: '',
      onChange: jest.fn(),
      uiSchema: {},
      ...overrides,
    }),
  );
}

describe('jsonschema-spring-page Search field', () => {
  it('renders standalone search as the expanded standard Spring UI input', () => {
    const html = renderSearch({
      formData: 'desk',
      uiSchema: {
        'ui:placeholder': 'Search everything...',
      },
    });
    expect(html).toContain('data-sign="jsonSchemaSearchInput"');
    expect(html).toContain('data-variant="standard"');
    expect(html).toContain('data-size="medium"');
    expect(html).toContain('data-content-class="border-none"');
    expect(html).toContain('value="desk"');
    expect(html).not.toContain('jsonSchemaSearchAndFilter');
  });

  it('renders filtered search with the Call HUD compact toolbar shape', () => {
    const html = renderSearch({
      formData: {
        filter: 'All',
        search: '',
      },
      uiSchema: {
        'ui:filters': ['All', 'Type A', 'Type B', 'Type C'],
        'ui:placeholder': 'Search with filters...',
      },
    });
    expect(html).toContain('data-sign="jsonSchemaSearchAndFilter"');
    expect(html).toContain('flex items-center gap-2 px-3 py-1');
    expect(html).toContain('data-sign="jsonSchemaSearchInput-button"');
    expect(html).toContain('data-sign="jsonSchemaTypeFilter"');
    expect(html).toContain('sui-single-filter sui-single-filter-root');
    expect(html).toContain('filter-All');
    expect(html).toContain('filter-Type A');
    expect(html).toContain('jsonSchemaFilterExpand');
    expect(html).not.toContain('filter-Type B');
  });

  it('shows only the active filter when search starts expanded', () => {
    const html = renderSearch({
      formData: {
        filter: 'Type C',
        search: 'alice',
      },
      uiSchema: {
        'ui:filters': ['All', 'Type A', 'Type B', 'Type C'],
      },
    });
    expect(html).toContain('data-sign="jsonSchemaSearchInput"');
    expect(html).toContain('value="alice"');
    expect(html).toContain('filter-Type C');
    expect(html).not.toContain('jsonSchemaSearchInput-button');
    expect(html).not.toContain('filter-All');
    expect(html).not.toContain('filter-Type A');
  });
});
