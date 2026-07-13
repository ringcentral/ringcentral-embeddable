/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import calleeTypes from '@ringcentral-integration/commons/enums/calleeTypes';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import { AssignDialog } from '../../src/components/AssignDialog';
import GlipTeamCreationModal from '../../src/components/GlipGroupsPanel/CreationModal';
import { NotificationItem, getLevelType } from '../../src/components/NotificationPanel/NotificationItem';
import { Ringtone } from '../../src/components/RingtoneSettingsPanel/Ringtone';
import UpcomingMeetingList from '../../src/components/UpcomingMeetingList';
import { CallDetailsPanel } from '../../src/components/CallDetailsPanel';
import { GlipPostList } from '../../src/components/GlipChatPanel/GlipPostList';
import MergeInfo from '../../src/components/CallCtrlPanel/ActiveCallPanel/MergeInfo';
import {
  CompanySection,
  EmailSection,
  PhoneSection,
  SiteSection,
} from '../../src/components/ContactDetailsView/DetailSections';
import { ConversationInfo } from '../../src/components/LogMessagesPanel/ConversationInfo';

jest.mock('@ringcentral-integration/widgets/lib/handleCopy', () => ({
  handleCopy: jest.fn(),
}));

jest.mock('../../src/components/UpcomingMeetingList/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/Ringtone/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ActiveCallPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ContactDetails/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/MessageItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/NotificationPanel/styles.scss', () => ({
  backdrop: 'backdrop',
  container: 'container',
  snackbar: 'snackbar',
}));

