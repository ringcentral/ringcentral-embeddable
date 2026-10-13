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
    Block: ({ children, className }) =>
      ReactForMock.createElement('div', { 'data-block-class': className }, children),
    Button: ({ children, color, size, variant }) =>
      ReactForMock.createElement(
        'button',
        {
          'data-button-color': color,
          'data-button-size': size,
          'data-button-variant': variant,
        },
        children,
      ),
    Icon: ({ size, style, symbol }) =>
      ReactForMock.createElement('span', {
        'data-icon-color': style?.color,
        'data-icon-size': size,
        'data-icon-symbol': symbol?.displayName || symbol?.name,
      }),
    IconButton: ({ className, label, shape, size, symbol, variant }) =>
      ReactForMock.createElement(
        'button',
        {
          className,
          'data-icon-button-shape': shape,
          'data-icon-button-size': size,
          'data-icon-button-symbol': symbol?.displayName || symbol?.name,
          'data-icon-button-variant': variant,
        },
        label,
      ),
    Link: ({ children, href }) =>
      ReactForMock.createElement('a', { href }, children),
    List: ({ children, style }) =>
      ReactForMock.createElement('div', { role: 'list', style }, children),
    ListItem: ({
      alwaysShowHoverActions,
      children,
      className,
      classes,
      hoverActions,
      selected,
      size,
    }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-always-show-hover-actions': alwaysShowHoverActions ? 'true' : undefined,
          'data-content-class': classes?.content,
          'data-has-hover-actions': hoverActions ? 'true' : undefined,
          'data-list-item-class': className,
          'data-list-item-size': size,
          'data-selected': selected ? 'true' : 'false',
          role: 'listitem',
        },
        children,
        hoverActions,
      ),
    ListItemText: ({ className, primary, secondary }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-list-item-text-class': className,
        },
        primary,
        secondary,
      ),
    Menu: ({ children, open }) =>
      open ? ReactForMock.createElement('div', { role: 'menu' }, children) : null,
    MenuItem: ({ children }) => ReactForMock.createElement('div', null, children),
    MenuItemText: ({ primary }) => ReactForMock.createElement('span', null, primary),
    Text: ({ children, style }) =>
      ReactForMock.createElement(
        'span',
        { 'data-text-color': style?.color },
        children,
      ),
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
    expect(html).toContain('class="flex shrink-0 items-center"');
    expect(html).not.toContain('mr-3');
    expect(html).not.toContain('data-avatar-symbol');
  });

  it('uses the same Spring UI list item sizing and padding as meeting rows', () => {
    const html = renderList({
      items: [
        {
          const: 'urgent',
          description: 'Needs immediate attention',
          title: 'Urgent',
        },
      ],
      formData: 'urgent',
    });
    expect(html).toContain('data-list-item-size="auto"');
    expect(html).toContain('data-list-item-class="group rounded-xl"');
    expect(html).toContain('data-content-class="bg-inherit !px-3 !py-2"');
    expect(html).toContain('data-list-item-text-class="min-w-0 flex-1 px-2 py-1"');
  });

  it('stretches the Spring UI list across the page horizontal padding', () => {
    const html = renderList({
      items: [
        {
          const: 'first',
          title: 'First',
        },
      ],
    });
    expect(html).toContain('<div role="list" style="margin:0 -16px;width:auto">');
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

  it('renders item meta in the always-visible list item content', () => {
    const html = renderList({
      items: [
        {
          const: 'high',
          description: 'Important but not urgent',
          icon: 'https://example.com/typescript.svg',
          meta: 'Due this week',
          title: 'High Priority',
        },
      ],
      formData: 'high',
    });
    expect(html).toContain('High Priority');
    expect(html).toContain('Due this week');
    expect(html.indexOf('Due this week')).toBeGreaterThan(
      html.indexOf('Important but not urgent'),
    );
  });

  it('does not render Spring UI hover actions for meta-only list items', () => {
    const html = renderList({
      items: [
        {
          const: 'urgent',
          description: 'Needs immediate attention',
          meta: 'Due today',
          title: 'Urgent',
        },
      ],
      formData: 'urgent',
    });
    expect(html).toContain('Due today');
    expect(html).not.toContain('data-has-hover-actions="true"');
  });

  it('renders icon meta in the always-visible list item content', () => {
    const html = renderList({
      items: [
        {
          const: 'urgent',
          description: 'Needs immediate attention',
          iconMeta: [
            {
              color: 'danger.f02',
              icon: 'warning',
              message: 'Action required',
            },
          ],
          meta: 'Due today',
          title: 'Urgent',
        },
      ],
      formData: 'urgent',
    });
    expect(html).toContain('Due today');
    expect(html).toContain('data-icon-symbol="AlertMd"');
    expect(html).toContain('data-icon-color="var(--sui-colors-danger-f)"');
    expect(html).toContain('class="flex items-center gap-2"');
    expect(html).not.toContain('data-has-hover-actions="true"');
  });

  it('renders navigation icon in the always-visible list item content', () => {
    const html = renderList({
      items: [
        {
          const: 'urgent',
          description: 'Needs immediate attention',
          meta: 'Due today',
          title: 'Urgent',
        },
      ],
      formData: 'urgent',
      uiSchema: {
        'ui:navigation': true,
      },
    });
    expect(html).toContain('Due today');
    expect(html).toContain('data-icon-symbol="ArrowRightMd"');
    expect(html).not.toContain('data-has-hover-actions="true"');
  });

  it('keeps Spring UI hover actions when list items have action content', () => {
    const html = renderList({
      items: [
        {
          actions: [
            {
              icon: 'phone',
              id: 'call',
              title: 'Call',
            },
          ],
          const: 'urgent',
          description: 'Needs immediate attention',
          meta: 'Due today',
          title: 'Urgent',
        },
      ],
      formData: 'urgent',
    });
    expect(html).toContain('Due today');
    expect(html).toContain('data-has-hover-actions="true"');
  });

  it('renders list item icon actions with Spring UI outlined squircle style', () => {
    const html = renderList({
      items: [
        {
          actions: [
            {
              icon: 'phone',
              id: 'call',
              title: 'Call',
            },
          ],
          const: 'urgent',
          description: 'Needs immediate attention',
          title: 'Urgent',
        },
      ],
      formData: 'urgent',
    });
    expect(html).toContain('data-icon-button-symbol="CallMd"');
    expect(html).toContain('data-icon-button-shape="squircle"');
    expect(html).toContain('data-icon-button-size="medium"');
    expect(html).toContain('data-icon-button-variant="outlined"');
    expect(html).toContain('class="mr-1"');
  });

  it('renders always-show icon actions inline instead of Spring UI hover actions', () => {
    const html = renderList({
      items: [
        {
          actions: [
            {
              icon: 'refresh',
              id: 'refresh',
              title: 'Refresh',
            },
          ],
          const: 'urgent',
          description: 'Needs immediate attention',
          meta: 'Due today',
          title: 'Urgent',
        },
      ],
      formData: 'urgent',
      uiSchema: {
        'ui:alwaysShowActions': true,
      },
    });
    expect(html).toContain('Due today');
    expect(html).toContain('data-icon-button-symbol="RefreshMd"');
    expect(html).not.toContain('data-has-hover-actions="true"');
    expect(html).not.toContain('data-always-show-hover-actions="true"');
  });

  it('renders button type actions always with Juno list button style', () => {
    const html = renderList({
      items: [
        {
          actions: [
            {
              id: 'invite',
              title: 'Invite',
              type: 'button',
            },
          ],
          const: 'alice',
          description: 'Account Manager',
          title: 'Alice Johnson',
        },
      ],
      formData: 'alice',
    });
    expect(html).toContain('Invite');
    expect(html).toContain('data-button-size="small"');
    expect(html).toContain('data-button-variant="contained"');
    expect(html).toContain('data-button-color="primary"');
    expect(html).not.toContain('data-has-hover-actions="true"');
  });

  it('centers metric card content in the Spring UI block', () => {
    const html = renderList({
      items: [
        {
          const: 'answer-rate',
          label: 'answer rate',
          title: 'Answer Rate',
          value: '100%',
        },
      ],
      uiSchema: {
        'ui:itemType': 'metric',
      },
      formData: 'answer-rate',
    });
    expect(html).toContain(
      'data-block-class="box-border flex flex-col items-center justify-center text-center"',
    );
    expect(html).toContain('100%');
    expect(html).toContain('Answer Rate');
  });

  it('maps legacy metric trend colors to Spring UI CSS tokens', () => {
    const html = renderList({
      items: [
        {
          const: 'answer-rate',
          title: 'Answer Rate',
          trend: '+67% company avg',
          trendColor: 'success.f02',
          value: '100%',
        },
      ],
      uiSchema: {
        'ui:itemType': 'metric',
      },
      formData: 'answer-rate',
    });
    expect(html).toContain('+67% company avg');
    expect(html).toContain('data-text-color="var(--sui-colors-success-f)"');
  });
});
