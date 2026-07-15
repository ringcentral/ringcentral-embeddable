/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@ringcentral-integration/widgets/components/MeetingScheduleButton/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/MeetingScheduleButton/styles.scss', () => ({
  actionPrompt: 'actionPrompt',
  gutter: 'gutter',
  saveAsDefault: 'saveAsDefault',
  saveAsDefaultLabel: 'saveAsDefaultLabel',
}));

jest.mock('../../src/components/MeetingHistoryPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('../../src/components/MeetingItem', () => (
  function MockMeetingItem({ displayName, id, onClick, onLog }) {
    return (
      <button type="button" onClick={() => {
        onClick(id);
        onLog();
      }}>
        {displayName}
      </button>
    );
  }
));

jest.mock('../../src/components/SearchLine', () => ({
  SearchLine: ({ onSearchInputChange, placeholder, searchInput }) => (
    <input
      data-sign="search-line"
      data-testid="search-line"
      placeholder={placeholder}
      value={searchInput}
      onChange={onSearchInputChange}
    />
  ),
}));

jest.mock('../../src/components/CallHUDPanel/SearchAndFilter', () => ({
  SearchAndFilter: ({ canAdd, onAddExtension, onSearchInputChange, onTypeChange, searchInput, type }) => (
    <section data-sign="hud-search">
      <input
        data-sign="hud-search-input"
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
      />
      <button type="button" onClick={() => onTypeChange(type === 'User' ? 'ParkLocation' : 'User')}>
        change-type
      </button>
      {canAdd ? <button type="button" onClick={onAddExtension}>add-extension</button> : null}
    </section>
  ),
}));

jest.mock('../../src/components/CallHUDPanel/ExtensionItem', () => ({
  ExtensionItem: ({ item, onClickToDial, onRemoveExtension }) => (
    <article data-sign="extension-item">
      <span>{item.extension.name}</span>
      <button type="button" onClick={() => onClickToDial(item.extension)}>call-extension</button>
      <button type="button" onClick={() => onRemoveExtension(item.extension.id)}>remove-extension</button>
    </article>
  ),
}));

