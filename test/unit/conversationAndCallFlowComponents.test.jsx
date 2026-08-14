/** @jest-environment jsdom */
import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import { CallItem } from '../../src/components/CallItem';
import { CallsListPanel } from '../../src/components/CallsListPanel';
import ComposeTextPanel from '../../src/components/ComposeTextPanel';
import { ConversationItem } from '../../src/components/ConversationItem';
import { ConversationPanel } from '../../src/components/ConversationPanel';
import { ConversationsPanel } from '../../src/components/ConversationsPanel';

jest.mock('@ringcentral-integration/commons/lib/debounce', () => (
  (callback) => callback
));

jest.mock('@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber', () => ({
  checkShouldHidePhoneNumber: jest.fn((phoneNumber) => phoneNumber === 'hidden'),
}));

jest.mock('@ringcentral-integration/widgets/react-hooks/usePromise', () => (
  jest.fn(() => (promise) => promise)
));

jest.mock('@ringcentral-integration/widgets/components/ContactDisplay', () => {
  const React = require('react');
  return function MockContactDisplay({
    contactMatches = [],
    disabled,
    fallBackName,
    phoneNumber,
    reference,
    selected,
    onSelectContact,
  }) {
    React.useEffect(() => {
      reference?.({ nodeName: 'CONTACT_DISPLAY' });
    }, [reference]);
    return (
      <button
        data-sign="contact-display"
        data-testid="contact-display"
        data-phone={phoneNumber || 'hidden'}
        disabled={disabled}
        type="button"
        onClick={() => onSelectContact?.(
          contactMatches[1] || contactMatches[0],
          '1',
        )}
      >
        {`contact:${fallBackName || 'none'}:${selected}`}
      </button>
    );
  };
});

jest.mock('@ringcentral-integration/widgets/components/DurationCounter', () => (
  function MockDurationCounter({ startTime, offset }) {
    return <span>{`duration:${startTime}:${offset}`}</span>;
  }
));

jest.mock('@ringcentral-integration/widgets/components/SpinnerOverlay', () => ({
  SpinnerOverlay: () => <span data-sign="spinner" data-testid="spinner">spinner</span>,
}));

jest.mock('@ringcentral-integration/widgets/components/ConversationPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ConversationsPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ConversationsPanel/widgets/NoMessage', () => (
  function MockNoMessage({ placeholder }) {
    return <span data-sign="no-message">{placeholder}</span>;
  }
));

jest.mock('@ringcentral-integration/widgets/components/MessageItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ActionMenuList/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/CallItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/CallsListPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ConversationPanel/styles.scss', () => ({
  alert: 'alert',
  contactDisplay: 'contactDisplay',
  contactDisplaySelect: 'contactDisplaySelect',
  root: 'root',
}));

jest.mock('@ringcentral-integration/widgets/components/MessageItem/styles.scss', () => ({
  contactDisplay: 'contactDisplay',
  dropdownSelect: 'dropdownSelect',
  selectedValue: 'selectedValue',
  unread: 'unread',
}));

jest.mock('@ringcentral-integration/widgets/components/CallItem/styles.scss', () => ({
  active: 'active',
  contactDisplay: 'contactDisplay',
  dropdownSelect: 'dropdownSelect',
  missed: 'missed',
}));