jest.mock('@ringcentral-integration/widgets/components/CallItem/styles.scss', () => ({
  contactDisplay: 'contactDisplay',
  dropdownSelect: 'dropdownSelect',
  missed: 'missed',
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    Attachment: createIcon('Attachment'),
    Close: createIcon('Close'),
    Copy: createIcon('Copy'),
    Delete: createIcon('Delete'),
    InfoBorder: createIcon('InfoBorder'),
    Pause: createIcon('Pause'),
    Play: createIcon('Play'),
    Search: createIcon('Search'),
    Apps: createIcon('Apps'),
    CallsBorder: createIcon('CallsBorder'),
    Conference: createIcon('Conference'),
    People: createIcon('People'),
    PhoneBorder: createIcon('PhoneBorder'),
    SmsBorder: createIcon('SmsBorder'),
    TodayCalendarIco: createIcon('TodayCalendarIco'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'InputProps',
        'clearBtn',
        'color',
        'container',
        'disableTypography',
        'focused',
        'fullScreen',
        'fullWidth',
        'item',
        'loading',
        'radius',
        'severity',
        'size',
        'symbol',
        'variant',
        'xs',
      ].includes(key)
    ) {
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
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.a = () => createComponent('a', 'styled-a');
  styled.div = () => createComponent('div', 'styled-div');
  styled.input = () => React.forwardRef((props, ref) => (
    <input {...cleanProps(props)} ref={ref} data-testid={props['data-testid'] || props.type || 'styled-input'} />
  ));
  const RcIconButton = ({ onClick, title }) => (
    <button type="button" onClick={onClick}>
      {title || 'icon-button'}
    </button>
  );
  return {
    RcAlert: createComponent('div', 'alert'),
    RcAvatar: createComponent('span', 'avatar'),
    RcButton: ({ children, disabled, loading, onClick }) => (
      <button disabled={disabled || loading} type="button" onClick={onClick}>
        {children}
      </button>
    ),
    RcCard: createComponent('div', 'card'),
    RcCardContent: createComponent('div', 'card-content'),
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
    RcDownshift: ({ onChange, onInputChange, options = [], renderOption }) => (
      <div>
        <input
          data-sign="downshift-input"
          data-testid="downshift-input"
          onChange={(event) => onInputChange(event.target.value)}
        />
        <button
          type="button"
          onClick={() => onChange(options.slice(0, 2))}
        >
          select-downshift
        </button>
        {options.map((option, index) => renderOption({
          ...option,
          onClick: () => onChange([option]),
        }, { highlighted: false, index }))}
      </div>
    ),
    RcGrid: createComponent('div', 'grid'),
    RcIcon: createComponent('span', 'icon'),
    RcIconButton,
    RcLink: createComponent('span', 'link'),
    RcList: createComponent('div', 'list'),
    RcListItemAvatar: createComponent('span', 'list-item-avatar'),
    RcListItemIcon: createComponent('span', 'list-item-icon'),
    RcListItemSecondaryAction: createComponent('span', 'list-item-secondary-action'),
    RcListItem: ({ children, disabled, onClick, ...props }) => (
      <button
        {...cleanProps(props)}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
    ),
    RcListItemText: ({ primary, secondary }) => (
      <span>
        <span>{primary}</span>
        <span>{secondary}</span>
      </span>
    ),
    RcLoading: ({ children, loading }) => (
      <div>
        {loading ? <span>loading</span> : null}
        {children}
      </div>
    ),
    RcMenuItem: ({ children, onClick }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    RcSnackbarAction: ({ children, onClick }) => (
      <button type="button" onClick={onClick}>
        {children || 'snackbar-action'}
      </button>
    ),
    RcSnackbarContent: ({ action, message, type }) => (
      <section data-sign="notification" data-type={type}>
        <div>{message}</div>
        <div>{action}</div>
      </section>
    ),
    RcText: createComponent('span', 'text'),
    RcTextField: React.forwardRef((props, ref) => (
      <input
        {...cleanProps(props)}
        ref={ref}
        data-sign={props['data-sign']}
        data-testid={props['data-testid'] || props['data-sign'] || props.placeholder || 'text-field'}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
      />
    )),
    RcTooltip: ({ children, title }) => (
      <span title={title}>{children}</span>
    ),
    RcTypography: createComponent('span', 'typography'),
    Virtuoso: React.forwardRef(({
      data = [],
      itemContent,
      rangeChanged,
      totalCount,
    }, ref) => {
      const scrollToIndex = jest.fn();
      React.useImperativeHandle(ref, () => ({ scrollToIndex }));
      global.__virtuosoScrollToIndex = scrollToIndex;
      return (
        <div data-testid="virtuoso" data-total={totalCount}>
          <button
            type="button"
            onClick={() => rangeChanged({ startIndex: 0, endIndex: 1 })}
          >
            range-top
          </button>
          <button
            type="button"
            onClick={() => rangeChanged({ startIndex: 3, endIndex: 4 })}
          >
            range-bottom
          </button>
          {data.map((post, index) => (
            <div key={post.id || index}>{itemContent(index, post)}</div>
          ))}
        </div>
      );
    }),
    combineProps: (...items) => Object.assign({}, ...items),
    css: jest.fn(() => ''),
    ellipsis: jest.fn(() => ''),
    getParsePaletteColor: jest.fn(() => '#000'),
    palette2: jest.fn(() => '#000'),
    setOpacity: jest.fn(() => '#000'),
    shadows: jest.fn(() => 'none'),
    styled,
    useAudio: jest.fn((onInit) => {
      const audio = global.__testAudio || {
        currentTime: 0,
        pause: jest.fn(),
        paused: true,
        play: jest.fn(async () => {}),
        setSinkId: jest.fn(async () => {}),
        src: '',
        volume: 0,
      };
      if (onInit) {
        onInit(audio);
      }
      return audio;
    }),
    useAvatarShortName: jest.fn(({ firstName = '', lastName = '' }) => (
      `${firstName.charAt(0)}${lastName.charAt(0)}`
    )),
    useMountState: jest.fn(() => ({ current: true })),
  };
});

jest.mock('@ringcentral/juno/foundation', () => {
  const { palette2, styled } = require('@ringcentral/juno');
  return {
    palette2,
    styled,
  };
});

jest.mock('../../src/components/ActionMenu', () => ({
  ActionMenu: ({ actions = [], onMoreMenuOpen }) => (
    <div>
      <button type="button" onClick={() => onMoreMenuOpen(true)}>open-more</button>
      {actions.map((action) => (
        <button
          key={action.title}
          disabled={action.disabled}
          type="button"
          onClick={action.onClick}
        >
          {action.title}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/ContactDisplay', () => (
  ({ onSelectContact, phoneNumber, fallBackName }) => (
    <div>
      <span>{phoneNumber || 'hidden-number'}</span>
      <span>{fallBackName}</span>
      <button type="button" onClick={() => onSelectContact(null, '2')}>
        select-contact
      </button>
    </div>
  )
));

jest.mock('../../src/components/ConversationItem/ConversationIcon', () => ({
  ConversationIcon: ({ direction, group, type }) => (
    <span>{`conversation-icon:${type}:${direction}:${String(group)}`}</span>
  ),
}));

jest.mock('@ringcentral-integration/widgets/react-hooks/usePromise', () => (
  () => (promise) => promise
));

jest.mock('@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber', () => ({
  checkShouldHidePhoneNumber: jest.fn(() => false),
}));

jest.mock('../../src/components/AudioPlayer', () => ({
  AudioPlayer: ({ uri }) => <div>audio:{uri}</div>,
}));

jest.mock('../../src/components/CallItem/CallIcon', () => ({
  CallIcon: ({ direction }) => <div>icon:{direction}</div>,
}));

jest.mock('../../src/components/CallItem/helper', () => ({
  getActions: jest.fn((options) => [
    {
      id: 'log',
      title: 'Log',
      onClick: () => options.logCall(true, options.selected, 'manual'),
    },
    {
      id: 'create',
      title: 'Create',
      onClick: () => options.createSelectedContact('lead'),
    },
    {
      id: 'download',
      title: 'Download',
      icon: 'download',
      onClick: options.onDownload,
    },
    {
      id: 'extra',
      title: 'Extra',
      onClick: () => options.onClickAdditionalAction('extra', options.call),
    },
  ]),
  getContactMatches: jest.fn(() => [{ id: 'contact-1' }]),
  getFallbackContactName: jest.fn(() => 'Fallback Name'),
  getInitialContactIndex: jest.fn(() => 0),
  getPhoneNumber: jest.fn(() => '+16505550123'),
  getSelectedContact: jest.fn(() => ({ id: 'contact-1' })),
}));

jest.mock('../../src/components/GlipChatPanel/GlipPostItem', () => ({
  GlipPostItem: ({
    creationTime,
    post,
    showCreator,
    viewProfile,
  }) => (
    <button type="button" onClick={() => viewProfile(post.creatorId)}>
      {post.id}:{creationTime}:{String(showCreator)}
    </button>
  ),
}));

const { handleCopy } = require('@ringcentral-integration/widgets/lib/handleCopy');

describe('more component flows', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    window.open = jest.fn();
    global.__testAudio = {
      currentTime: 0,
      pause: jest.fn(),
      paused: true,
      play: jest.fn(async () => {}),
      setSinkId: jest.fn(async () => {}),
      src: '',
      volume: 0,
    };
    global.FileReader = class TestFileReader {
      readAsDataURL() {
        this.result = 'data:audio/wav;base64,test';
        this.onload();
      }
    };
  });

  afterEach(() => {
    delete global.__testAudio;
    delete global.FileReader;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('groups upcoming meetings and handles join, details, copy, and all-day rows', () => {
    const onJoin = jest.fn();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    render(
      <UpcomingMeetingList
        currentLocale="en-US"
        meetings={[
          {
            editEventUrl: 'https://calendar.example.com/event-1',
            endTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
            id: 'meeting-1',
            isAllDay: false,
            location: 'Room; https://meet.example.com/join/12345?pwd=abc',
            startTime: now.toISOString(),
            title: 'Daily standup',
          },
          {
            editEventUrl: 'https://calendar.example.com/event-2',
            endTime: tomorrow.toISOString(),
            id: 'meeting-2',
            isAllDay: true,
            location: 'Office',
            startTime: tomorrow.toISOString(),
            title: 'Planning day',
          },
        ]}
        onJoin={onJoin}
      />,
    );

    expect(screen.getByText('today')).toBeTruthy();
    expect(screen.getByText('Daily standup')).toBeTruthy();
    expect(screen.getByText('Planning day')).toBeTruthy();
    expect(screen.getByText('allDay')).toBeTruthy();
    fireEvent.click(screen.getByText('join'));
    expect(onJoin).toHaveBeenCalledWith('https://meet.example.com/join/12345?pwd=abc');
    fireEvent.click(screen.getAllByText('details')[0]);
    expect(window.open).toHaveBeenCalledWith('https://calendar.example.com/event-1');
    fireEvent.click(screen.getByText('copy'));
    expect(handleCopy).toHaveBeenCalledWith('https://meet.example.com/join/12345?pwd=abc');
    fireEvent.click(screen.getAllByText('open-more')[0]);
  });

  it('plays, uploads, resets, and hides ringtone settings', async () => {
    const setIncomingAudio = jest.fn();
    const resetIncomingAudio = jest.fn();
    const { container, rerender } = render(
      <Ringtone
        currentLocale="en-US"
        defaultIncomingAudio="default-data"
        defaultIncomingAudioFile="default.wav"
        incomingAudio="custom-data"
        incomingAudioFile="custom.wav"
        resetIncomingAudio={resetIncomingAudio}
        ringtoneDeviceId="speaker-1"
        ringtoneVolume={0.7}
        setIncomingAudio={setIncomingAudio}
        showRingToneSettings
      />,
    );

    expect(screen.getByText('Incoming ringtone')).toBeTruthy();
    expect(screen.getByText('custom.wav')).toBeTruthy();
    fireEvent.click(screen.getByText('play'));
    await waitFor(() => {
      expect(global.__testAudio.setSinkId).toHaveBeenCalledWith('speaker-1');
      expect(global.__testAudio.play).toHaveBeenCalled();
    });
    expect(global.__testAudio.volume).toBe(0.7);
    fireEvent.click(screen.getByText('reset'));
    expect(resetIncomingAudio).toHaveBeenCalled();

    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['audio'], 'tone.wav', { type: 'audio/wav' })],
    });
    fireEvent.change(input);
    expect(setIncomingAudio).toHaveBeenCalledWith({
      dataUrl: 'data:audio/wav;base64,test',
      fileName: 'tone.wav',
    });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File([new ArrayBuffer(9 * 1024 * 1024)], 'large.wav')],
    });
    fireEvent.change(input);
    expect(console.error).toHaveBeenCalledWith('input file is too big, select a file less than 8mb');

    rerender(
      <Ringtone
        currentLocale="en-US"
        defaultIncomingAudio="default-data"
        defaultIncomingAudioFile="default.wav"
        incomingAudio="default-data"
        incomingAudioFile="default.wav"
        resetIncomingAudio={resetIncomingAudio}
        setIncomingAudio={setIncomingAudio}
        showRingToneSettings={false}
      />,
    );
    expect(screen.queryByText('Incoming ringtone')).toBeNull();
  });

  it('handles ringtone default audio values and playback fallbacks', async () => {
    const setIncomingAudio = jest.fn();
    const resetIncomingAudio = jest.fn();
    global.__testAudio.setSinkId = undefined;
    global.__testAudio.play = jest.fn(async () => {
      throw new Error('play failed');
    });
    const { rerender } = render(
      <Ringtone
        currentLocale="en-US"
        resetIncomingAudio={resetIncomingAudio}
        setIncomingAudio={setIncomingAudio}
        showRingToneSettings
      />,
    );

    fireEvent.click(screen.getByText('play'));
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
      expect(console.log).toHaveBeenCalledWith('Failed to play audio, please select a different file');
    });
    expect(global.__testAudio.volume).toBe(0.5);

    global.__testAudio.play = jest.fn(async () => {
      global.__testAudio.onplay();
    });
    rerender(
      <Ringtone
        currentLocale="en-US"
        defaultIncomingAudio="default-data"
        defaultIncomingAudioFile="default.wav"
        incomingAudio="default-data"
        incomingAudioFile="default.wav"
        resetIncomingAudio={resetIncomingAudio}
        ringtoneVolume={0}
        setIncomingAudio={setIncomingAudio}
        showRingToneSettings
      />,
    );
    expect(screen.queryByText('reset')).toBeNull();
    fireEvent.click(screen.getByText('play'));
    await waitFor(() => {
      expect(screen.getByText('stop')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('stop'));
    expect(global.__testAudio.pause).toHaveBeenCalled();
  });

  it('renders notification items, levels, details, countdown, backdrop, dismiss, and null renderer path', () => {
    jest.useFakeTimers();
    expect(getLevelType('warning')).toBe('warn');
    expect(getLevelType('danger')).toBe('error');
    expect(getLevelType('success')).toBe('success');
    const dismiss = jest.fn();
    const cancelAutoDismiss = jest.fn();
    const onBackdropClick = jest.fn();
    const Message = ({ message, showMore }) => (
      <span>{`${message.id}-${showMore ? 'more' : 'less'}`}</span>
    );
    const { rerender } = render(
      <NotificationItem
        brand="RingCentral"
        cancelAutoDismiss={cancelAutoDismiss}
        currentLocale="en-US"
        data={{
          backdrop: true,
          id: 'alert-1',
          level: 'warning',
          onBackdropClick,
          payload: { details: ['line 1'] },
          ttl: 2000,
        }}
        dismiss={dismiss}
        getRenderer={() => Message}
      />,
    );

    expect(screen.getByText('alert-1-less')).toBeTruthy();
    expect(screen.getByText('Show more')).toBeTruthy();
    expect(screen.getByText('Closing in 2 sec...')).toBeTruthy();
    fireEvent.click(screen.getByText('Show more'));
    expect(cancelAutoDismiss).toHaveBeenCalledWith('alert-1');
    expect(screen.getByText('alert-1-more')).toBeTruthy();
    fireEvent.click(screen.getByText('snackbar-action'));
    expect(dismiss).toHaveBeenCalledWith('alert-1');
    jest.advanceTimersByTime(1000);

    rerender(
      <NotificationItem
        brand="RingCentral"
        cancelAutoDismiss={cancelAutoDismiss}
        currentLocale="en-US"
        data={{ id: 'alert-2', level: 'info' }}
        dismiss={dismiss}
        getRenderer={() => null}
      />,
    );
    expect(screen.queryByText('alert-2-less')).toBeNull();
    jest.useRealTimers();
  });

  it('creates Glip teams, resets on cancel, filters contacts, and shows create errors', async () => {
    const closeModal = jest.fn();
    const createTeam = jest.fn(async () => {});
    const updateFilter = jest.fn();
    const contacts = [
      { emails: ['ada@example.com'], id: '1', name: 'Ada' },
      { email: 'grace@example.com', emails: ['grace@example.com'], id: '2', name: 'Grace' },
      { emails: [], id: '3', name: 'No Email' },
    ];
    const { rerender } = render(
      <GlipTeamCreationModal
        closeModal={closeModal}
        createTeam={createTeam}
        filteredContacts={contacts}
        searchFilter="ada"
        show
        updateFilter={updateFilter}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Team name'), {
      target: { value: 'Engineering' },
    });
    fireEvent.change(screen.getByTestId('downshift-input'), {
      target: { value: 'ada' },
    });
    expect(updateFilter).toHaveBeenCalledWith('ada');
    fireEvent.click(screen.getByText('select-downshift'));
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => {
      expect(createTeam).toHaveBeenCalledWith({
        selectedContacts: [
          { email: 'ada@example.com', name: 'Ada' },
          { email: 'grace@example.com', name: 'Grace' },
        ],
        teamName: 'Engineering',
      });
      expect(closeModal).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('Cancel'));
    expect(updateFilter).toHaveBeenCalledWith('');

    createTeam.mockRejectedValueOnce(new Error('create failed'));
    rerender(
      <GlipTeamCreationModal
        closeModal={closeModal}
        createTeam={createTeam}
        filteredContacts={contacts}
        searchFilter="ada"
        show
        updateFilter={updateFilter}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Team name'), {
      target: { value: 'Support' },
    });
    fireEvent.click(screen.getByText('select-downshift'));
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => {
      expect(screen.getByText('create failed')).toBeTruthy();
    });
  });

  it('loads assign recipients, filters, assigns, no-ops current assignee, and handles errors', async () => {
    const getSMSRecipients = jest.fn(async () => [
      { assignable: true, extensionNumber: '101', id: '101', name: 'Ada' },
      { assignable: false, extensionNumber: '102', id: '102', name: 'Grace' },
      { assignable: true, extensionNumber: '103', id: '103', name: 'Linus' },
    ]);
    const onAssign = jest.fn(async () => {});
    const onCancel = jest.fn();
    const { rerender } = render(
      <AssignDialog
        currentAssignee={{ extensionId: '101' }}
        getSMSRecipients={getSMSRecipients}
        onAssign={onAssign}
        onCancel={onCancel}
        open
      />,
    );

    await waitFor(() => {
      expect(getSMSRecipients).toHaveBeenCalled();
      expect(screen.getByText('Grace')).toBeTruthy();
      expect(screen.getByText('Linus')).toBeTruthy();
    });
    expect(screen.queryByText('Ada')).toBeNull();
    fireEvent.change(screen.getByTestId('searchInput'), {
      target: { value: 'Lin' },
    });
    expect(screen.getByText('Linus')).toBeTruthy();
    expect(screen.queryByText('Grace')).toBeNull();
    fireEvent.click(screen.getByText('Linus'));
    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith({ extensionId: '103' });
      expect(onCancel).toHaveBeenCalled();
    });

    onAssign.mockRejectedValueOnce(new Error('assign failed'));
    fireEvent.click(screen.getByText('Linus'));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to assign conversation:', expect.any(Error));
    });
    fireEvent.click(screen.getByText('dialog-close'));
    expect(onCancel).toHaveBeenCalled();

    getSMSRecipients.mockRejectedValueOnce(new Error('load failed'));
    rerender(
      <AssignDialog
        currentAssignee={null}
        getSMSRecipients={getSMSRecipients}
        onAssign={onAssign}
        onCancel={onCancel}
        open={false}
      />,
    );
    rerender(
      <AssignDialog
        currentAssignee={null}
        getSMSRecipients={getSMSRecipients}
        onAssign={onAssign}
        onCancel={onCancel}
        open
      />,
    );
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load SMS recipients:', expect.any(Error));
      expect(screen.getByText('No contacts available')).toBeTruthy();
    });
  });

  it('renders call details, contact changes, logging, creation, download, and extra actions', async () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const onViewCall = jest.fn();
    const onLogCall = jest.fn(async () => {});
    const onCreateContact = jest.fn(async () => {});
    const onClickAdditionalAction = jest.fn();
    const call = {
      direction: 'Outbound',
      from: {
        phoneNumber: '+16505550100',
      },
      id: 'call-1',
      startTime: 1000,
      to: {
        phoneNumber: '+16505550123',
      },
      type: 'Voice',
    };

    render(
      <CallDetailsPanel
        aiNoted
        areaCode="650"
        autoLog
        brand="RingCentral"
        call={call}
        countryCode="US"
        currentLocale="en-US"
        dateTimeFormatter={() => 'formatted-date'}
        enableCDC
        enableContactFallback
        formatPhone={(phoneNumber) => `formatted-${phoneNumber}`}
        internalSmsPermission
        isLoggedContact={() => false}
        isLogging={false}
        onClickAdditionalAction={onClickAdditionalAction}
        onCreateContact={onCreateContact}
        onLogCall={onLogCall}
        onViewCall={onViewCall}
        outboundSmsPermission
        readTextPermission
        recording={{ contentUri: 'https://example.com/recording' }}
        showLogButton
        telephonySessionId="telephony-1"
      />,
    );

    expect(onViewCall).toHaveBeenCalledWith('telephony-1');
    expect(screen.getByText('formatted-date')).toBeTruthy();
    expect(screen.getByText('audio:https://example.com/recording')).toBeTruthy();
    fireEvent.click(screen.getByText('select-contact'));
    await waitFor(() => {
      expect(onLogCall).toHaveBeenCalledWith({
        call,
        contact: { id: 'contact-1' },
        redirect: false,
        triggerType: 'contactUpdated',
      });
    });
    fireEvent.click(screen.getByText('Log'));
    await waitFor(() => {
      expect(onLogCall).toHaveBeenCalledWith({
        call,
        contact: { id: 'contact-1' },
        redirect: true,
        triggerType: 'manual',
      });
    });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => {
      expect(onCreateContact).toHaveBeenCalledWith({
        entityType: 'lead',
        name: 'Fallback Name',
        phoneNumber: '+16505550123',
      });
    });
    fireEvent.click(screen.getByText('Download'));
    expect(clickSpy).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Extra'));
    expect(onClickAdditionalAction).toHaveBeenCalledWith('extra', call);
  });

  it('renders call details with default optional props', () => {
    const onViewCall = jest.fn();
    const call = {
      direction: 'Inbound',
      from: {
        phoneNumber: '+16505550123',
      },
      id: 'call-defaults',
      startTime: 2000,
      to: {
        phoneNumber: '+16505550100',
      },
      type: 'Voice',
    };

    render(
      <CallDetailsPanel
        areaCode="650"
        brand="RingCentral"
        call={call}
        countryCode="US"
        currentLocale="en-US"
        dateTimeFormatter={() => 'default-date'}
        onViewCall={onViewCall}
        recording={{ contentUri: '' }}
        telephonySessionId="telephony-default"
      />,
    );

    expect(onViewCall).toHaveBeenCalledWith('telephony-default');
    expect(screen.getByText('default-date')).toBeTruthy();
    expect(screen.getByText('icon:Inbound')).toBeTruthy();
    fireEvent.click(screen.getByText('select-contact'));
    fireEvent.click(screen.getByText('Log'));
    fireEvent.click(screen.getByText('Create'));
  });

  it('renders glip posts, loads earlier pages at the top, and preserves scroll position', async () => {
    jest.useFakeTimers();
    const posts = [
      {
        creationTime: '2026-01-01T00:00:00Z',
        creatorId: 'person-1',
        id: 'post-1',
        type: 'TextMessage',
      },
      {
        creationTime: '2026-01-01T00:00:30Z',
        creatorId: 'person-1',
        id: 'post-2',
        type: 'TextMessage',
      },
    ];
    const loadNextPage = jest.fn(async () => {});
    const viewProfile = jest.fn();
    const { rerender, unmount } = render(
      <GlipPostList
        dateTimeFormatter={(time) => `formatted-${time}`}
        groupId="group-1"
        loadNextPage={loadNextPage}
        posts={posts}
        viewProfile={viewProfile}
      />,
    );

    expect(screen.getByText('post-1:formatted-2026-01-01T00:00:00Z:true')).toBeTruthy();
    expect(screen.getByText('post-2:formatted-2026-01-01T00:00:30Z:false')).toBeTruthy();
    fireEvent.click(screen.getByText('range-bottom'));
    fireEvent.click(screen.getByText('range-top'));
    await waitFor(() => {
      expect(loadNextPage).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText('post-1:formatted-2026-01-01T00:00:00Z:true'));
    expect(viewProfile).toHaveBeenCalledWith('person-1');

    rerender(
      <GlipPostList
        dateTimeFormatter={(time) => `formatted-${time}`}
        groupId="group-1"
        loadNextPage={loadNextPage}
        posts={[
          {
            creationTime: '2025-12-31T23:59:00Z',
            creatorId: 'person-2',
            id: 'post-0',
            type: 'TextMessage',
          },
          ...posts,
        ]}
        viewProfile={viewProfile}
      />,
    );
    jest.advanceTimersByTime(1000);
    expect(global.__virtuosoScrollToIndex).toHaveBeenCalledWith({
      behavior: 'smooth',
      align: 'end',
      index: 2,
    });
    unmount();
    jest.useRealTimers();
  });

  it('renders contact detail sections and dispatches phone/email actions', () => {
    const onClickToDial = jest.fn();
    const onClickToSMS = jest.fn();
    const onClickAdditionalAction = jest.fn();
    const onClickMailTo = jest.fn();
    const contact = {
      id: 'contact-1',
      phoneNumbers: [
        {
          phoneNumber: '+16505550100',
          phoneType: 'direct',
          rawPhoneNumber: '(650) 555-0100',
        },
        {
          phoneNumber: '101',
          phoneType: 'extension',
        },
      ],
    };

    const { rerender } = render(
      <PhoneSection
        additionalActions={[{ id: 'history', icon: 'clock', label: 'History' }]}
        canCallButtonShow={() => true}
        canTextButtonShow={(phoneType) => phoneType !== 'extension'}
        contact={contact}
        currentLocale="en-US"
        disableLinks={false}
        formatNumber={(number) => `formatted-${number}`}
        isCallButtonDisabled={false}
        isMultipleSiteEnabled
        onClickAdditionalAction={onClickAdditionalAction}
        onClickToDial={onClickToDial}
        onClickToSMS={onClickToSMS}
      />,
    );

    fireEvent.click(screen.getByText('call +16505550100'));
    expect(onClickToDial).toHaveBeenCalledWith(contact, '+16505550100');
    fireEvent.click(screen.getByText('text +16505550100'));
    expect(onClickToSMS).toHaveBeenCalledWith(contact, '+16505550100');
    fireEvent.click(screen.getAllByText('History')[0]);
    expect(onClickAdditionalAction).toHaveBeenCalledWith(
      'history',
      expect.objectContaining({ id: 'contact-1' }),
    );

    rerender(
      <EmailSection
        contactType="company"
        currentLocale="en-US"
        emails={['agent@example.com']}
        onClickMailTo={onClickMailTo}
      />,
    );
    fireEvent.click(screen.getByText('agent@example.com'));
    expect(onClickMailTo).toHaveBeenCalledWith('agent@example.com', 'company');

    rerender(
      <CompanySection
        company="RingCentral"
        currentLocale="en-US"
        department="Support"
      />,
    );
    expect(screen.getByText('Support')).toBeTruthy();
    expect(screen.getByText('RingCentral')).toBeTruthy();

    rerender(
      <SiteSection
        currentLocale="en-US"
        isMultipleSiteEnabled
        site={{ name: 'HQ' }}
      />,
    );
    expect(screen.getByText('HQ')).toBeTruthy();

    rerender(
      <PhoneSection
        canCallButtonShow={() => false}
        canTextButtonShow={() => false}
        contact={{ phoneNumbers: [] }}
        currentLocale="en-US"
        formatNumber={(number) => number}
        onClickToDial={onClickToDial}
        onClickToSMS={onClickToSMS}
      />,
    );
    expect(screen.queryByText('call +16505550100')).toBeNull();
  });

  it('renders conversation info summaries for voicemail, fax, and message logs', () => {
    const baseProps = {
      currentLocale: 'en-US',
      dateTimeFormatter: jest.fn(() => 'formatted-date'),
      formatPhone: (phoneNumber) => `formatted-${phoneNumber}`,
    };
    const { rerender, container } = render(
      <ConversationInfo
        {...baseProps}
        conversationLog={{}}
      />,
    );
    expect(container.textContent).toBe('');

    rerender(
      <ConversationInfo
        {...baseProps}
        conversationLog={{
          Today: {
            correspondents: [{ phoneNumber: '+16505550100' }],
            creationTime: 1000,
            direction: messageDirection.inbound,
            messages: [{
              attachments: [{ vmDuration: 65 }],
            }],
            type: messageTypes.voiceMail,
          },
        }}
      />,
    );
    expect(screen.getByText('formatted-+16505550100')).toBeTruthy();
    expect(screen.getByText('voiceMessage (01:05)')).toBeTruthy();
    expect(screen.getByText('formatted-date')).toBeTruthy();

    rerender(
      <ConversationInfo
        {...baseProps}
        conversationLog={{
          Yesterday: {
            correspondents: [{ extensionNumber: '101' }],
            creationTime: 2000,
            direction: messageDirection.inbound,
            messages: [{
              direction: messageDirection.inbound,
              faxPageCount: '2',
            }],
            type: messageTypes.fax,
          },
        }}
      />,
    );
    expect(screen.getByText('faxReceived(2 pages)')).toBeTruthy();

    rerender(
      <ConversationInfo
        {...baseProps}
        conversationLog={{
          Monday: {
            correspondents: [{ phoneNumber: '+1' }, { phoneNumber: '+2' }],
            creationTime: 3000,
            direction: messageDirection.outbound,
            messages: [{ id: 'm1' }],
            type: messageTypes.sms,
          },
          Tuesday: {
            correspondents: [{ phoneNumber: '+1' }],
            creationTime: 4000,
            direction: messageDirection.outbound,
            messages: [{ id: 'm2' }, { id: 'm3' }],
            type: messageTypes.sms,
          },
        }}
      />,
    );
    expect(screen.getByText('Total 3 messages')).toBeTruthy();
    expect(screen.getByText('Tuesday')).toBeTruthy();
  });

  it('renders merge info states for conference, ready, and timeout calls', async () => {
    jest.useFakeTimers();
    const { rerender, unmount } = render(
      <MergeInfo
        currentCallTitle="Current caller"
        currentLocale="en-US"
        formatPhone={(phoneNumber) => `formatted-${phoneNumber}`}
        lastCallInfo={null}
        timeCounter={<span>00:10</span>}
      />,
    );
    expect(screen.queryByText('Current caller')).toBeNull();

    rerender(
      <MergeInfo
        currentCallTitle="Current caller"
        currentLocale="en-US"
        formatPhone={(phoneNumber) => `formatted-${phoneNumber}`}
        lastCallInfo={{
          calleeType: calleeTypes.conference,
          status: sessionStatus.finished,
        }}
        timeCounter={<span>00:10</span>}
      />,
    );
    expect(screen.getByText('conferenceCall')).toBeTruthy();
    expect(screen.getByText('disconnected')).toBeTruthy();
    expect(screen.getByText('Current caller')).toBeTruthy();

    rerender(
      <MergeInfo
        currentCallTitle="Current caller"
        currentLocale="en-US"
        formatPhone={(phoneNumber) => `formatted-${phoneNumber}`}
        lastCallInfo={{
          calleeType: calleeTypes.contacts,
          name: 'Ada Lovelace',
          phoneNumber: '+16505550100',
          status: sessionStatus.hold,
        }}
        timeCounter={<span>00:11</span>}
      />,
    );
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('onHold')).toBeTruthy();

    unmount();
    const timeoutView = render(
      <MergeInfo
        checkLastCallInfoTimeout={10}
        currentCallTitle="Current caller"
        currentLocale="en-US"
        formatPhone={(phoneNumber) => `formatted-${phoneNumber}`}
        lastCallInfo={{
          calleeType: calleeTypes.unknown,
        }}
        timeCounter={<span>00:12</span>}
      />,
    );
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(screen.getByText('loadingTimeout')).toBeTruthy();
    timeoutView.unmount();
    jest.useRealTimers();
  });
});