jest.mock('../../src/components/SmartNotesPanel/SmartNoteApp', () => ({
  SmartNoteApp: ({ client, onClose, showCloseButton }) => (
    <section data-client={client.id} data-sign="smart-note-app">
      {showCloseButton ? <button type="button" onClick={onClose}>close-smart-note</button> : null}
    </section>
  ),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const People = function People() {
    return <span data-icon="People" />;
  };
  return { People };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const blockedProps = new Set([
    'color',
    'component',
    'focused',
    'formControlLabelProps',
    'fullWidth',
    'innerRef',
    'label',
    'loading',
    'multiple',
    'size',
    'symbol',
    'variant',
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
  styled.div = () => createComponent('div', 'styled-div');
  styled.span = () => createComponent('span', 'styled-span');
  return {
    RcAvatar: ({ children, src }) => <span data-src={src || ''}>{children}</span>,
    RcButton: ({ children, disabled, loading, onClick }) => (
      <button disabled={disabled || loading} type="button" onClick={onClick}>{children}</button>
    ),
    RcCheckbox: ({ checked, disabled, label, onChange }) => (
      <label>
        <input checked={checked} disabled={disabled} type="checkbox" onChange={onChange} />
        {label}
      </label>
    ),
    RcCircularProgress: ({ size }) => <span data-sign="spinner" data-size={size}>spinner</span>,
    RcDialog: ({ children, onClose, open }) => (
      open ? (
        <div role="dialog">
          <button type="button" onClick={onClose}>dialog-close</button>
          {children}
        </div>
      ) : null
    ),
    RcDialogActions: createComponent('div', 'dialog-actions'),
    RcDialogContent: createComponent('div', 'dialog-content'),
    RcDialogTitle: createComponent('h2', 'dialog-title'),
    RcDownshift: ({ inputValue, onChange, onInputChange, options = [], renderOption }) => (
      <section>
        <input
          data-sign="downshift-input"
          data-testid="downshift-input"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
        />
        <button type="button" onClick={() => onChange(options.slice(0, 2))}>select-options</button>
        {options.map((option, index) => renderOption({
          ...option,
          onClick: () => onChange([option]),
        }, { highlighted: index === 0, index }))}
      </section>
    ),
    RcIcon: ({ symbol }) => <span data-icon-symbol={symbol?.name || 'icon'} />,
    RcIconButton: ({ color, disabled, onClick, title }) => (
      <button data-color={color} disabled={disabled} title={title || ''} type="button" onClick={onClick}>
        icon-button
      </button>
    ),
    RcList: createComponent('div', 'list'),
    RcListItemAvatar: createComponent('span', 'list-item-avatar'),
    RcListItemText: ({ primary, secondary }) => (
      <span>
        <span>{primary}</span>
        <span>{secondary}</span>
      </span>
    ),
    RcMenuItem: ({ children, onClick }) => <button type="button" onClick={onClick}>{children}</button>,
    RcText: createComponent('span', 'text'),
    RcTypography: ({ children }) => <span>{children}</span>,
    css: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    setOpacity: jest.fn((color, opacity) => `${color}-${opacity}`),
    styled,
  };
});

const { AddExtensionDialog } = require('../../src/components/CallHUDPanel/AddExtensionDialog');
const { CallHUDPanel } = require('../../src/components/CallHUDPanel');
const { StatusMessage } = require('../../src/components/CallItem/StatusMessage');
const MeetingHistoryPanel = require('../../src/components/MeetingHistoryPanel').default;
const { SmartNotesPanel } = require('../../src/components/SmartNotesPanel');
const { MeetingScheduleButton } = require('../../src/components/MeetingScheduleButton/MeetingScheduleButton');
const { getTabInfo } = require('../../src/components/NavigationBar/helper');
const CallCtrlButton = require('../../src/components/CallCtrlButton').default;

beforeEach(() => {
  jest.clearAllMocks();
});

test('covers add extension dialog success, reset and failure branches', async () => {
  const onAdd = jest.fn(async () => {});
  const onClose = jest.fn();
  const onFilterChange = jest.fn();
  const allExtensions = [
    { extensionNumber: '101', id: 'user-1', name: 'Ada', profileImageUrl: '' },
    { extensionNumber: '102', id: 'user-2', name: 'Grace', profileImageUrl: 'avatar.png' },
  ];
  const { rerender } = render(
    <AddExtensionDialog
      allExtensions={allExtensions}
      extensionAddFilter="Ada"
      onAdd={onAdd}
      onClose={onClose}
      onExtensionAddFilterChange={onFilterChange}
      open
      type="User"
    />,
  );
  expect(screen.getByText('Add extensions')).toBeInTheDocument();
  fireEvent.change(screen.getByTestId('downshift-input'), { target: { value: 'Grace' } });
  fireEvent.click(screen.getByText('select-options'));
  fireEvent.click(screen.getByText('Add'));
  await waitFor(() => expect(onAdd).toHaveBeenCalledWith([
    expect.objectContaining({ id: 'user-1' }),
    expect.objectContaining({ id: 'user-2' }),
  ]));
  expect(onFilterChange).toHaveBeenCalledWith('Grace');
  expect(onClose).toHaveBeenCalled();
  const failingAdd = jest.fn(async () => {
    throw new Error('failed');
  });
  rerender(
    <AddExtensionDialog
      allExtensions={allExtensions}
      extensionAddFilter=""
      onAdd={failingAdd}
      onClose={onClose}
      onExtensionAddFilterChange={onFilterChange}
      open
      type="ParkLocation"
    />,
  );
  expect(screen.getByText('Add park locations')).toBeInTheDocument();
  fireEvent.click(screen.getByText('select-options'));
  fireEvent.click(screen.getByText('Add'));
  await waitFor(() => expect(failingAdd).toHaveBeenCalled());
  expect(onClose).toHaveBeenCalledTimes(2);
  rerender(
    <AddExtensionDialog
      allExtensions={allExtensions}
      extensionAddFilter=""
      onAdd={onAdd}
      onClose={onClose}
      onExtensionAddFilterChange={onFilterChange}
      open={false}
      type="ParkLocation"
    />,
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('covers call HUD panel empty states, add dialog and extension actions', async () => {
  const callbacks = {
    formatPhone: jest.fn((number) => number),
    onAddExtensions: jest.fn(async () => {}),
    onClickToDial: jest.fn(),
    onExtensionAddFilterChange: jest.fn(),
    onRemoveExtension: jest.fn(),
    onSearchInputChange: jest.fn(),
    onTypeChange: jest.fn(),
    onPark: jest.fn(),
    onText: jest.fn(),
    pickCallQueueCall: jest.fn(),
    pickGroupCall: jest.fn(),
    pickParkLocation: jest.fn(),
  };
  const baseProps = {
    ...callbacks,
    allExtensions: [{ extensionNumber: '101', id: 'user-1', name: 'Ada' }],
    canEdit: true,
    canPark: true,
    currentLocale: 'en-US',
    disableClickToDial: false,
    extensionAddFilter: '',
    extensions: [],
    searchInput: '',
    type: 'User',
    typeList: [{ id: 'User', unreadCount: 0 }],
  };
  const { rerender } = render(<CallHUDPanel {...baseProps} />);
  expect(screen.getByText('No extensions yet')).toBeInTheDocument();
  fireEvent.click(screen.getByText('add-extension'));
  fireEvent.click(screen.getByText('select-options'));
  fireEvent.click(screen.getByText('Add'));
  await waitFor(() => expect(callbacks.onAddExtensions).toHaveBeenCalled());
  rerender(
    <CallHUDPanel
      {...baseProps}
      extensions={[{
        extension: {
          id: 'user-1',
          name: 'Ada',
        },
        id: 'item-1',
      }]}
      type="ParkLocation"
    />,
  );
  fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'park' } });
  fireEvent.click(screen.getByText('change-type'));
  fireEvent.click(screen.getByText('call-extension'));
  fireEvent.click(screen.getByText('remove-extension'));
  expect(callbacks.onSearchInputChange).toHaveBeenCalledWith('park');
  expect(callbacks.onTypeChange).toHaveBeenCalledWith('User');
  expect(callbacks.onClickToDial).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
  expect(callbacks.onRemoveExtension).toHaveBeenCalledWith('user-1');
});

test('covers meeting history loading, empty, list and next-page branches', async () => {
  const fetchMeetings = jest.fn();
  const fetchNextPageMeetings = jest.fn();
  const updateSearchText = jest.fn();
  const onClick = jest.fn();
  const onLog = jest.fn();
  const props = {
    currentLocale: 'en-US',
    dateTimeFormatter: jest.fn(() => 'formatted-date'),
    fetchMeetings,
    fetchNextPageMeetings,
    fetchingNextPage: false,
    meetings: [],
    onClick,
    onLog,
    searchText: '',
    showSpinner: true,
    type: 'recordings',
    updateSearchText,
  };
  const { container, rerender } = render(<MeetingHistoryPanel {...props} />);
  expect(fetchMeetings).toHaveBeenCalledWith('recordings');
  expect(screen.getByText('spinner')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('search'), { target: { value: 'planning' } });
  expect(updateSearchText).toHaveBeenCalledWith('planning', 'recordings');
  rerender(<MeetingHistoryPanel {...props} showSpinner={false} />);
  expect(screen.getByText('noFound')).toBeInTheDocument();
  rerender(
    <MeetingHistoryPanel
      {...props}
      fetchingNextPage
      meetings={[{
        displayName: 'Planning',
        duration: 60,
        hostInfo: null,
        id: 'meeting-1',
        recordings: [],
        startTime: '2026-01-01T00:00:00.000Z',
      }]}
      showSpinner={false}
      type="meetings"
    />,
  );
  await waitFor(() => expect(fetchMeetings).toHaveBeenCalledWith('meetings'));
  fireEvent.click(screen.getByText('Planning'));
  expect(onClick).toHaveBeenCalledWith('meeting-1');
  expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ id: 'meeting-1' }));
  expect(screen.getByText('loading')).toBeInTheDocument();
  const scroller = container.firstChild;
  Object.defineProperties(scroller, {
    clientHeight: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, value: 500 },
    scrollTop: { configurable: true, value: 390 },
  });
  fireEvent.scroll(scroller);
  await waitFor(() => expect(fetchNextPageMeetings).toHaveBeenCalledWith('meetings'));
});

