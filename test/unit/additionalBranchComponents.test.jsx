/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockValidateIsOffline = jest.fn(() => false);

jest.mock('@ringcentral-integration/commons/lib/di', () => ({
  Module: () => (target) => target,
}));

jest.mock('@ringcentral-integration/commons/modules/RingCentralExtensions', () => ({
  RingCentralExtensions: class MockRingCentralExtensionsBase {
    async _bindEvents() {
      return 'base-bind';
    }
  },
}));

jest.mock('@ringcentral-integration/commons/lib/validateIsOffline', () => (
  (message) => mockValidateIsOffline(message)
));

jest.mock('@ringcentral-integration/jsonschema-page', () => ({
  TextWithMarkdown: ({ text }) => <span data-sign="markdown-text" data-testid="markdown-text">{text}</span>,
}));

jest.mock('../../src/components/CallHUDPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('../../src/components/DialerPanel/FromField/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/DurationCounter', () => (
  function MockDurationCounter({ offset, startTime }) {
    return <span data-sign="duration-counter" data-testid="duration-counter">{`${startTime}-${offset}`}</span>;
  }
));

jest.mock('@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper', () => ({
  getPresenceStatus: jest.fn(() => 'available'),
}));

jest.mock('@ringcentral-integration/widgets/lib/getPresenceStatusName', () => ({
  getPresenceStatusName: jest.fn(() => 'Available'),
}));

jest.mock('react-markdown', () => (
  function MockReactMarkdown({ children, components }) {
    return (
      <div data-sign="react-markdown" data-testid="react-markdown">
        {components.p({ children: ['hello\nworld', '', null] })}
        {components.a({ href: 'https://example.com', title: 'Example', children: 'link' })}
        {components.img({ src: 'person-1', alt: ':Person' })}
        {components.img({ src: 'team-1', alt: ':Team' })}
        {components.img({ src: 'all', alt: ':All' })}
        {components.img({ src: 'image.png', alt: 'image' })}
        <span>{children}</span>
      </div>
    );
  }
));

jest.mock('../../src/components/SearchLine', () => ({
  SearchLine: ({ disableLinks, onSearchInputChange, placeholder, searchInput }) => (
    <input
      data-disabled={disableLinks ? 'true' : 'false'}
      data-sign="search-line"
      data-testid="search-line"
      placeholder={placeholder}
      value={searchInput}
      onChange={onSearchInputChange}
    />
  ),
}));

