/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@ringcentral-integration/commons/utils', () => ({
  sleep: jest.fn(async () => {}),
}));

const mockIsSafari = jest.fn(() => false);
jest.mock('@ringcentral-integration/utils', () => ({
  isSafari: () => mockIsSafari(),
}));

jest.mock('@ringcentral-integration/widgets/components/IncomingCallView/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ContactDetails/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/RecentActivityCalls/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/RecentActivityMessages/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/LogBasicInfoV2/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/SimpleCallControlPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('../../src/components/MeetingItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('../../src/components/ParkPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/DurationCounter', () => (
  function MockDurationCounter({ startTime, offset }) {
    return <span data-sign="duration-counter" data-testid="duration-counter">{`${startTime}-${offset}`}</span>;
  }
));

jest.mock('@ringcentral-integration/widgets/components/LogBasicInfoV2/ShinyBar', () => ({
  ShinyBar: ({ isRinging, status }) => (
    <div data-ringing={isRinging ? 'true' : 'false'} data-sign="shiny-bar" data-status={status} data-testid="shiny-bar" />
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/ContactDisplay', () => (
  function MockContactDisplay({
    contactMatches = [],
    fallBackName,
    name,
    onSelectContact,
    phoneNumber,
    selected,
  }) {
    return (
      <div data-selected={selected} data-sign="contact-display" data-testid="contact-display">
        <span>{name || fallBackName || phoneNumber}</span>
        {contactMatches.map((match) => (
          <button key={match.id} type="button" onClick={() => onSelectContact(match)}>
            {match.name || match.firstName}
          </button>
        ))}
      </div>
    );
  }
));

jest.mock('@ringcentral-integration/widgets/react-hooks/usePresence', () => ({
  usePresence: jest.fn(() => ({
    dndStatus: 'TakeAllCalls',
    presenceStatus: 'Available',
  })),
}));

jest.mock('@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper', () => ({
  getPresenceStatus: jest.fn(() => 'available'),
}));

jest.mock('@ringcentral-integration/widgets/lib/getPresenceStatusName', () => ({
  getPresenceStatusName: jest.fn(() => 'Available'),
}));

jest.mock('@ringcentral-integration/widgets/components/InnerTopic', () => {
  const React = require('react');
  return {
    Topic: React.forwardRef(({ name, updateMeetingTopic }, ref) => {
      const [value, setValue] = React.useState(name || '');
      React.useImperativeHandle(ref, () => ({ value }));
      return (
        <input
          data-sign="meeting-topic"
          data-testid="meeting-topic"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            updateMeetingTopic(event.target.value);
          }}
        />
      );
    }),
  };
});

jest.mock('@ringcentral-integration/widgets/components/MeetingConfigsV2', () => ({
  MeetingConfigs: ({ children, meeting, recipientsSection }) => (
    <section data-sign="meeting-configs-v2" data-testid="meeting-configs-v2">
      <span>{meeting.topic}</span>
      {recipientsSection}
      {children}
    </section>
  ),
  MeetingConfigsV2: ({ children, meeting, recipientsSection }) => (
    <section data-sign="meeting-configs-v2" data-testid="meeting-configs-v2">
      <span>{meeting.topic}</span>
      {recipientsSection}
      {children}
    </section>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/SpinnerOverlay', () => ({
  SpinnerOverlay: () => <div data-sign="spinner-overlay" data-testid="spinner-overlay">spinner</div>,
}));

jest.mock('@ringcentral-integration/widgets/components/VideoPanel/VideoConfig', () => ({
  VideoConfig: ({ children, meeting, recipientsSection }) => (
    <section data-sign="video-config" data-testid="video-config">
      <span>{meeting.name}</span>
      {recipientsSection}
      {children}
    </section>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/GenericMeetingPanel/styles.scss', () => ({
  wrapper: 'wrapper',
}));

jest.mock('../../src/components/IncomingCallPad', () => (
  function MockIncomingCallPad({
    answer,
    answerAndEnd,
    answerAndHold,
    hasOtherActiveCall,
    ignore,
    isCallQueueCall,
    onForward,
    reject,
    replyWithMessage,
    searchContact,
    startReply,
    toVoiceMail,
  }) {
    return (
      <div data-call-queue={isCallQueueCall ? 'true' : 'false'} data-other-call={hasOtherActiveCall ? 'true' : 'false'}>
        <button type="button" onClick={answer}>answer</button>
        <button type="button" onClick={reject}>reject</button>
        <button type="button" onClick={ignore}>ignore</button>
        <button type="button" onClick={toVoiceMail}>voicemail</button>
        <button type="button" onClick={replyWithMessage}>reply</button>
        <button type="button" onClick={() => onForward('101')}>forward</button>
        <button type="button" onClick={startReply}>start-reply</button>
        <button type="button" onClick={answerAndEnd}>answer-end</button>
        <button type="button" onClick={answerAndHold}>answer-hold</button>
        <button type="button" onClick={() => searchContact('Ada')}>search-contact</button>
      </div>
    );
  }
));

jest.mock('../../src/components/CustomizedPanel', () => ({
  CustomizedPanel: ({
    formData,
    infoNode,
    onBackButtonClick,
    onButtonClick,
    onClose,
    onFormDataChange,
    onSave,
    pageId,
    schema,
    showCloseButton,
    title,
  }) => (
    <section data-sign="customized-panel" data-testid="customized-panel">
      <h1>{title}</h1>
      <span data-sign="schema-fields" data-testid="schema-fields">{Object.keys(schema.properties || {}).join(',')}</span>
      <span data-sign="form-contact" data-testid="form-contact">{formData.contactId}</span>
      {infoNode}
      <button type="button" onClick={onBackButtonClick}>back</button>
      <button type="button" onClick={() => onButtonClick('custom-button')}>custom-button</button>
      <button type="button" onClick={() => onFormDataChange(pageId, { contactId: 'contact-2' }, ['contactId'])}>
        change-form
      </button>
      <button type="button" onClick={() => onSave(pageId, { note: 'saved' })}>save</button>
      {showCloseButton ? <button type="button" onClick={onClose}>close</button> : null}
    </section>
  ),
}));

jest.mock('../../src/components/LogMessagesPanel/ConversationInfo', () => ({
  ConversationInfo: ({ conversationLog, formatPhone }) => {
    const firstDate = Object.keys(conversationLog)[0];
    const conversation = conversationLog[firstDate];
    return (
      <div data-sign="conversation-info" data-testid="conversation-info">
        {formatPhone(conversation.correspondents[0].phoneNumber)}
      </div>
    );
  },
}));

jest.mock('../../src/components/ActionMenu', () => ({
  ActionMenu: ({ actions = [], className = '' }) => (
    <div className={className} data-testid="action-menu">
      {actions.map((action, index) => (
        <button
          key={action.id || action.title || index}
          disabled={action.disabled}
          type="button"
          onClick={action.onClick}
        >
          {action.title || action.id || `action-${index}`}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../src/components/BackHeaderView', () => ({
  BackHeaderView: ({ children, onBack, title }) => (
    <section>
      <h1>{title}</h1>
      <button type="button" onClick={onBack}>back-header</button>
      {children}
    </section>
  ),
}));

jest.mock('../../src/components/AudioPlayer', () => ({
  AudioPlayer: ({ uri }) => <audio data-sign="audio-player" data-testid="audio-player" src={uri} />,
}));

jest.mock('../../src/components/WidgetAppsPanel', () => ({
  WidgetAppsPanel: ({ apps = [] }) => (
    <section data-sign="widget-apps-panel" data-testid="widget-apps-panel">
      {apps.map((app) => (
        <span key={app.id}>{app.name}</span>
      ))}
    </section>
  ),
}));

jest.mock('../../src/components/CallCtrlPanel', () => (
  function MockCallCtrlPanel({
    controlBusy,
    nameMatches,
    onHangup,
    onSelectMatcherName,
    phoneNumber,
    selectedMatcherIndex,
  }) {
    return (
      <section data-busy={controlBusy ? 'true' : 'false'} data-selected={selectedMatcherIndex} data-sign="call-ctrl-panel" data-testid="call-ctrl-panel">
        <span>{phoneNumber}</span>
        <button type="button" onClick={onHangup}>hangup</button>
        {nameMatches.map((match) => (
          <button key={match.id} type="button" onClick={() => onSelectMatcherName(match)}>
            {match.name}
          </button>
        ))}
        <button type="button" onClick={() => onSelectMatcherName({ id: 'missing', name: 'Missing' })}>
          missing-match
        </button>
      </section>
    );
  }
));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    AddTextLog: createIcon('AddTextLog'),
    Apps: createIcon('Apps'),
    Attachment: createIcon('Attachment'),
    CallsBorder: createIcon('CallsBorder'),
    GroupDefault: createIcon('GroupDefault'),
    IdBorder: createIcon('IdBorder'),
    IncallBorder: createIcon('IncallBorder'),
    MissedcallBorder: createIcon('MissedcallBorder'),
    OutcallBorder: createIcon('OutcallBorder'),
    ParkCallSp: createIcon('ParkCallSp'),
    ParkCallText: createIcon('ParkCallText'),
    People: createIcon('People'),
    PhoneBorder: createIcon('PhoneBorder'),
    PlayBorder: createIcon('PlayBorder'),
    PlayCircleBorder: createIcon('PlayCircleBorder'),
    Previous: createIcon('Previous'),
    SmsBorder: createIcon('SmsBorder'),
    TodayCalendarIco: createIcon('TodayCalendarIco'),
    UserDefault: createIcon('UserDefault'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const blockedProps = new Set([
    'canHover',
    'clearBtn',
    'color',
    'component',
    'disableGutters',
    'disableTouchRipple',
    'fullScreen',
    'fullWidth',
    'iconVariant',
    'labelPlacement',
    'maxActions',
    'PaperProps',
    'presenceOrigin',
    'presenceProps',
    'secondaryTypographyProps',
    'size',
    'stretchIcon',
    'symbol',
    'variant',
  ]);
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      !blockedProps.has(key)
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
  const styled = (Component) => () => React.forwardRef((props, ref) => {
    if (typeof Component === 'string') {
      return React.createElement(Component, { ...cleanProps(props), ref }, props.children);
    }
    return <Component {...props} ref={ref}>{props.children}</Component>;
  });
  styled.div = () => createComponent('div', 'styled-div');
  styled.hr = () => createComponent('hr', 'styled-hr');
  styled.input = () => React.forwardRef((props, ref) => (
    <input
      {...cleanProps(props)}
      ref={ref}
      data-sign={props['data-sign'] || props.type || 'styled-input'}
      data-testid={props['data-testid'] || props.type || 'styled-input'}
    />
  ));
  return {
    RcAvatar: ({ children, iconSymbol, presenceProps, src }) => (
      <span data-presence={presenceProps?.type || ''} data-sign="avatar" data-src={src || ''} data-testid="avatar">
        {children || (iconSymbol ? 'avatar-icon' : null)}
      </span>
    ),
    RcButton: ({ children, disabled, onClick }) => (
      <button disabled={disabled} type="button" onClick={onClick}>{children}</button>
    ),
    RcDialog: ({ children, open }) => (open ? <div role="dialog">{children}</div> : null),
    RcIcon: ({ symbol }) => <span data-icon-symbol={symbol?.name || 'icon'} />,
    RcIconButton: ({ children, disabled, onClick, title }) => (
      <button disabled={disabled} title={title} type="button" onClick={onClick}>
        {children || title || 'icon-button'}
      </button>
    ),
    RcLink: ({ children, onClick, title }) => (
      <a href="/" title={title} onClick={onClick}>{children}</a>
    ),
    RcList: createComponent('div', 'list'),
    RcListItem: ({ button, children, disabled, onClick, title }) => (
      <button disabled={disabled} title={title} type="button" onClick={onClick}>
        {children}
        {button ? <span data-testid="button-list-item" /> : null}
      </button>
    ),
    RcListItemIcon: createComponent('span', 'list-item-icon'),
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
    RcTab: ({ label, onClick, value }) => (
      <button data-value={value} type="button" onClick={onClick}>{label}</button>
    ),
    RcTabs: ({ children, onChange }) => (
      <div>
        {React.Children.map(children, (child) => (
          React.cloneElement(child, {
            onClick: () => onChange({}, child.props.value),
          })
        ))}
      </div>
    ),
    RcThumbnail: ({ symbol, title }) => <span data-thumbnail={symbol?.name || 'thumbnail'} title={title || ''} />,
    RcText: createComponent('span', 'text'),
    RcTextField: React.forwardRef((props, ref) => (
      <input
        {...cleanProps(props)}
        ref={ref}
        aria-label={props.label}
        data-testid={props['data-testid'] || props.label || props.placeholder || 'text-field'}
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
      />
    )),
    RcTooltip: ({ children, title }) => <span title={title}>{children}</span>,
    RcTypography: ({ children }) => <span>{children}</span>,
    ellipsis: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    shadows: jest.fn(() => 'none'),
    styled,
    useAvatarColorToken: jest.fn((name) => `token-${name}`),
    useAvatarShortName: jest.fn(({ firstName = '', lastName = '' }) => (
      `${firstName.charAt(0)}${lastName.charAt(0)}`.trim()
    )),
    useMountState: jest.fn(() => ({ current: true })),
  };
});

const callDirections = require('@ringcentral-integration/commons/enums/callDirections').default;
const extensionStatusTypes = require('@ringcentral-integration/commons/enums/extensionStatusTypes').extensionStatusTypes;
const telephonyStatuses = require('@ringcentral-integration/commons/enums/telephonyStatus').default;

const IncomingCallPanel = require('../../src/components/IncomingCallPanel').default;
const LogMessagesPanel = require('../../src/components/LogMessagesPanel').default;
const { ContactDetails } = require('../../src/components/ContactDetailsView/ContactDetails');
const { GenericMeetingPanel } = require('../../src/components/GenericMeetingPanel');
const MeetingItem = require('../../src/components/MeetingItem').default;
const { OtherDeviceCallCtrlPanel } = require('../../src/components/OtherDeviceCallCtrlPanel');
const { ParkPanel } = require('../../src/components/ParkPanel');
const { VoicemailDropMessage } = require('../../src/components/VoicemailDropSettingsPanel/VoicemailDropMessage');
const { CallInfo } = require('../../src/components/LogCallPanel/CallInfo');

function createContact(overrides = {}) {
  return {
    company: 'Analytical Engines',
    department: 'Research',
    emails: ['ada@example.com'],
    firstName: 'Ada',
    id: 'contact-1',
    jobTitle: 'Engineer',
    lastName: 'Lovelace',
    name: 'Ada Lovelace',
    phoneNumbers: [{
      phoneNumber: '+16505550123',
      phoneType: 'direct',
      rawPhoneNumber: '(650) 555-0123',
    }, {
      phoneNumber: '101',
      phoneType: 'extension',
    }],
    site: {
      name: 'San Mateo',
    },
    status: 'Enabled',
    type: 'company',
    ...overrides,
  };
}

function createContactDetailsProps(overrides = {}) {
  return {
    activities: [{ id: 'activity-1', subject: 'Follow up', time: 1000 }],
    activitiesLoaded: true,
    activitiesTabName: 'Activities',
    additionalActions: [{ icon: 'calendar', id: 'schedule', label: 'Schedule' }],
    apps: [{ id: 'app-1', name: 'CRM' }],
    callLoaded: true,
    calls: [{
      direction: 'Inbound',
      duration: 60,
      id: 'call-1',
      result: 'Missed',
      startTime: '2026-01-01T00:00:00.000Z',
    }, {
      direction: 'Outbound',
      duration: 90,
      id: 'call-2',
      result: 'Accepted',
      startTime: '2026-01-01T00:02:00.000Z',
    }],
    canCallButtonShow: jest.fn(() => true),
    canTextButtonShow: jest.fn(() => true),
    clearActivities: jest.fn(),
    clearCalls: jest.fn(),
    clearMessages: jest.fn(),
    contact: createContact(),
    currentLocale: 'en-US',
    dateTimeFormatter: jest.fn(() => 'formatted-time'),
    disableLinks: false,
    formatNumber: jest.fn((number) => `formatted-${number}`),
    getPresence: jest.fn(),
    isCallButtonDisabled: false,
    isMultipleSiteEnabled: true,
    loadActivities: jest.fn(),
    loadCalls: jest.fn(),
    loadMessages: jest.fn(),
    messages: [{
      conversationId: 'conversation-1',
      creationTime: 1000,
      fromRemote: false,
      id: 'message-1',
      readStatus: 'Unread',
      subject: 'Unread message',
    }, {
      conversationId: 'conversation-2',
      creationTime: 2000,
      fromRemote: true,
      id: 'message-2',
      readStatus: 'Read',
      subject: 'Remote message',
    }],
    messagesLoaded: true,
    navigateTo: jest.fn(),
    onClickAdditionalAction: jest.fn(),
    onClickMailTo: jest.fn(),
    onClickToDial: jest.fn(),
    onClickToSMS: jest.fn(),
    onLoadApp: jest.fn(),
    openActivityDetail: jest.fn(),
    openAppTab: jest.fn(),
    pinAppIds: [],
    showActivities: true,
    showApps: true,
    sourceNodeRenderer: jest.fn(() => <span data-testid="source-node">source</span>),
    toggleAppPin: jest.fn(),
    unreadMessageCounts: 1,
    ...overrides,
  };
}

function createMeetingProps(overrides = {}) {
  return {
    appCode: 'rc',
    currentLocale: 'en-US',
    datePickerSize: 'small',
    disabled: false,
    init: jest.fn(),
    isRCM: true,
    isRCV: false,
    meeting: {
      name: 'Video topic',
      topic: 'Audio topic',
    },
    onOK: jest.fn(),
    recipientsSection: <div data-testid="recipients">recipients</div>,
    schedule: jest.fn(async () => {}),
    scheduleButton: ({ disabled, onClick }) => (
      <button disabled={disabled} type="button" onClick={onClick}>schedule-meeting</button>
    ),
    scheduleButtonLabel: 'Schedule',
    showDuration: true,
    showRecurringMeeting: true,
    showTopic: true,
    showWhen: true,
    timePickerSize: 'small',
    useRcmV2: true,
    updateMeetingSettings: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsSafari.mockReturnValue(false);
  window.open = jest.fn(() => ({ closed: false }));
  window.open.mockClear();
});

test('renders incoming call variants and forwards pad actions', () => {
  const props = {
    answer: jest.fn(),
    answerAndEnd: jest.fn(),
    answerAndHold: jest.fn(),
    areaCode: '650',
    avatarUrl: '',
    callQueueName: 'Support queue',
    countryCode: 'US',
    currentLocale: 'en-US',
    fallBackName: 'Caller ID',
    formatPhone: jest.fn((number) => `formatted-${number}`),
    forwardingNumbers: [],
    hasOtherActiveCall: true,
    ignore: jest.fn(),
    name: '',
    nameMatches: [],
    onBackButtonClick: jest.fn(),
    onForward: jest.fn(),
    onSelectMatcherName: jest.fn(),
    phoneNumber: '+16505550123',
    reject: jest.fn(),
    replyWithMessage: jest.fn(),
    searchContact: jest.fn(),
    searchContactList: [],
    selectedMatcherIndex: -1,
    sessionId: 'session-1',
    startReply: jest.fn(),
    toPhoneNumber: '+16505550999',
    toVoiceMail: jest.fn(),
  };
  const { rerender } = render(<IncomingCallPanel {...props}>child-node</IncomingCallPanel>);
  expect(screen.getByText('Caller ID')).toBeInTheDocument();
  fireEvent.click(screen.getByText('answer'));
  fireEvent.click(screen.getByText('forward'));
  fireEvent.click(screen.getByText('search-contact'));
  fireEvent.click(screen.getByText('icon-button'));
  expect(props.answer).toHaveBeenCalled();
  expect(props.onForward).toHaveBeenCalledWith('101');
  expect(props.searchContact).toHaveBeenCalledWith('Ada');
  expect(props.onBackButtonClick).toHaveBeenCalled();
  const matches = [{
    firstName: 'Ada',
    id: 'match-1',
    lastName: 'Lovelace',
    name: 'Ada Lovelace',
  }, {
    firstName: 'Grace',
    id: 'match-2',
    lastName: 'Hopper',
    name: 'Grace Hopper',
  }];
  rerender(
    <IncomingCallPanel
      {...props}
      callQueueName=""
      fallBackName=""
      name="Grace Hopper"
      nameMatches={matches}
      selectedMatcherIndex={1}
      toPhoneNumber=""
    />,
  );
  fireEvent.click(screen.getByText('Ada Lovelace'));
  expect(props.onSelectMatcherName).toHaveBeenCalledWith(matches[0]);
  expect(screen.getAllByText('Grace Hopper')).toHaveLength(2);
});

test('builds log messages default pages and customized save flow', async () => {
  const onSaveLog = jest.fn();
  const onCustomizedFieldChange = jest.fn();
  const onFormPageButtonClick = jest.fn();
  const conversationLog = {
    '2026-01-01': {
      conversationId: 'conversation-1',
      conversationLogMatches: [{ id: 'log-1' }],
      correspondents: [{ phoneNumber: '+16505550123' }],
    },
  };
  const baseProps = {
    conversationLog,
    correspondentMatches: [{ description: 'CRM', id: 'contact-1', name: 'Ada' }],
    currentLocale: 'en-US',
    customizedPage: null,
    dateTimeFormatter: jest.fn(() => 'formatted-date'),
    formatPhone: jest.fn((number) => `formatted-${number}`),
    hideBackButton: false,
    isLogging: false,
    lastMatchedCorrespondentEntity: { id: 'contact-1' },
    onBackButtonClick: jest.fn(),
    onClose: jest.fn(),
    onCustomizedFieldChange,
    onFormPageButtonClick,
    onSaveLog,
    showCloseButton: true,
  };
  const { rerender } = render(<LogMessagesPanel {...baseProps} />);
  await screen.findByText('Edit log');
  expect(screen.getByTestId('form-contact')).toHaveTextContent('contact-1');
  fireEvent.click(screen.getByText('change-form'));
  fireEvent.click(screen.getByText('custom-button'));
  fireEvent.click(screen.getByText('save'));
  expect(onCustomizedFieldChange).toHaveBeenCalledWith(conversationLog, { contactId: 'contact-2' }, ['contactId']);
  expect(onFormPageButtonClick).toHaveBeenCalledWith('custom-button');
  expect(onSaveLog).toHaveBeenCalledWith({
    conversationId: 'conversation-1',
    formData: { note: 'saved' },
  });
  rerender(
    <LogMessagesPanel
      {...baseProps}
      conversationLog={{
        '2026-01-02': {
          conversationId: 'conversation-2',
          conversationLogMatches: [],
          correspondents: [{ phoneNumber: '+16505550000' }],
        },
      }}
      correspondentMatches={[]}
      customizedPage={{
        formData: { contactId: 'custom-contact' },
        id: 'custom-page',
        schema: { properties: { note: {} }, type: 'object' },
        title: 'Custom log page',
        uiSchema: {},
      }}
      lastMatchedCorrespondentEntity={null}
    />,
  );
  await screen.findByText('Custom log page');
  expect(screen.getByTestId('schema-fields')).toHaveTextContent('note');
  expect(screen.getByTestId('form-contact')).toHaveTextContent('custom-contact');
});

test('navigates contact details tabs and invokes contact actions', async () => {
  const props = createContactDetailsProps();
  const { rerender, unmount } = render(<ContactDetails {...props} />);
  fireEvent.click(screen.getByText('call +16505550123'));
  fireEvent.click(screen.getByText('text +16505550123'));
  fireEvent.click(screen.getAllByText('Schedule')[1]);
  fireEvent.click(screen.getByText('ada@example.com'));
  expect(props.onClickToDial).toHaveBeenCalledWith(props.contact, '+16505550123');
  expect(props.onClickToSMS).toHaveBeenCalledWith(props.contact, '+16505550123');
  expect(props.onClickAdditionalAction).toHaveBeenCalledWith('schedule', expect.objectContaining({
    phoneNumber: '+16505550123',
    phoneType: 'direct',
  }));
  expect(props.onClickMailTo).toHaveBeenCalledWith('ada@example.com', 'company');
  fireEvent.click(screen.getByText('Calls'));
  await waitFor(() => expect(props.loadCalls).toHaveBeenCalled());
  expect(screen.getByText('missed')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Messages'));
  await waitFor(() => expect(props.loadMessages).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Unread message'));
  fireEvent.click(screen.getByText('Remote message'));
  expect(props.navigateTo).toHaveBeenCalledWith('/conversations/conversation-1');
  expect(props.navigateTo).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('Activities'));
  await waitFor(() => expect(props.loadActivities).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Follow up'));
  expect(props.openActivityDetail).toHaveBeenCalledWith(props.activities[0]);
  fireEvent.click(screen.getByText('Apps'));
  expect(screen.getByText('CRM')).toBeInTheDocument();
  rerender(
    <ContactDetails
      {...props}
      contact={createContact({
        company: '',
        department: '',
        emails: [],
        jobTitle: '',
        phoneNumbers: [],
        site: null,
        status: extensionStatusTypes.notActivated,
      })}
      showActivities={false}
      showApps={false}
    />,
  );
  expect(screen.getByText('(notActivated)')).toBeInTheDocument();
  unmount();
  expect(props.clearCalls).toHaveBeenCalled();
  expect(props.clearMessages).toHaveBeenCalled();
  expect(props.clearActivities).toHaveBeenCalled();
  expect(render(<ContactDetails {...props} contact={null} />).container).toBeEmptyDOMElement();
});

test('covers generic meeting custom, spinner, rcm, rcv and schedule branches', async () => {
  const schedule = jest.fn(async () => {});
  const updateMeetingSettings = jest.fn();
  const { rerender } = render(
    <GenericMeetingPanel
      {...createMeetingProps({ schedule, updateMeetingSettings })}
    />,
  );
  expect(screen.getByTestId('meeting-configs-v2')).toBeInTheDocument();
  fireEvent.change(screen.getByTestId('meeting-topic'), { target: { value: 'Updated topic' } });
  fireEvent.click(screen.getByText('schedule-meeting'));
  await waitFor(() => expect(schedule).toHaveBeenCalledWith(expect.objectContaining({
    topic: 'Updated topic',
  }), null));
  expect(updateMeetingSettings).toHaveBeenCalledWith(expect.objectContaining({ topic: 'Updated topic' }));
  mockIsSafari.mockReturnValue(true);
  rerender(
    <GenericMeetingPanel
      {...createMeetingProps({
        isRCM: false,
        isRCV: true,
        meeting: { name: 'Video topic' },
        schedule,
        updateMeetingSettings,
      })}
    />,
  );
  fireEvent.change(screen.getByTestId('meeting-topic'), { target: { value: 'Updated video' } });
  fireEvent.click(screen.getByText('schedule-meeting'));
  await waitFor(() => expect(window.open).toHaveBeenCalled());
  await waitFor(() => expect(schedule).toHaveBeenLastCalledWith(expect.objectContaining({
    name: 'Updated video',
  }), expect.anything()));
  rerender(<GenericMeetingPanel {...createMeetingProps({ showSpinner: true })} />);
  expect(screen.getByTestId('spinner-overlay')).toBeInTheDocument();
  rerender(<GenericMeetingPanel showCustom CustomPanel={<div data-sign="custom-meeting" data-testid="custom-meeting">custom</div>} />);
  expect(screen.getByTestId('custom-meeting')).toBeInTheDocument();
  rerender(
    <GenericMeetingPanel
      {...createMeetingProps({ disabled: true, schedule })}
    />,
  );
  fireEvent.click(screen.getByText('schedule-meeting'));
  expect(schedule).toHaveBeenCalledTimes(2);
});

test('parks active calls and handles session end states', async () => {
  const onBack = jest.fn();
  const onCallEnd = jest.fn();
  const onPark = jest.fn(async (locationId) => ({
    destination: locationId || '801',
    fromNumber: '+16505550123',
  }));
  const onText = jest.fn(async () => {});
  const props = {
    currentLocale: 'en-US',
    formatPhone: jest.fn((number) => `formatted-${number}`),
    onBack,
    onCallEnd,
    onPark,
    onText,
    parkLocations: [{
      extension: {
        extensionNumber: '801',
        name: 'Park 801',
        status: 'Enabled',
      },
      id: 'location-1',
      presence: { activeCalls: [] },
    }, {
      extension: {
        extensionNumber: '802',
        name: 'Park 802',
        status: 'Disabled',
      },
      id: 'location-2',
      presence: { activeCalls: [] },
    }, {
      extension: {
        extensionNumber: '803',
        name: 'Park 803',
        status: 'Enabled',
      },
      id: 'location-3',
      presence: { activeCalls: [{}] },
    }],
    session: { id: 'session-1' },
  };
  const { rerender } = render(<ParkPanel {...props} />);
  fireEvent.click(screen.getAllByText('parkCurrentCall')[0]);
  await waitFor(() => expect(onPark).toHaveBeenCalledWith());
  fireEvent.click(screen.getAllByText('parkCurrentCallAndSendText')[0]);
  await waitFor(() => expect(onText).toHaveBeenCalledWith('You have a call from formatted-+16505550123 at 801'));
  fireEvent.click(screen.getByText('back-header'));
  expect(onBack).toHaveBeenCalled();
  rerender(<ParkPanel {...props} session={null} />);
  await waitFor(() => expect(onCallEnd).toHaveBeenCalled());
  expect(document.body).not.toHaveTextContent('parkLocation');
});

test('edits voicemail drop messages including upload and external branches', async () => {
  const onSave = jest.fn();
  const originalFileReader = global.FileReader;
  class TestFileReader {
    readAsDataURL(file) {
      this.result = `data:${file.name}`;
      this.onload();
    }
  }
  global.FileReader = TestFileReader;
  const { rerender } = render(
    <VoicemailDropMessage
      currentLocale="en-US"
      message={{ file: 'data:old', fileName: 'old.mp3', id: 'message-1', label: 'Old label' }}
      onSave={onSave}
    />,
  );
  fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'New label' } });
  const fileInput = document.querySelector('input[type="file"]');
  Object.defineProperty(fileInput, 'files', {
    configurable: true,
    value: [new File(['voice'], 'voice.mp3', { type: 'audio/mpeg' })],
  });
  fireEvent.change(fileInput);
  await waitFor(() => expect(screen.getByText('voice.mp3')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Save'));
  expect(onSave).toHaveBeenCalledWith({
    file: 'data:voice.mp3',
    fileName: 'voice.mp3',
    id: 'message-1',
    label: 'New label',
  });
  Object.defineProperty(fileInput, 'files', {
    configurable: true,
    value: [new File(['x'.repeat(9000 * 1024)], 'big.mp3', { type: 'audio/mpeg' })],
  });
  fireEvent.change(fileInput);
  rerender(
    <VoicemailDropMessage
      currentLocale="en-US"
      message={{ id: 'external-1', label: 'External', uri: 'https://example.com/external.mp3' }}
      onSave={onSave}
    />,
  );
  expect(screen.getByLabelText('Label')).toBeDisabled();
  expect(screen.queryByText('Save')).not.toBeInTheDocument();
  global.FileReader = originalFileReader;
});

test('maps other device controls and call info status variants', async () => {
  const updateSessionMatchedContact = jest.fn();
  const setActiveSessionId = jest.fn();
  const onBackButtonClick = jest.fn();
  const onHangup = jest.fn();
  const activeSession = {
    isOnHold: false,
    isOnMute: true,
    startTime: 100,
  };
  const { rerender } = render(
    <OtherDeviceCallCtrlPanel
      activeSession={activeSession}
      areaCode="650"
      brandName="RingCentral"
      countryCode="US"
      currentLocale="en-US"
      fallBackName="Caller"
      formatPhone={(number) => `formatted-${number}`}
      nameMatches={[{ id: 'match-1', name: 'Ada' }]}
      onBackButtonClick={onBackButtonClick}
      onHangup={onHangup}
      phoneNumber="+16505550123"
      sessionId="session-1"
      setActiveSessionId={setActiveSessionId}
      updateSessionMatchedContact={updateSessionMatchedContact}
    />,
  );
  expect(setActiveSessionId).toHaveBeenCalledWith('session-1');
  fireEvent.click(screen.getByText('Ada'));
  fireEvent.click(screen.getByText('missing-match'));
  fireEvent.click(screen.getByText('hangup'));
  expect(updateSessionMatchedContact).toHaveBeenCalledWith('session-1', { id: 'match-1', name: 'Ada' });
  expect(updateSessionMatchedContact).toHaveBeenCalledWith('session-1', { id: 'missing', name: 'Missing' });
  expect(onHangup).toHaveBeenCalled();
  rerender(
    <OtherDeviceCallCtrlPanel
      activeSession={null}
      onBackButtonClick={onBackButtonClick}
      sessionId="session-1"
      setActiveSessionId={setActiveSessionId}
      updateSessionMatchedContact={updateSessionMatchedContact}
    />,
  );
  await waitFor(() => expect(onBackButtonClick).toHaveBeenCalled());
  const dateTimeFormatter = jest.fn(() => 'formatted-date');
  const formatPhone = jest.fn((number) => `formatted-${number}`);
  const { rerender: rerenderCallInfo } = render(
    <CallInfo
      call={{
        direction: callDirections.inbound,
        duration: undefined,
        from: { phoneNumber: '+16505550111' },
        result: telephonyStatuses.ringing,
        startTime: 100,
        to: { phoneNumber: '+16505550123' },
      }}
      currentLocale="en-US"
      dateTimeFormatter={dateTimeFormatter}
      formatPhone={formatPhone}
    />,
  );
  expect(screen.getByTestId('shiny-bar')).toHaveAttribute('data-ringing', 'true');
  rerenderCallInfo(
    <CallInfo
      call={{
        direction: callDirections.outbound,
        duration: 125,
        startTime: 200,
        telephonyStatus: telephonyStatuses.onHold,
        to: { extensionNumber: '102' },
      }}
      currentLocale="en-US"
      dateTimeFormatter={dateTimeFormatter}
      formatPhone={formatPhone}
    />,
  );
  expect(formatPhone).toHaveBeenLastCalledWith('102');
});

test('renders meeting items with recording and log actions', () => {
  const onClick = jest.fn();
  const onLog = jest.fn();
  const { rerender } = render(
    <MeetingItem
      currentLocale="en-US"
      dateTimeFormatter={() => 'formatted-date'}
      displayName="Recorded meeting"
      duration={60}
      hostInfo={{ displayName: 'Ada' }}
      id="meeting-1"
      logTitle="Log meeting"
      onClick={onClick}
      onLog={onLog}
      recordings={[{ metadata: { duration: 300 } }]}
      showLog
      startTime="2026-01-01T00:00:00.000Z"
      type="recordings"
    />,
  );
  fireEvent.click(screen.getByText('icon-button'));
  fireEvent.click(screen.getByText('play'));
  fireEvent.click(screen.getByText('Log meeting'));
  expect(onClick).toHaveBeenCalledWith('meeting-1');
  expect(onLog).toHaveBeenCalled();
  rerender(
    <MeetingItem
      currentLocale="en-US"
      dateTimeFormatter={() => 'formatted-date'}
      displayName="Plain meeting"
      duration={120}
      hostInfo={null}
      id="meeting-2"
      onClick={onClick}
      recordings={[]}
      startTime="2026-01-01T00:00:00.000Z"
      type="meeting"
    />,
  );
  expect(screen.getByText('Plain meeting')).toBeInTheDocument();
});
