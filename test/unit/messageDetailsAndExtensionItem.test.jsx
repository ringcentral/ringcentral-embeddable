/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import { ExtensionItem } from '../../src/components/CallHUDPanel/ExtensionItem';
import { MessageDetailsPanel } from '../../src/components/MessageDetailsPanel';

jest.mock('@ringcentral-integration/widgets/components/MessageItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ActionMenuList/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/MessageItem/styles.scss', () => ({
  contactDisplay: 'contact-display',
  dropdownSelect: 'dropdown-select',
  selectedValue: 'selected-value',
}));

jest.mock('@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber', () => ({
  checkShouldHidePhoneNumber: jest.fn(() => false),
}));

jest.mock('@ringcentral-integration/widgets/lib/checkShouldHideContactUser', () => ({
  checkShouldHideContactUser: jest.fn(() => false),
}));

jest.mock('@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper', () => ({
  getPresenceStatus: jest.fn((presence) => presence?.presenceStatus || 'available'),
}));

jest.mock('@ringcentral-integration/widgets/lib/getPresenceStatusName', () => ({
  getPresenceStatusName: jest.fn((presenceStatus, dndStatus) => `${presenceStatus}-${dndStatus}`),
}));

jest.mock('@ringcentral-integration/widgets/components/DurationCounter', () => (
  function MockDurationCounter({ startTime }) {
    return <span>{`duration-${startTime}`}</span>;
  }
));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    AddMemberBorder: createIcon('AddMemberBorder'),
    AddTextLog: createIcon('AddTextLog'),
    Apps: createIcon('Apps'),
    CallQueue: createIcon('CallQueue'),
    CallsBorder: createIcon('CallsBorder'),
    Check: createIcon('Check'),
    DefaultGroupAvatar: createIcon('DefaultGroupAvatar'),
    Delete: createIcon('Delete'),
    Download: createIcon('Download'),
    Edit: createIcon('Edit'),
    Logout: createIcon('Logout'),
    NewAction: createIcon('NewAction'),
    OuboundCallOnBehalf: createIcon('Assign'),
    ParkCallSp: createIcon('ParkCallSp'),
    People: createIcon('People'),
    PhoneBorder: createIcon('PhoneBorder'),
    PickUpCall: createIcon('PickUpCall'),
    Read: createIcon('Read'),
    Refresh: createIcon('Refresh'),
    SettingsBorder: createIcon('SettingsBorder'),
    SmsBorder: createIcon('SmsBorder'),
    TodayCalendarIco: createIcon('TodayCalendarIco'),
    Unread: createIcon('Unread'),
    ViewBorder: createIcon('ViewBorder'),
    ViewLogBorder: createIcon('ViewLogBorder'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'anchorEl',
        'color',
        'component',
        'focusVariant',
        'iconVariant',
        'innerRef',
        'maxActions',
        'presenceProps',
        'primaryTypographyProps',
        'secondaryTypographyProps',
        'size',
        'sourceIcons',
        'symbol',
        'variant',
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
      'data-testid': props['data-testid'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.a = () => createComponent('a', 'styled-link');
  styled.div = () => createComponent('div', 'styled-div');
  styled.span = () => createComponent('span', 'styled-span');
  return {
    RcAvatar: createComponent('div', 'avatar'),
    RcChip: ({ label }) => <span>{label}</span>,
    RcIcon: createComponent('span', 'icon'),
    RcListItem: createComponent('div', 'list-item'),
    RcListItemAvatar: createComponent('div', 'list-item-avatar'),
    RcListItemText: ({ primary, secondary }) => (
      <div>
        <div data-testid="primary">{primary}</div>
        <div data-testid="secondary">{secondary}</div>
      </div>
    ),
    RcPresence: ({ type }) => <span>{`presence-${type}`}</span>,
    RcText: createComponent('span', 'text'),
    RcTooltip: ({ children, title }) => (
      <span title={typeof title === 'string' ? title : undefined}>{children}</span>
    ),
    RcTypography: createComponent('span', 'typography'),
    ellipsis: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    styled,
  };
});

