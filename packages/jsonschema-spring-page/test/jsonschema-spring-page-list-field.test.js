const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-icon', () => {
  const createIcon = (name) => {
    const IconMock = () => null;
    IconMock.displayName = name;
    return IconMock;
  };
  return {
    AddCommentMd: createIcon('AddCommentMd'),
    AlertMd: createIcon('AlertMd'),
    ArrowRightMd: createIcon('ArrowRightMd'),
    CallMd: createIcon('CallMd'),
    CheckMd: createIcon('CheckMd'),
    ConnectorMd: createIcon('ConnectorMd'),
    ContactsMd: createIcon('ContactsMd'),
    CopyMd: createIcon('CopyMd'),
    DetailsMd: createIcon('DetailsMd'),
    DownloadMd: createIcon('DownloadMd'),
    EditMd: createIcon('EditMd'),
    InfoMd: createIcon('InfoMd'),
    LinkMd: createIcon('LinkMd'),
    MarkReadMd: createIcon('MarkReadMd'),
    MarkUnreadMd: createIcon('MarkUnreadMd'),
    OverflowVerticalMd: createIcon('OverflowVerticalMd'),
    RefreshMd: createIcon('RefreshMd'),
    SettingsMd: createIcon('SettingsMd'),
    ShareMd: createIcon('ShareMd'),
    Smsmd: createIcon('Smsmd'),
    TrashMd: createIcon('TrashMd'),
    ViewMd: createIcon('ViewMd'),
  };
});

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Avatar: ({ alt, children, size, src, symbol, variant }) =>
      ReactForMock.createElement(
        'span',
        {
          'data-avatar-alt': alt,
          'data-avatar-size': size,
          'data-avatar-src': src,
          'data-avatar-symbol': symbol?.displayName || symbol?.name,
          'data-avatar-variant': variant,
        },
        children,
      ),
    Block: ({ children }) => ReactForMock.createElement('div', null, children),
    Button: ({ children }) => ReactForMock.createElement('button', null, children),
    Icon: ({ size, symbol }) =>
      ReactForMock.createElement('span', {
        'data-icon-size': size,
        'data-icon-symbol': symbol?.displayName || symbol?.name,
      }),
    IconButton: ({ label, symbol }) =>
      ReactForMock.createElement(
        'button',
        {
          'data-icon-button-symbol': symbol?.displayName || symbol?.name,
        },
        label,
      ),
    Link: ({ children, href }) =>
      ReactForMock.createElement('a', { href }, children),
    List: ({ children }) => ReactForMock.createElement('div', { role: 'list' }, children),
    ListItem: ({ children, selected }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-selected': selected ? 'true' : 'false',
          role: 'listitem',
        },
        children,
      ),
    ListItemText: ({ primary, secondary }) =>
      ReactForMock.createElement('div', null, primary, secondary),
    Menu: ({ children, open }) =>
      open ? ReactForMock.createElement('div', { role: 'menu' }, children) : null,
    MenuItem: ({ children }) => ReactForMock.createElement('div', null, children),
    MenuItemText: ({ primary }) => ReactForMock.createElement('span', null, primary),
    Text: ({ children }) => ReactForMock.createElement('span', null, children),
    Tooltip: ({ children }) => ReactForMock.createElement('span', null, children),
  };
});

const { List } = require('../src/Fields/List');

function renderList({ items, uiSchema = {}, formData = 'first' }) {
  return renderToStaticMarkup(
    React.createElement(List, {
      disabled: false,
      formData,
      onChange: jest.fn(),
      onFocus: jest.fn(),
      schema: {
        oneOf: items,
      },
      uiSchema,
    }),
  );
}

describe('jsonschema-spring-page List field', () => {
  it('renders image URL icons through Spring UI Avatar src', () => {
    const html = renderList({
      items: [
        {
          const: 'react',
          description: 'A JavaScript library',
          icon: 'https://example.com/react.svg',
          title: 'React',
        },
      ],
      uiSchema: {
        'ui:showIconAsAvatar': true,
      },
      formData: 'react',
    });
    expect(html).toContain('data-avatar-src="https://example.com/react.svg"');
    expect(html).toContain('data-avatar-size="medium"');
    expect(html).toContain('data-avatar-variant="circle"');
    expect(html).not.toContain('data-avatar-symbol');
  });

  it('renders Spring icon keys through Spring UI Avatar symbol', () => {
    const html = renderList({
      items: [
        {
          const: 'phone',
          description: 'Call this contact',
          icon: 'phone',
          title: 'Phone',
        },
      ],
      uiSchema: {
        'ui:showIconAsAvatar': false,
      },
      formData: 'phone',
    });
    expect(html).toContain('data-avatar-symbol="CallMd"');
    expect(html).toContain('data-avatar-variant="squircle"');
    expect(html).not.toContain('data-avatar-src');
  });

  it('renders author avatar as the row avatar fallback when no icon is provided', () => {
    const html = renderList({
      items: [
        {
          authorAvatar: 'https://example.com/ada.png',
          authorName: 'Ada Lovelace',
          const: 'ada',
          description: 'First programmer',
          title: 'Ada',
        },
      ],
      formData: 'ada',
    });
    expect(html).toContain('data-avatar-src="https://example.com/ada.png"');
    expect(html).toContain('data-avatar-alt="Ada Lovelace"');
    expect(html).toContain('AL');
  });
});