jest.mock('../../src/components/ActionMenu', () => ({
  ActionMenu: ({ actions = [], className = '' }) => (
    <div className={className} data-sign="action-menu" data-testid="action-menu">
      {actions.map((action) => (
        <button
          key={action.id || action.title}
          disabled={action.disabled}
          type="button"
          onClick={action.onClick}
        >
          {action.title || action.id}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../src/components/ConfirmDialog', () => ({
  ConfirmDialog: ({ confirmText, onClose, onConfirm, open, title }) => (
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        <button type="button" onClick={onClose}>cancel</button>
        <button type="button" onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null
  ),
}));

jest.mock('../../src/components/BackHeaderView', () => ({
  BackHeaderView: ({ children, hideBackButton, onBack, rightButton, title }) => (
    <section>
      <h1>{title}</h1>
      {!hideBackButton ? <button type="button" onClick={onBack}>back</button> : null}
      {rightButton}
      {children}
    </section>
  ),
}));

jest.mock('../../src/components/GlipChatPanel/GlipChatForm', () => ({
  GlipChatForm: ({ disabled, groupId, onSubmit, onTextChange, onUploadFile, textValue }) => (
    <form data-disabled={disabled ? 'true' : 'false'} data-group={groupId} data-sign="glip-chat-form">
      <input
        data-sign="glip-text"
        value={textValue}
        onChange={(event) => onTextChange(event.target.value)}
      />
      <button type="button" onClick={() => onSubmit(groupId)}>send</button>
      <button type="button" onClick={() => onUploadFile(groupId)}>upload</button>
    </form>
  ),
}));

jest.mock('../../src/components/GlipChatPanel/GlipPostList', () => ({
  GlipPostList: ({ loadNextPage, posts, viewProfile }) => (
    <section data-sign="glip-post-list">
      {posts.map((post) => <span key={post.id}>{post.text}</span>)}
      <button type="button" onClick={loadNextPage}>load-next</button>
      <button type="button" onClick={() => viewProfile('person-1')}>view-profile</button>
    </section>
  ),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    AddMemberBorder: createIcon('AddMemberBorder'),
    AddParkLocation: createIcon('AddParkLocation'),
    ArrowDown2: createIcon('ArrowDown2'),
    ArrowUp2: createIcon('ArrowUp2'),
    CallQueue: createIcon('CallQueue'),
    CallsBorder: createIcon('CallsBorder'),
    Check: createIcon('Check'),
    Close: createIcon('Close'),
    DefaultGroupAvatar: createIcon('DefaultGroupAvatar'),
    DefaultTeamAvatar: createIcon('DefaultTeamAvatar'),
    Delete: createIcon('Delete'),
    ParkCallSp: createIcon('ParkCallSp'),
    People: createIcon('People'),
    PhoneBorder: createIcon('PhoneBorder'),
    PickUpCall: createIcon('PickUpCall'),
    SmsBorder: createIcon('SmsBorder'),
    UserDefault: createIcon('UserDefault'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const blockedProps = new Set([
    'badgeContent',
    'canHover',
    'color',
    'component',
    'disableRipple',
    'disableTouchRipple',
    'iconVariant',
    'maxActions',
    'radius',
    'secondaryTypographyProps',
    'severity',
    'size',
    'symbol',
    'variant',
    'virtualize',
  ]);
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (key !== 'children' && !key.startsWith('$') && !blockedProps.has(key)) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const createComponent = (tag, testId) => React.forwardRef((props, ref) => (
    React.createElement(tag, {
      ...cleanProps(props),
      ref,
      'data-sign': props['data-sign'] || testId,
      'data-testid': props['data-testid'] || props['data-sign'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => {
    if (typeof Component === 'string') {
      return React.createElement(Component, { ...cleanProps(props), ref }, props.children);
    }
    return <Component {...props} ref={ref}>{props.children}</Component>;
  });
  styled.a = () => createComponent('a', 'styled-a');
  styled.div = () => createComponent('div', 'styled-div');
  styled.p = () => createComponent('p', 'styled-p');
  styled.span = () => createComponent('span', 'styled-span');
  return {
    RcAlert: ({ action, children, closeText, onClose, severity, ...props }) => (
      <section {...cleanProps(props)} data-severity={severity}>
        {children}
        {action}
        {onClose ? <button type="button" onClick={onClose}>{closeText}</button> : null}
      </section>
    ),
    RcAvatar: ({ children, presenceProps, src }) => (
      <span data-presence={presenceProps?.type || ''} data-sign="avatar" data-src={src || ''}>
        {children}
      </span>
    ),
    RcBadge: ({ children, badgeContent }) => (
      <span data-badge={badgeContent}>{children}</span>
    ),
    RcButton: ({ children, disabled, onClick }) => (
      <button disabled={disabled} type="button" onClick={onClick}>{children}</button>
    ),
    RcChip: ({ label }) => <span>{label}</span>,
    RcIcon: ({ symbol }) => <span data-icon-symbol={symbol?.name || 'icon'} />,
    RcIconButton: ({ children, disabled, onClick, title }) => (
      <button disabled={disabled} title={title} type="button" onClick={onClick}>
        {children || title || 'icon-button'}
      </button>
    ),
    RcListItem: ({ children, disabled, onClick, selected, value }) => (
      <button
        data-selected={selected ? 'true' : 'false'}
        data-value={value || ''}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
    ),
    RcListItemAvatar: createComponent('span', 'list-item-avatar'),
    RcListItemSecondaryAction: createComponent('span', 'list-item-secondary-action'),
    RcListItemText: ({ primary, secondary }) => (
      <span>
        <span>{primary}</span>
        <span>{secondary}</span>
      </span>
    ),
    RcLoading: ({ children, loading }) => (
      <div data-loading={loading ? 'true' : 'false'}>{children}</div>
    ),
    RcMenuItem: ({ children, value }) => (
      <button data-value={value} type="button">{children}</button>
    ),
    RcPlainSelect: ({ children, IconComponent, onChange, renderValue, value }) => (
      <div data-sign="plain-select">
        {renderValue(value)}
        <IconComponent open={false} />
        <IconComponent open />
        <button type="button" onClick={() => onChange({ target: { value: 'ParkLocation' } })}>
          select-park
        </button>
        {children}
      </div>
    ),
    RcPresence: ({ type }) => <span data-presence-dot={type} />,
    RcSelect: ({ children, disabled, onChange, renderValue, value }) => (
      <div data-disabled={disabled ? 'true' : 'false'} data-sign="select">
        <span>{renderValue(value)}</span>
        <button type="button" onClick={() => onChange({ target: { value: 'anonymous' } })}>
          select-anonymous
        </button>
        {children}
      </div>
    ),
    RcText: createComponent('span', 'text'),
    RcTooltip: ({ children, title }) => <span title={typeof title === 'string' ? title : undefined}>{children}</span>,
    RcTypography: ({ children }) => <span>{children}</span>,
    css: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    styled,
    useResponsiveMatch: jest.fn(() => ({ gtSM: false, gtXS: true })),
  };
});

const callDirections = require('@ringcentral-integration/commons/enums/callDirections').default;
const PopupWindowManager = require('../../src/lib/PopupWindowManager').default;
const { RingCentralExtensions } = require('../../src/modules/RingCentralExtensions');
const { SearchAndFilter } = require('../../src/components/CallHUDPanel/SearchAndFilter');
const {
  AssignedFullBadge,
  AssignedShortBadge,
  ResolvedShortBadge,
} = require('../../src/components/ConversationItem/AssignedBadge');
const { ThirdPartyBanner } = require('../../src/components/ThirdPartyBanner');
const { GlipMarkdown } = require('../../src/components/GlipChatPanel/GlipMarkdown');
const { GlipPostContent } = require('../../src/components/GlipChatPanel/GlipPostContent');
const { GlipChatPanel } = require('../../src/components/GlipChatPanel');
const { ExtensionItem } = require('../../src/components/CallHUDPanel/ExtensionItem');
const { GlipGroupItem } = require('../../src/components/GlipGroupsPanel/GlipGroupItem');
const FromField = require('../../src/components/DialerPanel/FromField').default;

beforeEach(() => {
  jest.clearAllMocks();
});

test('covers search filters, assignment badges, banners and from field branches', () => {
  const onSearchInputChange = jest.fn();
  const onTypeChange = jest.fn();
  const onAddExtension = jest.fn();
  const { rerender } = render(
    <SearchAndFilter
      canAdd
      currentLocale="en-US"
      onAddExtension={onAddExtension}
      onSearchInputChange={onSearchInputChange}
      onTypeChange={onTypeChange}
      placeholder="Search"
      searchInput="Ada"
      type="User"
      typeList={[{ id: 'User', unreadCount: 2 }, { id: 'ParkLocation', unreadCount: 0 }]}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Grace' } });
  fireEvent.click(screen.getByText('select-park'));
  fireEvent.click(screen.getByTitle('Add an extension'));
  expect(onSearchInputChange).toHaveBeenCalledWith('Grace');
  expect(onTypeChange).toHaveBeenCalledWith('ParkLocation');
  expect(onAddExtension).toHaveBeenCalled();
  rerender(
    <SearchAndFilter
      canAdd
      currentLocale="en-US"
      onAddExtension={onAddExtension}
      onSearchInputChange={onSearchInputChange}
      onTypeChange={onTypeChange}
      searchInput=""
      showTypeFilter={false}
      type="ParkLocation"
      typeList={[]}
    />,
  );
  fireEvent.click(screen.getByTitle('Add park location'));
  expect(onAddExtension).toHaveBeenCalledTimes(2);
  const badges = render(
    <div>
      <AssignedFullBadge assignee={null} isAssignedToMe={false} status="Open" statusReason="" />
      <AssignedFullBadge assignee={{ name: 'Ada Lovelace' }} isAssignedToMe={false} status="Open" statusReason="" />
      <AssignedFullBadge assignee={{ name: 'Ada Lovelace' }} isAssignedToMe status="Open" statusReason="" />
      <AssignedFullBadge assignee={{ name: 'Ada Lovelace' }} isAssignedToMe status="Resolved" statusReason="ThreadExpired" />
      <AssignedFullBadge assignee={{ name: 'Ada Lovelace' }} isAssignedToMe status="Resolved" statusReason="" />
      <AssignedShortBadge assignee={null} isAssignedToMe={false} />
      <AssignedShortBadge assignee={{ name: 'grace  hopper' }} isAssignedToMe={false} />
      <AssignedShortBadge assignee={{ name: 'Ada Lovelace' }} isAssignedToMe />
      <ResolvedShortBadge reason="ThreadExpired" />
      <ResolvedShortBadge reason="" />
    </div>,
  );
  expect(badges.getByText('UNASSIGNED')).toBeInTheDocument();
  expect(badges.getByText('ASSIGNED TO ADA LOVELACE')).toBeInTheDocument();
  expect(badges.getByText('ASSIGNED TO YOU')).toBeInTheDocument();
  expect(badges.getAllByText('RESOLVED')).toHaveLength(2);
  expect(badges.getByText('GH')).toBeInTheDocument();
  const onAction = jest.fn();
  const onClose = jest.fn();
  const banner = render(
    <ThirdPartyBanner
      banner={{
        action: { label: 'Open', variant: 'plain' },
        closeButtonLabel: 'Dismiss',
        closable: true,
        id: 'banner-1',
        message: 'Hello **world**',
        severity: 'unsupported',
      }}
      onAction={onAction}
      onClose={onClose}
    />,
  );
  fireEvent.click(banner.getByText('Open'));
  fireEvent.click(banner.getByText('Dismiss'));
  expect(onAction).toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
  banner.rerender(<ThirdPartyBanner banner={{ id: 'banner-2', message: 'Announcement', severity: 'announcement' }} />);
  expect(banner.getByText('Announcement')).toBeInTheDocument();
  expect(render(<ThirdPartyBanner banner={null} />).container).toBeEmptyDOMElement();
  const onChange = jest.fn();
  const fromField = render(
    <FromField
      currentLocale="en-US"
      formatPhone={(number) => `formatted-${number}`}
      fromNumber="+16505550123"
      fromNumbers={[
        { label: 'Main', phoneNumber: '+16505550123', primary: true, usageType: 'DirectNumber' },
        { phoneNumber: '+16505550124' },
      ]}
      hidden={false}
      onChange={onChange}
    />,
  );
  fireEvent.click(fromField.getByText('select-anonymous'));
  expect(onChange).toHaveBeenCalledWith({ phoneNumber: 'anonymous' });
  expect(render(
    <FromField
      currentLocale="en-US"
      formatPhone={(number) => number}
      fromNumber=""
      fromNumbers={[]}
      hidden
      onChange={onChange}
    />,
  ).container).toBeEmptyDOMElement();
});

test('covers glip markdown, content, panel and group item branches', async () => {
  const atRender = jest.fn(({ id, type }) => <strong>{`${type}:${id}`}</strong>);
  const markdown = render(<GlipMarkdown text="Hi [@Person](person-1)" atRender={atRender} />);
  expect(markdown.getByText('Person:person-1')).toBeInTheDocument();
  markdown.rerender(<GlipMarkdown text="No renderer" />);
  expect(markdown.getByText('@person-1')).toBeInTheDocument();
  const content = render(
    <GlipPostContent
      atRender={atRender}
      post={{
        attachments: [
          { contentUri: 'https://example.com/file.txt', name: 'file.txt', type: 'File' },
          { contentUri: 'https://example.com/unknown', name: 'unknown', type: 'Image' },
        ],
        text: '[code]const a = 1;[/code]',
      }}
    />,
  );
  expect(content.getByText('file.txt')).toBeInTheDocument();
  expect(content.getByText('Unsupported message')).toBeInTheDocument();
  content.rerender(<GlipPostContent post={{ attachments: [], text: '' }} />);
  expect(content.getByText('Unsupported message')).toBeInTheDocument();
  const loadGroup = jest.fn();
  const onClose = jest.fn();
  const onBack = jest.fn();
  const updateText = jest.fn();
  const createPost = jest.fn();
  const uploadFile = jest.fn();
  const viewProfile = jest.fn();
  const loadNextPage = jest.fn();
  const { rerender } = render(
    <GlipChatPanel
      createPost={createPost}
      dateTimeFormatter={() => 'formatted-date'}
      group={{
        detailMembers: [],
        id: 'group-1',
        members: [],
        name: 'Engineering',
        type: 'Team',
      }}
      groupId="group-1"
      loadGroup={loadGroup}
      loadNextPage={loadNextPage}
      onBack={onBack}
      onClose={onClose}
      posts={[{ id: 'post-1', text: 'hello' }]}
      showCloseButton
      showSpinner
      textValue="draft"
      updateText={updateText}
      uploadFile={uploadFile}
      viewProfile={viewProfile}
    />,
  );
  expect(loadGroup).toHaveBeenCalledWith('group-1');
  fireEvent.click(screen.getByTitle('Close'));
  fireEvent.change(screen.getByDisplayValue('draft'), { target: { value: 'updated' } });
  fireEvent.click(screen.getByText('send'));
  fireEvent.click(screen.getByText('upload'));
  fireEvent.click(screen.getByText('load-next'));
  fireEvent.click(screen.getByText('view-profile'));
  expect(onClose).toHaveBeenCalled();
  expect(updateText).toHaveBeenCalledWith('updated');
  expect(createPost).toHaveBeenCalledWith('group-1');
  expect(uploadFile).toHaveBeenCalledWith('group-1');
  expect(viewProfile).toHaveBeenCalledWith('person-1');
  rerender(
    <GlipChatPanel
      createPost={createPost}
      dateTimeFormatter={() => 'formatted-date'}
      group={{ detailMembers: [], id: 'group-2', members: [{}, {}], type: 'PrivateChat' }}
      groupId="group-2"
      hideBackButton
      loadGroup={loadGroup}
      loadNextPage={loadNextPage}
      posts={[]}
      textValue=""
      updateText={updateText}
      uploadFile={uploadFile}
      viewProfile={viewProfile}
    />,
  );
  await waitFor(() => expect(loadGroup).toHaveBeenCalledWith('group-2'));
  const onSelectGroup = jest.fn();
  const groups = render(
    <div>
      <GlipGroupItem
        active
        dateTimeFormatter={() => 'formatted-time'}
        group={{
          detailMembers: [{ avatar: 'avatar-url', id: 'me', isMe: true }, { avatar: 'other-avatar', id: 'other' }],
          id: 'private-1',
          latestPost: { creationTime: 100, text: 'Latest', type: 'TextMessage' },
          members: ['me', 'other'],
          type: 'PrivateChat',
          unread: 2,
        }}
        onSelectGroup={onSelectGroup}
      />
      <GlipGroupItem
        dateTimeFormatter={() => 'formatted-time'}
        group={{
          detailMembers: [{ id: 'one' }, { id: 'two' }, { id: 'three' }],
          id: 'team-1',
          latestPost: { creator: { firstName: 'Ada' }, creationTime: 200, type: 'FileMessage' },
          name: 'Team',
          type: 'Team',
          unread: 0,
        }}
        onSelectGroup={onSelectGroup}
      />
      <GlipGroupItem
        dateTimeFormatter={() => 'formatted-time'}
        group={{ detailMembers: [{ id: 'solo', isMe: true }], id: 'solo-1', unread: 0 }}
        onSelectGroup={onSelectGroup}
      />
    </div>,
  );
  fireEvent.click(groups.getByText('Latest'));
  expect(onSelectGroup).toHaveBeenCalled();
  expect(groups.getByText('2')).toBeInTheDocument();
  expect(groups.getAllByText('Unsupported message').length).toBeGreaterThan(0);
});

test('covers popup window manager ping, pong and timeout branches', async () => {
  const originalBroadcastChannel = global.BroadcastChannel;
  class TestBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.addEventListener = jest.fn((_event, listener) => {
        this.listener = listener;
      });
      this.postMessage = jest.fn();
    }
  }
  global.BroadcastChannel = TestBroadcastChannel;
  const popupManager = new PopupWindowManager({ isPopupWindow: true, prefix: 'test' });
  popupManager._onChannelMessage({ data: { type: 'ping' } });
  expect(popupManager._channel.postMessage).toHaveBeenCalledWith({ type: 'pong' });
  const parentManager = new PopupWindowManager({ isPopupWindow: false, prefix: 'test' });
  const openedPromise = parentManager.checkPopupWindowOpened();
  parentManager._onChannelMessage({ data: { type: 'pong' } });
  await expect(openedPromise).resolves.toBe(true);
  jest.useFakeTimers();
  const timeoutPromise = parentManager.checkPopupWindowOpened();
  jest.advanceTimersByTime(801);
  await expect(timeoutPromise).resolves.toBe(false);
  jest.useRealTimers();
  global.BroadcastChannel = originalBroadcastChannel;
});

test('handles ringcentral extension refresh-error branches', async () => {
  let refreshErrorHandler;
  const refreshTokenValid = jest.fn();
  const authData = jest.fn();
  const cacheClean = jest.fn();
  const platform = {
    _cache: { clean: cacheClean },
    addListener: jest.fn((_event, handler) => {
      refreshErrorHandler = handler;
    }),
    auth: jest.fn(() => ({
      data: authData,
      refreshTokenValid,
    })),
    events: {
      refreshError: 'refreshError',
    },
  };
  const instance = new RingCentralExtensions();
  instance._deps = {
    client: {
      service: {
        platform: () => platform,
      },
    },
  };
  instance._webSocketExtension = {
    revoke: jest.fn(async () => {}),
  };
  instance._clearTokens = jest.fn();
  instance._exposeConnectionEvents = jest.fn();
  instance.disconnectOnInactive = false;
  instance.isTabActive = true;
  instance.isWebSocketReady = true;
  await expect(instance._bindEvents()).resolves.toBe('base-bind');
  refreshTokenValid.mockResolvedValueOnce(true);
  await refreshErrorHandler({ message: 'offline', response: { status: 503 } });
  expect(instance._webSocketExtension.revoke).not.toHaveBeenCalled();
  refreshTokenValid.mockResolvedValueOnce(false);
  await refreshErrorHandler({ message: 'server', response: { status: 503 } });
  expect(instance._webSocketExtension.revoke).toHaveBeenCalledWith(true);
  expect(instance._exposeConnectionEvents).toHaveBeenCalled();
  expect(instance._clearTokens).toHaveBeenCalled();
  instance._webSocketExtension.revoke.mockRejectedValueOnce(new Error('boom'));
  refreshTokenValid.mockResolvedValueOnce(false);
  const originalConsoleError = console.error;
  console.error = jest.fn();
  await refreshErrorHandler({ message: 'server', response: { status: 503 } });
  expect(console.error).toHaveBeenCalled();
  console.error = originalConsoleError;
  authData.mockReset();
  refreshTokenValid.mockResolvedValueOnce(false);
  authData.mockResolvedValueOnce({ refresh_token: 'refresh-token' });
  await refreshErrorHandler({
    message: 'bad token',
    response: {
      clone: () => ({
        json: jest.fn(async () => ({ errors: [{ errorCode: 'OAU-213' }] })),
      }),
      status: 400,
    },
  });
  expect(cacheClean).toHaveBeenCalled();
  instance.disconnectOnInactive = true;
  instance.isTabActive = false;
  refreshTokenValid.mockResolvedValueOnce(false);
  await refreshErrorHandler({ message: 'server', response: { status: 503 } });
  expect(instance._webSocketExtension.revoke).toHaveBeenCalledTimes(3);
});

test('covers extension item actions for users, park locations, groups and departments', () => {
  const callbacks = {
    formatPhone: jest.fn((number) => `formatted-${number}`),
    onClickToDial: jest.fn(),
    onPark: jest.fn(),
    onRemoveExtension: jest.fn(),
    onText: jest.fn(),
    pickCallQueueCall: jest.fn(),
    pickGroupCall: jest.fn(),
    pickParkLocation: jest.fn(),
  };
  const ringingCall = {
    direction: callDirections.inbound,
    from: '+16505550123',
    fromName: '',
    offset: 0,
    sessionId: 'call-1',
    startTime: '2026-01-01T00:00:00.000Z',
    telephonyStatus: 'Ringing',
    to: 'Park 801',
  };
  const { rerender } = render(
    <ExtensionItem
      {...callbacks}
      canEdit
      canPark
      currentLocale="en-US"
      disableClickToDial={false}
      item={{
        extension: {
          extensionNumber: '101',
          id: 'user-1',
          name: 'Ada',
          status: 'Enabled',
          type: 'User',
        },
        presence: {
          activeCalls: [],
          dndStatus: 'TakeAllCalls',
          presenceStatus: 'Available',
        },
      }}
    />,
  );
  fireEvent.click(screen.getByText('Call'));
  fireEvent.click(screen.getByText('Remove'));
  fireEvent.click(screen.getAllByText('Remove')[1]);
  expect(callbacks.onClickToDial).toHaveBeenCalledWith({
    id: 'user-1',
    name: 'Ada',
    phoneNumber: '101',
  });
  expect(callbacks.onRemoveExtension).toHaveBeenCalledWith('user-1');
  rerender(
    <ExtensionItem
      {...callbacks}
      canEdit
      canPark
      currentLocale="en-US"
      item={{
        extension: {
          extensionNumber: '801',
          id: 'park-1',
          name: 'Park 801',
          status: 'Enabled',
          type: 'ParkLocation',
        },
        presence: { activeCalls: [] },
      }}
    />,
  );
  fireEvent.click(screen.getByText('Park current call'));
  expect(callbacks.onPark).toHaveBeenCalledWith(expect.objectContaining({ id: 'park-1' }));
  rerender(
    <ExtensionItem
      {...callbacks}
      canEdit
      canPark={false}
      currentLocale="en-US"
      item={{
        extension: {
          extensionNumber: '801',
          id: 'park-1',
          name: 'Park 801',
          status: 'Enabled',
          type: 'ParkLocation',
        },
        presence: { activeCalls: [ringingCall] },
      }}
    />,
  );
  fireEvent.click(screen.getByText('Pick up call'));
  fireEvent.click(screen.getByText('Notify by text'));
  expect(callbacks.pickParkLocation).toHaveBeenCalledWith(expect.objectContaining({ id: 'park-1' }), ringingCall);
  expect(callbacks.onText).toHaveBeenCalledWith('You have a call from formatted-+16505550123 at Park 801');
  rerender(
    <ExtensionItem
      {...callbacks}
      currentLocale="en-US"
      item={{
        extension: {
          extensionNumber: '701',
          id: 'group-1',
          name: 'Pickup Group',
          status: 'Enabled',
          type: 'GroupCallPickup',
        },
        presence: { activeCalls: [ringingCall] },
      }}
    />,
  );
  fireEvent.click(screen.getByText('Pick up call'));
  expect(callbacks.pickGroupCall).toHaveBeenCalledWith(expect.objectContaining({ id: 'group-1' }), ringingCall);
  rerender(
    <ExtensionItem
      {...callbacks}
      currentLocale="en-US"
      item={{
        extension: {
          extensionNumber: '201',
          id: 'department-1',
          name: 'Support',
          status: 'Enabled',
          type: 'Department',
        },
        presence: {
          activeCalls: [{
            ...ringingCall,
            direction: callDirections.outbound,
            from: 'Support',
            fromName: 'Support',
            sessionId: 'call-2',
            to: '+16505550124',
            toName: 'Grace',
          }],
        },
      }}
    />,
  );
  fireEvent.click(screen.getByText('Pick up call'));
  expect(callbacks.pickCallQueueCall).toHaveBeenCalledWith(expect.objectContaining({ id: 'department-1' }), expect.objectContaining({ sessionId: 'call-2' }));
  rerender(
    <ExtensionItem
      {...callbacks}
      currentLocale="en-US"
      item={{
        extension: {
          extensionNumber: '301',
          id: 'disabled-1',
          name: 'Disabled',
          status: 'Disabled',
          type: 'User',
        },
        presence: { activeCalls: [{ ...ringingCall, telephonyStatus: 'OnHold' }, { ...ringingCall, sessionId: 'call-3', telephonyStatus: 'ParkedCall' }] },
      }}
    />,
  );
  expect(screen.getByText('Disabled')).toBeInTheDocument();
});