jest.mock('@ringcentral-integration/widgets/components/ContactDisplay', () => (
  function MockContactDisplay({
    contactMatches = [],
    disabled,
    fallBackName,
    onSelectContact,
    phoneNumber,
    showPlaceholder,
  }) {
    return (
      <div data-disabled={disabled ? 'true' : 'false'} data-testid="contact-display">
        <span>{fallBackName || phoneNumber}</span>
        {contactMatches.map((contact, index) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => onSelectContact(contact, String(index + (showPlaceholder ? 1 : 0)))}
          >
            {`select-${contact.id}`}
          </button>
        ))}
      </div>
    );
  }
));

jest.mock('../../src/components/ActionMenu', () => ({
  ActionMenu: ({ actions = [] }) => (
    <div data-testid="action-menu">
      {actions.map((action) => (
        <button
          key={action.id}
          disabled={action.disabled}
          type="button"
          onClick={(event) => action.onClick(event)}
        >
          {action.title || action.id}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../src/components/AudioPlayer', () => ({
  AudioPlayer: ({ disabled, onPlay, uri }) => (
    <button disabled={disabled || !uri} type="button" onClick={onPlay}>
      play-audio
    </button>
  ),
}));

jest.mock('../../src/components/ConfirmDialog', () => ({
  ConfirmDialog: ({
    confirmText = 'Confirm',
    onClose,
    onConfirm,
    open,
    title,
  }) => (
    open ? (
      <div role="dialog">
        <span>{title}</span>
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="button" onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null
  ),
}));

jest.mock('../../src/components/ContactAvatar', () => ({
  ContactAvatar: ({ contact }) => (
    <div data-testid="contact-avatar">{contact?.name || contact?.id || 'avatar'}</div>
  ),
}));

function createMessage(overrides = {}) {
  return {
    conversationId: 'conversation-1',
    conversationMatches: [],
    correspondentMatches: [{
      id: 'contact-1',
      name: 'Customer One',
    }],
    correspondents: [{
      name: 'Voicemail Sender',
      phoneNumber: '+16505550101',
    }],
    creationTime: 1000,
    direction: messageDirection.inbound,
    faxAttachment: null,
    isLogging: false,
    self: {
      phoneNumber: '+16505550100',
    },
    type: messageTypes.voiceMail,
    unreadCounts: 1,
    voicemailAttachment: {
      duration: 65,
      uri: 'https://media.example.com/voicemail',
    },
    ...overrides,
  };
}

function createMessageProps(overrides = {}) {
  return {
    areaCode: '650',
    brand: 'RingCentral',
    countryCode: 'US',
    currentLocale: 'en-US',
    dateTimeFormatter: jest.fn(({ type }) => `formatted-${type}`),
    deleteMessage: jest.fn(),
    enableContactFallback: true,
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    internalSmsPermission: true,
    markMessage: jest.fn(),
    message: createMessage(),
    messageId: 'message-1',
    onClickAdditionalAction: jest.fn(),
    onClickToDial: jest.fn(),
    onClickToSms: jest.fn(),
    onCreateContact: jest.fn(async () => {}),
    onFaxDownload: jest.fn(),
    onLogConversation: jest.fn(async () => {}),
    onRefreshContact: jest.fn(),
    onSelectContact: jest.fn(),
    onViewContact: jest.fn(),
    onViewMessage: jest.fn(),
    outboundSmsPermission: true,
    previewFaxMessages: jest.fn(),
    readMessage: jest.fn(),
    showLogButton: true,
    unmarkMessage: jest.fn(),
    ...overrides,
  };
}

function createActiveCall(overrides = {}) {
  return {
    direction: callDirections.inbound,
    from: '+16505550101',
    fromName: 'Customer One',
    offset: 0,
    startTime: 1000,
    telephonyStatus: 'Ringing',
    to: '102',
    toName: 'Support',
    ...overrides,
  };
}

function createExtensionItemProps(overrides = {}) {
  return {
    canEdit: true,
    canPark: true,
    currentLocale: 'en-US',
    disableClickToDial: false,
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    item: {
      extension: {
        extensionNumber: '101',
        id: 'extension-1',
        name: 'Ada Lovelace',
        status: 'Enabled',
        type: 'User',
      },
      presence: {
        activeCalls: [],
        dndStatus: 'TakeAllCalls',
        presenceStatus: 'Available',
      },
    },
    onClickToDial: jest.fn(),
    onPark: jest.fn(),
    onRemoveExtension: jest.fn(),
    onText: jest.fn(),
    pickCallQueueCall: jest.fn(),
    pickGroupCall: jest.fn(),
    pickParkLocation: jest.fn(),
    ...overrides,
  };
}

describe('MessageDetailsPanel', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('handles voicemail contact selection, actions, playback, and delete confirmation', async () => {
    const props = createMessageProps({
      additionalActions: [{ id: 'crm', icon: 'apps', label: 'CRM action' }],
      autoLog: true,
      logButtonTitle: 'Log voicemail',
      shouldLogSelectRecord: true,
      transcription: { text: 'Please call me back.' },
    });

    render(<MessageDetailsPanel {...props} />);

    await waitFor(() => {
      expect(props.onViewMessage).toHaveBeenCalledWith('message-1');
    });
    expect(screen.getByText('Please call me back.')).toBeTruthy();
    expect(screen.getByText('formatted-+16505550100')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'select-contact-1' }));
    await waitFor(() => {
      expect(props.onLogConversation).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        correspondentEntity: { id: 'contact-1', name: 'Customer One' },
        prefill: false,
        redirect: false,
      });
    });
    expect(props.onSelectContact).toHaveBeenCalledWith({
      conversation: props.message,
      correspondentEntity: { id: 'contact-1', name: 'Customer One' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'call' }));
    expect(props.onClickToDial).toHaveBeenCalledWith({
      id: 'contact-1',
      name: 'Customer One',
      fromType: messageTypes.voiceMail,
      phoneNumber: '+16505550101',
    });

    fireEvent.click(screen.getByRole('button', { name: 'text' }));
    expect(props.onClickToSms).toHaveBeenCalledWith({
      id: 'contact-1',
      name: 'Customer One',
      phoneNumber: '+16505550101',
    });

    fireEvent.click(screen.getByRole('button', { name: 'View contact details' }));
    expect(props.onViewContact).toHaveBeenCalledWith(expect.objectContaining({
      contact: { id: 'contact-1', name: 'Customer One' },
      phoneNumber: '+16505550101',
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Refresh contact' }));
    expect(props.onRefreshContact).toHaveBeenCalledWith({
      phoneNumber: '+16505550101',
    });

    fireEvent.click(screen.getByRole('button', { name: 'play-audio' }));
    expect(props.readMessage).toHaveBeenCalledWith('conversation-1');

    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }));
    expect(props.unmarkMessage).toHaveBeenCalledWith('conversation-1');

    fireEvent.click(screen.getByRole('button', { name: 'CRM action' }));
    expect(props.onClickAdditionalAction).toHaveBeenCalledWith('crm', props.message);

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(screen.getByText('sureToDeleteVoiceMail')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(props.deleteMessage).toHaveBeenCalledWith('conversation-1');
  });

  it('handles fax preview, date formatting failures, mark unread, and contact creation', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const props = createMessageProps({
      dateTimeFormatter: jest.fn(() => {
        throw new Error('bad date');
      }),
      message: createMessage({
        correspondentMatches: [],
        direction: messageDirection.outbound,
        faxAttachment: {
          uri: 'https://media.example.com/fax',
        },
        self: {
          extension: '102',
        },
        type: messageTypes.fax,
        unreadCounts: 0,
        voicemailAttachment: null,
      }),
      messageId: 'fax-1',
      showLogButton: false,
    });

    render(<MessageDetailsPanel {...props} />);

    await waitFor(() => {
      expect(props.onViewMessage).toHaveBeenCalledWith('fax-1');
    });
    expect(console.error).toHaveBeenCalledWith('Format date time error', 1000);
    expect(screen.getByText('102')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'preview' }));
    expect(props.previewFaxMessages).toHaveBeenCalledWith(
      'https://media.example.com/fax',
      'conversation-1',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark as unread' }));
    expect(props.markMessage).toHaveBeenCalledWith('conversation-1');

    fireEvent.click(screen.getByRole('button', { name: 'addEntity' }));
    await waitFor(() => {
      expect(props.onCreateContact).toHaveBeenCalledWith({
        entityType: undefined,
        name: 'Voicemail Sender',
        phoneNumber: '+16505550101',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(screen.getByText('sureToDeleteFax')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(props.deleteMessage).toHaveBeenCalledWith('conversation-1');
  });

  it('renders message details with default optional props', () => {
    const props = createMessageProps({
      message: createMessage({
        conversationMatches: undefined,
        correspondents: [
          { name: 'Ada', phoneNumber: '+16505550101' },
          { extensionNumber: '102', name: 'Support' },
        ],
        faxAttachment: null,
        lastMatchedCorrespondentEntity: null,
        type: messageTypes.fax,
        voicemailAttachment: null,
      }),
      messageId: undefined,
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
      'enableCDC',
      'internalSmsPermission',
      'logButtonTitle',
      'maxExtensionNumberLength',
      'onClickAdditionalAction',
      'onClickToDial',
      'onClickToSms',
      'onCreateContact',
      'onFaxDownload',
      'onLogConversation',
      'onRefreshContact',
      'onSelectContact',
      'onViewContact',
      'onViewMessage',
      'outboundSmsPermission',
      'phoneSourceNameRenderer',
      'phoneTypeRenderer',
      'previewFaxMessages',
      'renderContactList',
      'renderContactName',
      'shouldLogSelectRecord',
      'showContactDisplayPlaceholder',
      'showLogButton',
      'sourceIcons',
      'transcription',
    ].forEach((key) => {
      delete props[key];
    });

    render(<MessageDetailsPanel {...props} />);

    expect(document.querySelector('[data-testid="contact-display"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'select-contact-1' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ExtensionItem', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles user call and remove actions', () => {
    const props = createExtensionItemProps({
      item: {
        extension: {
          extensionNumber: '101',
          id: 'user-1',
          name: 'Ada Lovelace',
          status: 'Enabled',
          type: 'User',
        },
        presence: {
          activeCalls: [createActiveCall({
            telephonyStatus: 'OnHold',
          })],
          dndStatus: 'TakeAllCalls',
          presenceStatus: 'Available',
        },
      },
    });

    render(<ExtensionItem {...props} />);

    expect(screen.getByText('On hold')).toBeTruthy();
    expect(screen.getByText('with Customer One')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Call' }));
    expect(props.onClickToDial).toHaveBeenCalledWith({
      id: 'user-1',
      name: 'Ada Lovelace',
      phoneNumber: '101',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText('Do you want to remove Ada Lovelace from your HUD list?')).toBeTruthy();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    expect(props.onRemoveExtension).toHaveBeenCalledWith('user-1');
  });

  it('handles park location parking, pickup, text notification, and removal', () => {
    const availableProps = createExtensionItemProps({
      item: {
        extension: {
          extensionNumber: '801',
          id: 'park-1',
          name: 'Park 1',
          status: 'Enabled',
          type: 'ParkLocation',
        },
        presence: {
          activeCalls: [],
        },
      },
    });
    const { rerender } = render(<ExtensionItem {...availableProps} />);

    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('You can park call here')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Park current call' }));
    expect(availableProps.onPark).toHaveBeenCalledWith(availableProps.item.extension);

    const activeCall = createActiveCall({
      fromName: 'Casey Customer',
      telephonyStatus: 'ParkedCall',
    });
    const activeProps = createExtensionItemProps({
      item: {
        extension: {
          extensionNumber: '801',
          id: 'park-1',
          name: 'Park 1',
          status: 'Enabled',
          type: 'ParkLocation',
        },
        presence: {
          activeCalls: [activeCall],
        },
      },
    });
    rerender(<ExtensionItem {...activeProps} />);

    expect(screen.getByText('Parked')).toBeTruthy();
    expect(screen.getByText('Call from Casey Customer')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pick up call' }));
    expect(activeProps.pickParkLocation).toHaveBeenCalledWith(
      activeProps.item.extension,
      activeCall,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Notify by text' }));
    expect(activeProps.onText).toHaveBeenCalledWith('You have a call from Casey Customer at Park 1');

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText('Are you sure you want to remove Park 1 from your park locations?')).toBeTruthy();
  });

  it('handles group pickup, call queue pickup, and disabled extensions', () => {
    const groupCall = createActiveCall({
      from: '+16505550101',
      fromName: 'Customer One',
      telephonyStatus: 'Ringing',
      to: '102',
      toName: 'Support',
    });
    const props = createExtensionItemProps({
      canEdit: false,
      item: {
        extension: {
          extensionNumber: '700',
          id: 'group-1',
          name: 'Pickup Group',
          status: 'Enabled',
          type: 'GroupCallPickup',
        },
        presence: {
          activeCalls: [groupCall],
        },
      },
    });
    const { rerender } = render(<ExtensionItem {...props} />);

    expect(screen.getByText('Incoming call')).toBeTruthy();
    expect(screen.getByText('from Customer One to Support')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pick up call' }));
    expect(props.pickGroupCall).toHaveBeenCalledWith(props.item.extension, groupCall);

    const queueCall = createActiveCall({
      telephonyStatus: 'callConnected',
    });
    const queueProps = createExtensionItemProps({
      canEdit: false,
      item: {
        extension: {
          extensionNumber: '900',
          id: 'queue-1',
          name: 'Support Queue',
          status: 'Enabled',
          type: 'Department',
        },
        presence: {
          activeCalls: [queueCall],
        },
      },
    });
    rerender(<ExtensionItem {...queueProps} />);
    expect(screen.getByText('Active call')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pick up call' }));
    expect(queueProps.pickCallQueueCall).toHaveBeenCalledWith(
      queueProps.item.extension,
      queueCall,
    );

    const disabledProps = createExtensionItemProps({
      item: {
        extension: {
          extensionNumber: '103',
          id: 'disabled-1',
          name: 'Disabled User',
          status: 'Disabled',
          type: 'User',
        },
        presence: {
          activeCalls: [queueCall],
        },
      },
    });
    rerender(<ExtensionItem {...disabledProps} />);
    expect(screen.getByText('Disabled User')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Call' })).toBeNull();
  });

  it('renders extension fallback avatars, missing presence, multiple calls and cancel removal', () => {
    const userProps = createExtensionItemProps({
      item: {
        extension: {
          extensionNumber: '104',
          id: 'user-image',
          name: 'Image User',
          profileImageUrl: 'https://example.com/avatar.png',
          status: 'Enabled',
          type: 'User',
        },
        presence: undefined,
      },
    });
    const { rerender } = render(<ExtensionItem {...userProps} />);
    expect(screen.getByText('Image User')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Call' })).toBeTruthy();

    const parkWithoutPresence = createExtensionItemProps({
      item: {
        extension: {
          extensionNumber: '802',
          id: 'park-no-presence',
          name: 'Park without presence',
          status: 'Enabled',
          type: 'ParkLocation',
        },
        presence: undefined,
      },
    });
    rerender(<ExtensionItem {...parkWithoutPresence} />);
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Park current call' })).toBeNull();

    const genericProps = createExtensionItemProps({
      item: {
        extension: {
          id: 'generic-group',
          name: 'Generic Group',
          status: 'Enabled',
          type: 'SharedLinesGroup',
        },
        presence: {
          activeCalls: [],
        },
      },
    });
    rerender(<ExtensionItem {...genericProps} />);
    expect(screen.getByText('Generic Group')).toBeTruthy();

    const multiCallProps = createExtensionItemProps({
      item: {
        extension: {
          extensionNumber: '701',
          id: 'multi-group',
          name: 'Multi Group',
          status: 'Enabled',
          type: 'GroupCallPickup',
        },
        presence: {
          activeCalls: [
            createActiveCall({
              direction: callDirections.outbound,
              from: 'Support',
              fromName: 'Support',
              sessionId: 'multi-1',
              telephonyStatus: 'Ringing',
              to: '+16505550120',
              toName: '',
            }),
            createActiveCall({
              sessionId: 'multi-2',
              telephonyStatus: 'OnHold',
            }),
          ],
        },
      },
    });
    rerender(<ExtensionItem {...multiCallProps} />);
    expect(screen.getByText('Active call')).toBeTruthy();
    expect(screen.getByText('On hold')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pick up call' }));
    expect(multiCallProps.pickGroupCall).toHaveBeenCalledWith(
      multiCallProps.item.extension,
      multiCallProps.item.presence.activeCalls[0],
    );

    rerender(<ExtensionItem {...userProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