jest.mock('@ringcentral-integration/widgets/components/CallsListPanel/styles.scss', () => ({
  contactDisplay: 'contactDisplay',
  list: 'list',
  listTitle: 'listTitle',
  noCalls: 'noCalls',
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => {
    function MockIcon() {
      return <span data-icon={name} />;
    }
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    AddTextLog: createIcon('AddTextLog'),
    AiSmartNotes: createIcon('AiSmartNotes'),
    Check: createIcon('Check'),
    Close: createIcon('Close'),
    Disposition: createIcon('Disposition'),
    ExtensionLineBorder: createIcon('ExtensionLineBorder'),
    InfoBorder: createIcon('InfoBorder'),
    Logout: createIcon('Logout'),
    Notes: createIcon('Notes'),
    OuboundCallOnBehalf: createIcon('OuboundCallOnBehalf'),
    PlayCircleBorder: createIcon('PlayCircleBorder'),
    Previous: createIcon('Previous'),
    ThreadReply: createIcon('ThreadReply'),
  };
});

function mockCreateJunoMock() {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'color',
        'component',
        'currentLocale',
        'iconVariant',
        'primaryTypographyProps',
        'secondaryTypographyProps',
        'size',
        'symbol',
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
      'data-testid': props['data-testid'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, {
        ...cleanProps(props),
        ref,
        'data-sign': props['data-sign'] || `styled-${Component}`,
        'data-testid': props['data-testid'] || `styled-${Component}`,
      }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.a = () => createComponent('a', 'styled-a');
  styled.div = () => createComponent('div', 'styled-div');
  styled.span = () => createComponent('span', 'styled-span');
  return {
    RcAlert: createComponent('div', 'alert'),
    RcCheckbox: ({
      checked,
      disabled,
      label,
      onChange,
    }) => (
      <button
        disabled={disabled}
        type="button"
        onClick={() => onChange?.(null, !checked)}
      >
        {label}
      </button>
    ),
    RcIcon: ({ title }) => <span>{title || 'icon'}</span>,
    RcIconButton: ({ onClick, symbol, title }) => (
      <button type="button" onClick={onClick}>
        {title || symbol?.displayName || 'icon-button'}
      </button>
    ),
    RcListItem: createComponent('div', 'list-item'),
    RcListItemAvatar: createComponent('span', 'list-avatar'),
    RcListItemIcon: createComponent('span', 'list-icon'),
    RcListItemText: ({ onClick, primary, secondary }) => (
      <div data-sign="list-item-text" data-testid="list-item-text" onClick={onClick}>
        <div>{primary}</div>
        <div>{secondary}</div>
      </div>
    ),
    RcTooltip: ({ children }) => <span>{children}</span>,
    RcTypography: createComponent('span', 'typography'),
    ellipsis: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    styled,
    usePrevious: (getValue) => {
      const value = typeof getValue === 'function' ? getValue() : getValue;
      const previousRef = React.useRef();
      React.useEffect(() => {
        previousRef.current = value;
      }, [value]);
      return previousRef.current;
    },
  };
}

jest.mock('@ringcentral/juno', () => mockCreateJunoMock());

jest.mock('@ringcentral/juno/foundation', () => {
  const {
    ellipsis,
    palette2,
    styled,
  } = mockCreateJunoMock();
  return {
    ellipsis,
    palette2,
    styled,
  };
});

jest.mock('../../src/components/ActionMenu', () => ({
  ActionMenu: ({
    actions = [],
    onMoreMenuOpen,
  }) => (
    <div data-sign="action-menu" data-testid="action-menu">
      <button type="button" onClick={() => onMoreMenuOpen?.(true)}>
        open-more
      </button>
      {actions.map((action) => (
        <button
          data-sign={`action-${action.id}`}
          data-testid={`action-${action.id}`}
          disabled={action.disabled}
          key={action.id}
          type="button"
          onClick={action.onClick}
        >
          {action.title || action.id}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../src/components/BackHeader', () => ({
  BackHeader: ({
    children,
    hideBackButton,
    onBack,
  }) => (
    <section>
      {!hideBackButton ? <button type="button" onClick={onBack}>compose-back</button> : null}
      {children}
    </section>
  ),
}));

jest.mock('../../src/components/ComposeTextPanel/FromField', () => ({
  FromField: ({
    fromNumber,
    hidden,
    onChange,
  }) => (
    <button type="button" onClick={() => onChange('sender-2')}>
      {`compose-from:${String(hidden)}:${fromNumber || 'empty'}`}
    </button>
  ),
}));

jest.mock('../../src/components/ComposeTextPanel/NoTextPermission', () => ({
  NoTextPermission: () => <span>no-text-permission</span>,
}));

jest.mock('../../src/components/RecipientsInput', () => (
  function MockRecipientsInput({
    addToRecipients,
    onChange,
    onClean,
    removeFromRecipients,
    value,
  }) {
    return (
      <section data-sign="compose-recipients">
        <input
          aria-label="compose-recipient"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" onClick={() => addToRecipients({ phoneNumber: '+16505550123' })}>
          compose-add-recipient
        </button>
        <button type="button" onClick={() => removeFromRecipients('+16505550123')}>
          compose-remove-recipient
        </button>
        <button type="button" onClick={onClean}>
          compose-clean-recipient
        </button>
      </section>
    );
  }
));

jest.mock('../../src/components/MessageInput', () => ({
  __esModule: true,
  default: ({
    addAttachment,
    onChange,
    onClickAdditionalToolbarButton,
    onSend,
    removeAttachment,
    showTypingDuration,
    value,
  }) => (
    <section data-sign="message-input" data-testid="message-input">
      <span>{`input:${value}:${String(showTypingDuration)}`}</span>
      <button type="button" onClick={() => onChange('updated text')}>
        change-message
      </button>
      <button type="button" onClick={() => onSend('hello', [{ id: 'a1' }])}>
        send-message
      </button>
      <button type="button" onClick={() => addAttachment({ id: 'a2' })}>
        add-attachment
      </button>
      <button type="button" onClick={() => removeAttachment('a1')}>
        remove-attachment
      </button>
      <button type="button" onClick={() => onClickAdditionalToolbarButton?.({ id: 'crm' })}>
        toolbar
      </button>
    </section>
  ),
}));

jest.mock('../../src/components/ConversationMessageList', () => ({
  ConversationMessageList: ({
    loadPreviousMessages,
    messages,
    onAttachmentDownload,
    onLinkClick,
    onViewNote,
    messageLogStateMap = {},
    selectedMessageIds,
    selectionEnabled,
    showSender,
    statusReason,
  }) => (
    <section data-sign="conversation-message-list" data-testid="conversation-message-list">
      <span>{`messages:${messages.length}:${String(showSender)}:${statusReason || 'none'}`}</span>
      <span data-testid="granular-message-list-state">
        {`${String(selectionEnabled)}:${Object.keys(messageLogStateMap || {}).length}:${selectedMessageIds?.size ?? 0}`}
      </span>
      <button type="button" onClick={loadPreviousMessages}>
        load-previous
      </button>
      <button type="button" onClick={() => onAttachmentDownload?.({ id: 'file-1' })}>
        download-attachment
      </button>
      <button type="button" onClick={() => onLinkClick?.('https://example.com')}>
        link-click
      </button>
      <button type="button" onClick={onViewNote}>
        view-note
      </button>
    </section>
  ),
}));

jest.mock('../../src/components/ConversationPanel/GroupNumbersDisplay', () => ({
  GroupNumbersDisplay: ({ correspondents = [] }) => (
    <span data-sign="group-numbers" data-testid="group-numbers">{`group:${correspondents.length}`}</span>
  ),
}));

jest.mock('../../src/components/ConversationItem/AssignedBadge', () => ({
  AssignedFullBadge: ({ assignee, status }) => (
    <span>{`full-badge:${assignee?.extensionId || 'none'}:${status || 'none'}`}</span>
  ),
  AssignedShortBadge: ({ assignee }) => (
    <span>{`short-badge:${assignee?.extensionId || 'none'}`}</span>
  ),
  ResolvedShortBadge: ({ reason }) => <span>{`resolved:${reason || 'none'}`}</span>,
}));

jest.mock('../../src/components/AssignDialog', () => ({
  AssignDialog: ({
    getSMSRecipients,
    onAssign,
    onCancel,
    open,
  }) => (
    open ? (
      <section role="dialog">
        <button type="button" onClick={() => getSMSRecipients?.()}>
          get-recipients
        </button>
        <button type="button" onClick={() => onAssign({ extensionId: '202' })}>
          assign-confirm
        </button>
        <button type="button" onClick={onCancel}>
          assign-cancel
        </button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/ConversationList', () => ({
  __esModule: true,
  default: ({
    additionalActions = [],
    conversations = [],
    disableCallButton,
    disableLinks,
    loadNextPage,
    loadingNextPage,
    logButtonTitle,
    onAssignThread,
    onClickAdditionalAction,
    onResolveThread,
    onUnassignThread,
    ownerFilter,
    showLogButton,
    threadBusy,
  }) => (
    <section data-sign="conversation-list">
      <span>
        {[
          conversations.length,
          String(disableCallButton),
          String(disableLinks),
          String(loadingNextPage),
          String(showLogButton),
          logButtonTitle || 'none',
          ownerFilter || 'none',
          String(threadBusy),
        ].join(':')}
      </span>
      <button type="button" onClick={loadNextPage}>
        list-next
      </button>
      <button type="button" onClick={() => onAssignThread?.(conversations[0])}>
        list-assign
      </button>
      <button type="button" onClick={() => onUnassignThread?.(conversations[0])}>
        list-unassign
      </button>
      <button type="button" onClick={() => onResolveThread?.(conversations[0])}>
        list-resolve
      </button>
      {additionalActions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onClickAdditionalAction?.(action.id)}
        >
          {`action-${action.id}`}
        </button>
      ))}
    </section>
  ),
}));

jest.mock('../../src/components/SubTabs', () => ({
  SubTabs: ({
    onChange,
    tabs,
    value,
  }) => (
    <section data-sign="owner-tabs">
      <span>{`tabs:${tabs.length}:${value || 'none'}`}</span>
      <button type="button" onClick={() => onChange?.('mine')}>
        owner-change
      </button>
    </section>
  ),
}));

jest.mock('../../src/components/ConversationPanel/NotesDialog', () => ({
  NotesDialog: ({
    onClose,
    onCreateNote,
    onDeleteNote,
    onUpdateNote,
    open,
    readOnly,
  }) => (
    open ? (
      <section role="dialog">
        <span>{`notes:${String(readOnly)}`}</span>
        <button type="button" onClick={() => onCreateNote('new note')}>
          create-note
        </button>
        <button type="button" onClick={() => onUpdateNote('note-1', 'updated note')}>
          update-note
        </button>
        <button type="button" onClick={() => onDeleteNote('note-1')}>
          delete-note
        </button>
        <button type="button" onClick={onClose}>
          close-notes
        </button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/ConversationPanel/BottomAssignInfo', () => ({
  BottomAssignInfo: ({
    onAssign,
    onAssignToMe,
    onReply,
    status,
  }) => (
    <section data-sign="bottom-assign-info" data-testid="bottom-assign-info">
      <span>{`bottom:${status}`}</span>
      <button type="button" onClick={onAssignToMe}>
        assign-me
      </button>
      <button type="button" onClick={onAssign}>
        assign-from-bottom
      </button>
      <button type="button" onClick={onReply}>
        reply-from-bottom
      </button>
    </section>
  ),
}));

jest.mock('../../src/components/ContactAvatar', () => ({
  ContactAvatar: ({ contact, isGroup }) => (
    <span>{`avatar:${contact?.id || 'none'}:${String(isGroup)}`}</span>
  ),
}));

jest.mock('../../src/components/ConfirmDialog', () => ({
  ConfirmDialog: ({
    onClose,
    onConfirm,
    open,
    title,
  }) => (
    open ? (
      <section role="dialog">
        <span>{title}</span>
        <button type="button" onClick={onConfirm}>
          confirm-delete
        </button>
        <button type="button" onClick={onClose}>
          close-confirm
        </button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/ConversationItem/Detail', () => ({
  Detail: ({ conversation }) => <span>{`detail:${conversation.subject || conversation.type}`}</span>,
}));

jest.mock('../../src/components/CallItem/StatusMessage', () => ({
  StatusMessage: ({ statusMatch }) => <span>{`status:${statusMatch?.status || statusMatch?.type}`}</span>,
}));

jest.mock('../../src/components/CallItem/CallIcon', () => ({
  CallIcon: ({ direction, missed, type }) => (
    <span>{`call-icon:${direction}:${String(missed)}:${type}`}</span>
  ),
}));

jest.mock('../../src/components/CallListV2', () => ({
  __esModule: true,
  default: ({
    calls,
    height,
    loadMoreCalls,
    onViewCallDetails,
    readTextPermission,
    width,
  }) => (
    <section data-sign="call-list-v2" data-testid="call-list-v2">
      <span>{`call-list:${calls.length}:${width}:${height}:${String(readTextPermission)}`}</span>
      <button type="button" onClick={loadMoreCalls}>
        load-more-calls
      </button>
      <button type="button" onClick={() => onViewCallDetails?.('telephony-1')}>
        view-call-details
      </button>
    </section>
  ),
}));

jest.mock('../../src/components/ActiveCallList', () => ({
  __esModule: true,
  default: ({
    calls,
    onMergeCall,
    title,
    webphoneAnswer,
  }) => (
    <section data-sign="active-call-list" data-testid="active-call-list">
      <span>{`active-list:${title}:${calls.length}`}</span>
      <button type="button" onClick={() => webphoneAnswer?.(calls[0])}>
        active-answer
      </button>
      <button type="button" onClick={() => onMergeCall?.(calls[0])}>
        active-merge
      </button>
    </section>
  ),
}));

jest.mock('../../src/components/SearchAndFilter', () => ({
  CALL_TYPE_LIST: ['all', 'missed'],
  CALL_TYPE_LIST_WITH_UN_LOGGED: ['all', 'unlogged'],
  SearchAndFilter: ({
    onSearchInputChange,
    onTypeChange,
    placeholder,
    showTypeFilter,
  }) => (
    <section data-sign="search-and-filter" data-testid="search-and-filter">
      <span>{`${placeholder}:${String(showTypeFilter)}`}</span>
      <input
        aria-label="search calls"
        onChange={(event) => onSearchInputChange(event.target.value)}
      />
      <button type="button" onClick={() => onTypeChange?.('missed')}>
        change-type
      </button>
    </section>
  ),
}));

function createConversation(overrides = {}) {
  return {
    assignee: {
      extensionId: '101',
      name: 'Owner',
    },
    conversationId: 'conversation-1',
    conversationMatches: [{
      id: 'log-1',
      type: 'log',
    }, {
      id: 'status-1',
      status: 'synced',
      type: 'status',
    }],
    correspondentMatches: [{
      id: 'contact-1',
      name: 'Ada',
    }, {
      id: 'contact-2',
      name: 'Grace',
    }],
    correspondents: [{
      name: 'Ada',
      phoneNumber: '+16505550100',
    }],
    creationTime: 1000,
    direction: messageDirection.inbound,
    id: 'message-1',
    isAssignedToMe: true,
    lastMatchedCorrespondentEntity: {
      id: 'contact-1',
    },
    messages: [{ id: 'message-1' }],
    notes: [{ id: 'note-1', text: 'note' }],
    owner: {
      extensionId: '100',
      name: 'Queue Owner',
    },
    recipients: [{ phoneNumber: '+16505550100' }],
    self: false,
    status: 'Open',
    statusReason: 'Need help',
    subject: 'Message preview',
    type: messageTypes.text,
    unreadCounts: 2,
    ...overrides,
  };
}

function createConversationPanelProps(overrides = {}) {
  return {
    additionalToolbarButtons: [{ id: 'crm' }],
    areaCode: '650',
    attachments: [{ id: 'a1' }],
    autoLog: true,
    brand: 'RingCentral',
    contactPlaceholder: 'Unknown',
    conversation: createConversation({ type: 'Thread' }),
    conversationId: 'conversation-1',
    countryCode: 'US',
    currentLocale: 'en-US',
    currentSiteCode: '101',
    dateTimeFormatter: jest.fn(() => 'date'),
    disableLinks: false,
    enableCDC: true,
    enableContactFallback: true,
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    getSMSRecipients: jest.fn(async () => [{ phoneNumber: '+16505550100' }]),
    goBack: jest.fn(),
    inputExpandable: true,
    isMultipleSiteEnabled: true,
    loadConversation: jest.fn(),
    loadPreviousMessages: jest.fn(),
    loadingNextPage: false,
    logButtonTitle: 'Log',
    maxExtensionNumberLength: 6,
    messageText: 'draft',
    messages: [],
    myExtensionId: '101',
    onAssign: jest.fn(),
    onAttachmentDownload: jest.fn(),
    onClickAdditionalToolbarButton: jest.fn(),
    onClose: jest.fn(),
    onCreateNote: jest.fn(async () => {}),
    onDeleteNote: jest.fn(async () => {}),
    onLinkClick: jest.fn(),
    onLogConversation: jest.fn(async () => {}),
    onReplyThread: jest.fn(),
    onResolveThread: jest.fn(),
    onSelectContact: jest.fn(),
    onUpdateNote: jest.fn(async () => {}),
    perPage: 20,
    readMessages: jest.fn(),
    removeAttachment: jest.fn(),
    addAttachment: jest.fn(),
    replyToReceivers: jest.fn(),
    restrictSendMessage: jest.fn(() => false),
    sendButtonDisabled: false,
    shouldLogSelectRecord: true,
    showCloseButton: true,
    showContactDisplayPlaceholder: true,
    showLogButton: true,
    showSpinner: false,
    showTemplate: true,
    showTemplateManagement: true,
    showTypingDuration: true,
    sortTemplates: jest.fn(),
    supportAttachment: true,
    templates: [{ id: 'template-1' }],
    threadBusy: false,
    typingStartTime: 500,
    accumulatedTypingTime: 3000,
    unloadConversation: jest.fn(),
    updateMessageText: jest.fn(),
    ...overrides,
  };
}

function createConversationItemProps(overrides = {}) {
  return {
    additionalActions: [{ id: 'custom', title: 'Custom action' }],
    areaCode: '650',
    autoLog: true,
    brand: 'RingCentral',
    contactPlaceholder: 'Unknown',
    conversation: createConversation(),
    countryCode: 'US',
    currentLocale: 'en-US',
    dateTimeFormatter: jest.fn(() => 'date'),
    deleteMessage: jest.fn(),
    enableCDC: true,
    enableContactFallback: true,
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    internalSmsPermission: true,
    logButtonTitle: 'Log',
    markMessage: jest.fn(),
    onAssignThread: jest.fn(),
    onClickAdditionalAction: jest.fn(),
    onClickToDial: jest.fn(),
    onClickToSms: jest.fn(),
    onCreateContact: jest.fn(async () => {}),
    onLogConversation: jest.fn(async () => {}),
    onRefreshContact: jest.fn(),
    onResolveThread: jest.fn(async () => {}),
    onSelectContact: jest.fn(),
    onUnassignThread: jest.fn(async () => {}),
    onViewContact: jest.fn(),
    openMessageDetails: jest.fn(),
    outboundSmsPermission: true,
    previewFaxMessages: jest.fn(),
    readMessage: jest.fn(),
    shouldLogSelectRecord: true,
    showContactDisplayPlaceholder: true,
    showConversationDetail: jest.fn(),
    showLogButton: true,
    threadBusy: false,
    unmarkMessage: jest.fn(),
    updateTypeFilter: jest.fn(),
    ...overrides,
  };
}

function createCall(overrides = {}) {
  return {
    activityMatches: [{
      id: 'log-1',
      type: 'log',
    }, {
      id: 'status-1',
      status: 'logged',
      type: 'status',
    }],
    direction: callDirections.inbound,
    duration: undefined,
    from: {
      phoneNumber: '+16505550100',
    },
    fromMatches: [{
      id: 'contact-1',
      name: 'Ada',
    }, {
      id: 'contact-2',
      name: 'Grace',
    }],
    id: 'call-1',
    offset: 0,
    recording: {
      contentUri: 'https://example.com/recording.mp3',
    },
    result: 'Missed',
    startTime: 1000,
    telephonySessionId: 'telephony-1',
    to: {
      phoneNumber: '+16505550101',
    },
    type: 'Voice',
    ...overrides,
  };
}

function createCallItemProps(overrides = {}) {
  return {
    active: false,
    additionalActions: [{ id: 'custom-call', title: 'Custom call' }],
    aiNoted: true,
    areaCode: '650',
    autoLog: true,
    brand: 'RingCentral',
    call: createCall(),
    countryCode: 'US',
    currentLocale: 'en-US',
    dateTimeFormatter: jest.fn(() => 'call-date'),
    enableCDC: true,
    enableContactFallback: true,
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    internalSmsPermission: true,
    isLoggedContact: jest.fn(() => false),
    isRecording: true,
    logButtonTitle: 'Log call',
    onClickAdditionalAction: jest.fn(),
    onClickToDial: jest.fn(),
    onClickToSms: jest.fn(),
    onCreateContact: jest.fn(async () => {}),
    onLogCall: jest.fn(async () => {}),
    onRefreshContact: jest.fn(),
    onViewCallDetails: jest.fn(),
    onViewContact: jest.fn(),
    onViewSmartNote: jest.fn(),
    outboundSmsPermission: true,
    readTextPermission: true,
    showContactDisplayPlaceholder: true,
    showLogButton: true,
    updateSessionMatchedContact: jest.fn(),
    ...overrides,
  };
}

function clickActions() {
  screen.getAllByTestId(/^action-/).forEach((button) => {
    if (!button.disabled) {
      fireEvent.click(button);
    }
  });
}

describe('conversation and call flow components', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('runs the assigned conversation thread flow', async () => {
    jest.useFakeTimers();
    const props = createConversationPanelProps();
    const { unmount } = render(<ConversationPanel {...props} />);

    await waitFor(() => {
      expect(props.loadConversation).toHaveBeenCalledWith('conversation-1');
    });
    expect(props.readMessages).toHaveBeenCalledWith('conversation-1');

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(props.loadPreviousMessages).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Previous'));
    fireEvent.click(screen.getByText('Log'));
    fireEvent.click(screen.getByText('Resolve'));
    fireEvent.click(screen.getByText('Unassign'));
    fireEvent.click(screen.getByText('Close page'));
    fireEvent.click(screen.getByText('contact:Ada:0'));
    fireEvent.click(screen.getByText('change-message'));
    fireEvent.click(screen.getByText('send-message'));
    fireEvent.click(screen.getByText('add-attachment'));
    fireEvent.click(screen.getByText('remove-attachment'));
    fireEvent.click(screen.getByText('toolbar'));
    fireEvent.click(screen.getByText('download-attachment'));
    fireEvent.click(screen.getByText('link-click'));

    await waitFor(() => {
      expect(props.onLogConversation).toHaveBeenCalled();
    });
    expect(props.goBack).toHaveBeenCalled();
    expect(props.onResolveThread).toHaveBeenCalled();
    expect(props.onAssign).toHaveBeenCalledWith(null);
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onSelectContact).toHaveBeenCalledWith({
      conversation: props.conversation,
      correspondentEntity: props.conversation.correspondentMatches[0],
    });
    expect(props.updateMessageText).toHaveBeenCalledWith('updated text');
    expect(props.replyToReceivers).toHaveBeenCalledWith(
      'hello',
      [{ id: 'a1' }],
      props.conversation.correspondentMatches[0],
    );
    expect(props.addAttachment).toHaveBeenCalledWith({ id: 'a2' });
    expect(props.removeAttachment).toHaveBeenCalledWith('a1');
    expect(props.onClickAdditionalToolbarButton).toHaveBeenCalledWith({ id: 'crm' });
    expect(props.onAttachmentDownload).toHaveBeenCalledWith({ id: 'file-1' });
    expect(props.onLinkClick).toHaveBeenCalledWith('https://example.com');

    fireEvent.click(screen.getByText('Reassign'));
    fireEvent.click(screen.getByText('assign-confirm'));
    expect(props.onAssign).toHaveBeenCalledWith({ extensionId: '202' });

    fireEvent.click(screen.getByText('Notes (1)'));
    fireEvent.click(screen.getByText('create-note'));
    fireEvent.click(screen.getByText('update-note'));
    fireEvent.click(screen.getByText('delete-note'));
    fireEvent.click(screen.getByText('close-notes'));
    expect(props.onCreateNote).toHaveBeenCalledWith('new note');
    expect(props.onUpdateNote).toHaveBeenCalledWith('note-1', 'updated note');
    expect(props.onDeleteNote).toHaveBeenCalledWith('note-1');

    unmount();
    expect(props.unloadConversation).toHaveBeenCalled();
  });

  it('renders restricted and unassigned conversation thread states', async () => {
    const props = createConversationPanelProps({
      conversation: createConversation({
        assignee: null,
        isAssignedToMe: false,
        notes: [],
        type: 'Thread',
      }),
      restrictSendMessage: jest.fn(() => true),
    });
    const { rerender } = render(<ConversationPanel {...props} />);

    await waitFor(() => {
      expect(screen.getByText('dncAlert')).toBeTruthy();
    });
    expect(screen.queryByTestId('message-input')).toBeNull();

    props.restrictSendMessage = jest.fn(() => false);
    rerender(<ConversationPanel {...props} />);
    await waitFor(() => {
      expect(screen.getByTestId('bottom-assign-info')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('assign-me'));
    fireEvent.click(screen.getByText('reply-from-bottom'));
    expect(props.onAssign).toHaveBeenCalledWith({ extensionId: '101' });
    expect(props.onReplyThread).toHaveBeenCalled();
  });

  it('hydrates granular SMS log state only for messages not already known as logged', async () => {
    const syncMessageLogState = jest.fn();
    const props = createConversationPanelProps({
      autoLog: false,
      conversation: createConversation({ type: messageTypes.text }),
      granularLoggingEnabled: true,
      messageLogStateMap: {
        m1: { logId: 'crm-log-1' },
      },
      messages: [
        { id: 'm1', text: 'already logged' },
        { id: 'm2', text: 'unknown' },
        { id: 'note-1', recordType: 'AliveNote', text: 'internal note' },
      ],
      syncMessageLogState,
    });

    render(<ConversationPanel {...props} />);

    await waitFor(() => {
      expect(syncMessageLogState).toHaveBeenCalledWith('conversation-1', ['m2']);
    });
  });

  it('clears selective SMS UI state immediately when granular logging is disabled', async () => {
    const props = createConversationPanelProps({
      autoLog: false,
      conversation: createConversation({ type: messageTypes.text }),
      granularLoggingEnabled: true,
      messageLogStateMap: {
        m1: { logId: 'crm-log-1' },
      },
      messages: [
        { id: 'm1', text: 'already logged' },
        { id: 'm2', text: 'unknown' },
      ],
      syncMessageLogState: jest.fn(),
    });
    const { rerender } = render(<ConversationPanel {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId('granular-message-list-state').textContent).toBe('true:1:0');
    });

    rerender(<ConversationPanel {...props} granularLoggingEnabled={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('granular-message-list-state').textContent).toBe('false:0:0');
    });
  });

  it('renders conversation panel with default optional props', async () => {
    const props = createConversationPanelProps({
      conversation: createConversation({
        conversationMatches: [],
        correspondentMatches: [],
        correspondents: [
          { phoneNumber: '+16505550100' },
          { extensionNumber: '102' },
        ],
        isAssignedToMe: true,
        lastMatchedCorrespondentEntity: null,
        type: messageTypes.text,
      }),
      messages: [{ id: 'message-1', text: 'hello' }],
      recipients: [{ phoneNumber: '+16505550100' }],
    });
    [
      'attachments',
      'autoLog',
      'contactPlaceholder',
      'dropdownClassName',
      'enableCDC',
      'enableContactFallback',
      'inputExpandable',
      'loadingNextPage',
      'logButtonTitle',
      'messageSubjectRenderer',
      'messageText',
      'onAttachmentDownload',
      'onLogConversation',
      'onSelectContact',
      'perPage',
      'renderContactList',
      'renderConversationTitle',
      'renderExtraButton',
      'renderLogInfoSection',
      'restrictSendMessage',
      'shouldLogSelectRecord',
      'showCloseButton',
      'showContactDisplayPlaceholder',
      'showGroupNumberName',
      'showLogButton',
      'showSpinner',
      'showTypingDuration',
      'sourceIcons',
      'supportAttachment',
      'typingStartTime',
      'accumulatedTypingTime',
    ].forEach((key) => {
      delete props[key];
    });

    render(<ConversationPanel {...props} />);

    await waitFor(() => {
      expect(props.loadConversation).toHaveBeenCalledWith('conversation-1');
    });
    expect(props.readMessages).toHaveBeenCalledWith('conversation-1');
    expect(screen.queryByText('Log')).toBeNull();
    expect(screen.queryByText('Close page')).toBeNull();
  });

  it('runs conversations panel empty, list, owner and assignment flows', async () => {
    const props = {
      additionalActions: [{ id: 'assign-owner' }],
      areaCode: '650',
      brand: 'RingCentral',
      conversations: [],
      countryCode: 'US',
      currentLocale: 'en-US',
      dateTimeFormatter: jest.fn(() => 'date'),
      externalHasEntity: jest.fn(() => false),
      externalViewEntity: jest.fn(),
      formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
      getSMSRecipients: jest.fn(async () => [{ extensionId: '202' }]),
      loadNextPage: jest.fn(),
      markMessage: jest.fn(),
      maxExtensionNumberLength: 6,
      onAssignThread: jest.fn(async () => {}),
      onClickAdditionalAction: jest.fn(),
      onOwnerFilterChange: jest.fn(),
      onResolveThread: jest.fn(),
      onSearchFilterChange: jest.fn(),
      onSearchInputChange: jest.fn(),
      onUnmount: jest.fn(),
      openMessageDetails: jest.fn(),
      ownerFilter: 'all',
      ownerTabs: [{ label: 'Mine', unreadCounts: 1, value: 'mine' }],
      readMessage: jest.fn(),
      searchFilter: 'All',
      searchFilterList: ['All', 'Text'],
      searchInput: '',
      showConversationDetail: jest.fn(),
      typeFilter: messageTypes.all,
      unmarkMessage: jest.fn(),
      updateTypeFilter: jest.fn(),
    };
    const { rerender, unmount } = render(<ConversationsPanel {...props} />);

    expect(screen.getByText('noMessages')).toBeTruthy();
    expect(props.updateTypeFilter).toHaveBeenCalledWith(messageTypes.all);
    fireEvent.change(screen.getByLabelText('search calls'), {
      target: { value: 'Ada' },
    });
    expect(props.onSearchInputChange).toHaveBeenCalledWith('Ada');
    fireEvent.click(screen.getByText('change-type'));
    expect(props.onSearchFilterChange).toHaveBeenCalledWith('missed');
    fireEvent.click(screen.getByText('owner-change'));
    expect(props.onOwnerFilterChange).toHaveBeenCalledWith('mine');

    rerender(
      <ConversationsPanel
        {...props}
        conversations={[createConversation({ conversationId: 'conversation-list-1' })]}
        disableCallButton
        disableLinks
        loadingNextPage
        logButtonTitle="Log"
        searchInput="Ada"
        showLogButton
        threadBusy
      />,
    );

    expect(screen.getByText('1:true:true:true:true:Log:none:true')).toBeTruthy();
    fireEvent.click(screen.getByText('list-next'));
    fireEvent.click(screen.getByText('action-assign-owner'));
    fireEvent.click(screen.getByText('list-unassign'));
    fireEvent.click(screen.getByText('list-resolve'));
    expect(props.loadNextPage).toHaveBeenCalled();
    expect(props.onClickAdditionalAction).toHaveBeenCalledWith('assign-owner');
    await waitFor(() => {
      expect(props.onAssignThread).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'conversation-list-1' }),
        null,
      );
    });
    expect(props.onResolveThread).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conversation-list-1' }),
    );

    fireEvent.click(screen.getByText('list-assign'));
    fireEvent.click(screen.getByText('get-recipients'));
    expect(props.getSMSRecipients).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conversation-list-1' }),
    );
    fireEvent.click(screen.getByText('assign-confirm'));
    await waitFor(() => {
      expect(props.onAssignThread).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'conversation-list-1' }),
        { extensionId: '202' },
      );
    });

    rerender(
      <ConversationsPanel
        {...props}
        loadingNextPage={false}
        onSearchInputChange={undefined}
        renderNoMessage={() => <span>custom-empty</span>}
        searchInput=""
      />,
    );
    expect(screen.getByText('custom-empty')).toBeTruthy();
    unmount();
    expect(props.onUnmount).toHaveBeenCalled();
  });

  it('renders compose text panel permission and default optional flows', async () => {
    const props = {
      addToNumber: jest.fn(async () => true),
      cleanTypingToNumber: jest.fn(),
      currentLocale: 'en-US',
      detectPhoneNumbers: jest.fn(),
      formatContactPhone: jest.fn((phoneNumber) => `contact-${phoneNumber}`),
      formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
      goBack: jest.fn(),
      messageText: '',
      onLoad: jest.fn(),
      removeToNumber: jest.fn(),
      searchContact: jest.fn(),
      searchContactList: [],
      send: jest.fn(),
      sendButtonDisabled: false,
      senderNumber: '',
      senderNumbers: [],
      toNumbers: [],
      typingToNumber: '',
      updateMessageText: jest.fn(),
      updateSenderNumber: jest.fn(),
      updateTypingToNumber: jest.fn(),
    };
    const { rerender } = render(<ComposeTextPanel {...props} />);

    expect(props.onLoad).toHaveBeenCalled();
    expect(screen.getByText('no-text-permission')).toBeTruthy();
    fireEvent.click(screen.getByText('compose-back'));
    expect(props.goBack).toHaveBeenCalled();

    rerender(
      <ComposeTextPanel
        {...props}
        outboundSMS
        senderNumber="+16505550100"
        senderNumbers={[{ phoneNumber: '+16505550100' }]}
        toNumbers={[{ phoneNumber: '+16505550123' }]}
        typingToNumber="Ada"
      />,
    );

    fireEvent.change(screen.getByLabelText('compose-recipient'), {
      target: { value: 'Grace' },
    });
    expect(props.updateTypingToNumber).toHaveBeenCalledWith('Grace');
    fireEvent.click(screen.getByText('compose-add-recipient'));
    await waitFor(() => {
      expect(props.addToNumber).toHaveBeenCalledWith({ phoneNumber: '+16505550123' });
    });
    expect(props.cleanTypingToNumber).toHaveBeenCalled();
    fireEvent.click(screen.getByText('compose-remove-recipient'));
    expect(props.removeToNumber).toHaveBeenCalledWith({ phoneNumber: '+16505550123' });
    fireEvent.click(screen.getByText('compose-from:false:+16505550100'));
    expect(props.updateSenderNumber).toHaveBeenCalledWith({ phoneNumber: 'sender-2' });
    fireEvent.click(screen.getByText(/Create group text/));
    fireEvent.click(screen.getByText('change-message'));
    fireEvent.click(screen.getByText('send-message'));
    expect(props.updateMessageText).toHaveBeenCalledWith('updated text');
    expect(props.send).toHaveBeenCalledWith('hello', [{ id: 'a1' }]);
  });

  it('runs conversation item actions for text and voicemail rows', async () => {
    const props = createConversationItemProps();
    render(<ConversationItem {...props} />);

    fireEvent.click(screen.getByText('contact:Ada:0'));
    fireEvent.click(screen.getByTestId('list-item-text'));
    clickActions();

    await waitFor(() => {
      expect(props.onLogConversation).toHaveBeenCalled();
    });
    expect(props.onSelectContact).toHaveBeenCalledWith({
      conversation: props.conversation,
      correspondentEntity: props.conversation.correspondentMatches[0],
    });
    expect(props.showConversationDetail).toHaveBeenCalledWith('conversation-1');

    const threadProps = createConversationItemProps({
      conversation: createConversation({
        conversationId: 'thread-1',
        id: 'thread-message-1',
        type: 'Thread',
      }),
    });
    render(<ConversationItem {...threadProps} />);
    fireEvent.click(screen.getByTestId('action-assign'));
    fireEvent.click(screen.getByTestId('action-unassign'));
    fireEvent.click(screen.getByTestId('action-resolve'));
    expect(threadProps.onAssignThread).toHaveBeenCalledWith(threadProps.conversation);
    expect(threadProps.onUnassignThread).toHaveBeenCalledWith(threadProps.conversation);
    expect(threadProps.onResolveThread).toHaveBeenCalledWith(threadProps.conversation);

    const voicemailProps = createConversationItemProps({
      conversation: createConversation({
        conversationId: 'voicemail-1',
        id: 'voicemail-message-1',
        type: messageTypes.voiceMail,
        voicemailAttachment: {
          uri: 'https://example.com/voicemail',
        },
      }),
    });
    render(<ConversationItem {...voicemailProps} />);
    fireEvent.click(screen.getByTestId('action-delete'));
    fireEvent.click(screen.getByText('confirm-delete'));
    expect(voicemailProps.deleteMessage).toHaveBeenCalledWith('voicemail-1');
  });

  it('renders conversation item with default optional props', () => {
    const props = createConversationItemProps({
      conversation: createConversation({
        conversationMatches: undefined,
        correspondents: [{ name: 'Ada', phoneNumber: '+16505550100' }],
        faxAttachment: null,
        lastMatchedCorrespondentEntity: null,
        type: messageTypes.fax,
        voicemailAttachment: null,
      }),
    });
    [
      'additionalActions',
      'autoLog',
      'contactPlaceholder',
      'currentSiteCode',
      'deleteMessage',
      'disableCallButton',
      'disableClickToDial',
      'disableLinks',
      'dropdownClassName',
      'enableCDC',
      'internalSmsPermission',
      'logButtonTitle',
      'maxExtensionNumberLength',
      'onAssignThread',
      'onClickAdditionalAction',
      'onClickToDial',
      'onClickToSms',
      'onCreateContact',
      'onLogConversation',
      'onRefreshContact',
      'onResolveThread',
      'onSelectContact',
      'onUnassignThread',
      'onViewContact',
      'outboundSmsPermission',
      'phoneSourceNameRenderer',
      'phoneTypeRenderer',
      'previewFaxMessages',
      'renderContactList',
      'renderContactName',
      'shouldLogSelectRecord',
      'showContactDisplayPlaceholder',
      'showGroupNumberName',
      'showLogButton',
      'sourceIcons',
      'threadBusy',
    ].forEach((key) => {
      delete props[key];
    });

    render(<ConversationItem {...props} />);

    expect(screen.getByText('detail:Message preview')).toBeTruthy();
    fireEvent.click(screen.getByTestId('contact-display'));
    fireEvent.click(screen.getByText('detail:Message preview'));
  });

  it('runs call item display, selection, recording, and action flows', async () => {
    const props = createCallItemProps();
    const { rerender } = render(<CallItem {...props} />);

    fireEvent.click(screen.getByText('call-icon:Inbound:true:Voice'));
    fireEvent.click(screen.getByTestId('contact-display'));
    clickActions();

    await waitFor(() => {
      expect(props.onLogCall).toHaveBeenCalled();
    });
    expect(props.onViewCallDetails).toHaveBeenCalledWith('telephony-1');
    expect(props.updateSessionMatchedContact).toHaveBeenCalledWith({
      contact: props.call.fromMatches[1],
      telephonySessionId: 'telephony-1',
    });

    rerender(
      <CallItem
        {...createCallItemProps({
          active: true,
          call: createCall({
            direction: callDirections.outbound,
            duration: 65,
            result: 'Connected',
            toName: 'Conference',
          }),
          isRecording: false,
        })}
      />,
    );
    expect(screen.getByText('Connected')).toBeTruthy();
  });

  it('renders call lists, active call sections, search, adaptive sizing, and spinner states', async () => {
    const props = {
      active: false,
      activeCalls: [{ id: 'active-1' }],
      activeCurrentCalls: [{ id: 'current-1' }],
      activeOnHoldCalls: [{ id: 'hold-1' }],
      activeRingCalls: [{ id: 'ring-1' }],
      adaptive: true,
      aiNotedCallMapping: {},
      areaCode: '650',
      brand: 'RingCentral',
      calls: [createCall()],
      className: 'custom-list',
      conferenceCallParties: [],
      countryCode: 'US',
      currentLocale: 'en-US',
      dateTimeFormatter: jest.fn(() => 'date'),
      filterType: 'all',
      formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
      getAvatarUrl: jest.fn(),
      hasMoreCalls: true,
      height: 400,
      isOnHold: jest.fn(() => false),
      loadMoreCalls: jest.fn(),
      loadingMoreCalls: false,
      loggingMap: {},
      maxExtensionLength: 6,
      modalClose: jest.fn(),
      modalConfirm: jest.fn(),
      onActiveCallItemClick: jest.fn(),
      onClickToDial: jest.fn(),
      onClickToSms: jest.fn(),
      onCreateContact: jest.fn(),
      onFilterTypeChange: jest.fn(),
      onLoadCalls: jest.fn(),
      onLogCall: jest.fn(),
      onMergeCall: jest.fn(),
      onRefreshContact: jest.fn(),
      onSearchInputChange: jest.fn(),
      onViewCallDetails: jest.fn(),
      onViewCalls: jest.fn(),
      onViewContact: jest.fn(),
      onViewSmartNote: jest.fn(),
      otherDeviceCalls: [{ id: 'other-1' }],
      readTextPermission: true,
      searchInput: '',
      showCallDetail: true,
      showLogButton: true,
      showMergeCall: true,
      type: 'all',
      webphoneAnswer: jest.fn(),
      width: 320,
    };
    const { rerender } = render(
      <CallsListPanel {...props}>
        <span>child</span>
      </CallsListPanel>,
    );

    await waitFor(() => {
      expect(props.onLoadCalls).toHaveBeenCalledWith('all', 'all');
    });
    fireEvent.change(screen.getByLabelText('search calls'), {
      target: { value: 'Ada' },
    });
    fireEvent.click(screen.getByText('change-type'));
    fireEvent.click(screen.getByText('load-more-calls'));
    fireEvent.click(screen.getByText('view-call-details'));
    screen.getAllByText('active-answer').forEach((button) => fireEvent.click(button));
    screen.getAllByText('active-merge').forEach((button) => fireEvent.click(button));
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(props.onSearchInputChange).toHaveBeenCalledWith('Ada');
    expect(props.onFilterTypeChange).toHaveBeenCalledWith('missed');
    expect(props.loadMoreCalls).toHaveBeenCalled();
    expect(props.onViewCallDetails).toHaveBeenCalledWith('telephony-1');
    expect(props.webphoneAnswer).toHaveBeenCalled();
    expect(props.onMergeCall).toHaveBeenCalled();

    rerender(
      <CallsListPanel
        {...props}
        calls={[]}
        onlyHistory
        otherDeviceCalls={[]}
        showSpinner={false}
      />,
    );
    expect(screen.getByText('noCalls')).toBeTruthy();

    rerender(<CallsListPanel {...props} showSpinner />);
    expect(screen.getByTestId('spinner')).toBeTruthy();
  });
});