test('covers smart notes delayed rendering and schedule button options', async () => {
  jest.useFakeTimers();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  const onClose = jest.fn();
  const smartNoteSession = { id: 'session-1' };
  const { rerender } = render(
    <SmartNotesPanel
      onClose={onClose}
      smartNoteClient={null}
      smartNoteSession={smartNoteSession}
      showCloseButton
    />,
  );
  act(() => {
    jest.advanceTimersByTime(50);
  });
  expect(screen.queryByText('close-smart-note')).not.toBeInTheDocument();
  rerender(
    <SmartNotesPanel
      onClose={onClose}
      smartNoteClient={{ id: 'client-1' }}
      smartNoteSession={smartNoteSession}
      showCloseButton
    />,
  );
  await waitFor(() => expect(screen.getByText('close-smart-note')).toBeInTheDocument());
  fireEvent.click(screen.getByText('close-smart-note'));
  expect(onClose).toHaveBeenCalled();
  rerender(
    <SmartNotesPanel
      onClose={onClose}
      smartNoteClient={{ id: 'client-1' }}
      smartNoteSession={smartNoteSession}
      showCloseButton={false}
    />,
  );
  act(() => {
    jest.advanceTimersByTime(50);
  });
  expect(screen.queryByText('close-smart-note')).not.toBeInTheDocument();
  jest.useRealTimers();
  console.log.mockRestore();
  const update = jest.fn();
  const onClick = jest.fn();
  const launchMeeting = jest.fn();
  const { rerender: rerenderButton } = render(
    <MeetingScheduleButton
      currentLocale="en-US"
      meeting={{ saveAsDefault: false, topic: 'Planning' }}
      onClick={onClick}
      scheduleButtonLabel=""
      showLaunchMeetingBtn
      showSaveAsDefault
      update={update}
      launchMeeting={launchMeeting}
    />,
  );
  fireEvent.click(screen.getByLabelText('saveAsDefault'));
  fireEvent.click(screen.getByText('schedule'));
  fireEvent.click(screen.getByText('launchMeeting'));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ saveAsDefault: true }));
  expect(onClick).toHaveBeenCalled();
  expect(launchMeeting).toHaveBeenCalledWith(expect.objectContaining({ topic: 'Planning' }));
  rerenderButton(
    <MeetingScheduleButton
      currentLocale="en-US"
      disabled
      disableSaveAsDefault
      hidden
      meeting={{ saveAsDefault: true }}
      scheduleButtonLabel="Schedule now"
      showSaveAsDefault
      update={update}
    />,
  );
  expect(screen.getByText('prompt')).toBeInTheDocument();
  expect(screen.getByText('Schedule now')).toBeDisabled();
  expect(screen.getByLabelText('saveAsDefault')).toBeDisabled();
});

test('covers status message, navigation helper and call control button branches', () => {
  expect(render(<StatusMessage />).container).toBeEmptyDOMElement();
  expect(render(<StatusMessage statusMatch={{ message: '', status: 'pending' }} />).container).toBeEmptyDOMElement();
  const statuses = render(
    <div>
      <StatusMessage statusMatch={{ message: 'pending text', status: 'pending' }} />
      <StatusMessage statusMatch={{ message: 'failed text', status: 'failed' }} />
      <StatusMessage statusMatch={{ message: 'success text', status: 'success' }} />
      <StatusMessage statusMatch={{ message: 'neutral text', status: 'other' }} />
    </div>,
  );
  expect(statuses.getByText('pending text')).toBeInTheDocument();
  const ElementIcon = (props) => <span data-active={props.active}>element-icon</span>;
  const FunctionIcon = (props) => <span data-active={String(props.active)} data-path={props.currentPath || ''}>function-icon</span>;
  expect(getTabInfo({
    currentPath: '/home',
    tab: {
      activeIcon: <ElementIcon />,
      icon: <ElementIcon />,
      isActive: (path) => path === '/home',
    },
  }).icon.props.active).toBe('true');
  const childTabInfo = getTabInfo({
    currentPath: '/child',
    tab: {
      childTabs: [{}],
      icon: FunctionIcon,
      isActive: () => false,
    },
  });
  expect(childTabInfo.active).toBe(false);
  expect(childTabInfo.icon.props.currentPath).toBe('/child');
  expect(getTabInfo({ currentPath: '/none', tab: {} }).icon).toBeUndefined();
  const onClick = jest.fn();
  const { rerender } = render(
    <CallCtrlButton
      active
      activeColor=""
      color=""
      dataSign="mute"
      onClick={onClick}
      showRipple
      title="Mute"
    />,
  );
  fireEvent.click(screen.getByText('Mute'));
  expect(onClick).toHaveBeenCalled();
  expect(screen.getByText('icon-button')).toHaveAttribute('data-color', 'interactive.b01');
  expect(screen.getAllByTestId('styled-div').length).toBeGreaterThan(0);
  rerender(
    <CallCtrlButton
      active={false}
      activeColor="success.f02"
      color="neutral.f02"
      disabled
      title="Disabled"
    />,
  );
  expect(screen.getByText('Disabled')).toBeInTheDocument();
  expect(screen.getByText('icon-button')).toBeDisabled();
  expect(screen.getByText('icon-button')).toHaveAttribute('data-color', 'neutral.f02');
});
