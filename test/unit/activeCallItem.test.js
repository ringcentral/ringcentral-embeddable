/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';

import { ActiveCallItem } from '../../src/components/ActiveCallItem';
import { voicemailDropStatus } from '../../src/modules/WebphoneV2/voicemailDropStatus';

jest.mock('@ringcentral-integration/widgets/components/ActiveCallItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ActiveCallItemV2/styles.scss', () => ({
  contactDisplay: 'contactDisplay',
  selectIcon: 'selectIcon',
}));

jest.mock('@ringcentral-integration/widgets/assets/images/img_call_switch.svg', () => ({
  __esModule: true,
  default: (props) => (
    <svg data-sign="switch-image" data-testid="switch-image" {...props} />
  ),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    Phone: createIcon('Phone'),
    PhoneOff: createIcon('PhoneOff'),
    Hold: createIcon('Hold'),
    HoldAnswer: createIcon('HoldAnswer'),
    Ignore: createIcon('Ignore'),
    Merge: createIcon('Merge'),
    Swap: createIcon('Swap'),
    TransferCall: createIcon('TransferCall'),
    Voicemail: createIcon('Voicemail'),
    NewAction: createIcon('NewAction'),
    Edit: createIcon('Edit'),
    ViewLogBorder: createIcon('ViewLogBorder'),
    People: createIcon('People'),
    Conference: createIcon('Conference'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      !['actions', 'maxActions', 'iconVariant', 'color', 'symbol', 'size'].includes(key)
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
  return {
    RcAvatar: createComponent('div', 'avatar'),
    RcButton: createComponent('button', 'button'),
    RcDialog: createComponent('div', 'dialog'),
    RcDialogActions: createComponent('div', 'dialog-actions'),
    RcDialogContent: createComponent('div', 'dialog-content'),
    RcDialogTitle: createComponent('h2', 'dialog-title'),
    RcIcon: createComponent('span', 'icon'),
    RcListItemAvatar: createComponent('div', 'list-item-avatar'),
    RcListItemText: ({ primary, secondary, onClick, ...props }) => (
      <div {...cleanProps(props)} onClick={onClick}>
        <div data-testid="primary">{primary}</div>
        <div data-testid="secondary">{secondary}</div>
      </div>
    ),
    RcTypography: createComponent('p', 'typography'),
    styled,
  };
});

jest.mock('@ringcentral-integration/widgets/components/ContactDisplay', () => {
  const React = require('react');
  return function MockContactDisplay({
    contactMatches = [],
    fallBackName,
    phoneNumber,
    onSelectContact,
  }) {
    return (
      <div data-testid="contact-display">
        <span>{fallBackName || phoneNumber}</span>
        {contactMatches.map((contact, index) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => onSelectContact(contact, index)}
          >
            {`select-${contact.id}`}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('@ringcentral-integration/widgets/components/DurationCounter', () => (
  function MockDurationCounter({ startTime }) {
    return <span>{`duration-${startTime}`}</span>;
  }
));

jest.mock('../../src/components/CallItem/styled', () => {
  const React = require('react');
  const createWrapper = (testId) => ({ children, ...props }) => (
    <div data-testid={testId} onClick={props.onClick}>
      {children}
    </div>
  );
  return {
    StyledListItem: createWrapper('call-item'),
    StyledSecondary: createWrapper('secondary'),
    DetailArea: createWrapper('detail-area'),
    StyledActionMenu: ({ actions = [], onMoreMenuOpen }) => (
      <div data-testid="action-menu">
        <button type="button" onClick={() => onMoreMenuOpen(true)}>
          open-more
        </button>
        {actions.map((action, index) => (
          <button
            key={`${action.title}-${index}`}
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.title}
          </button>
        ))}
      </div>
    ),
  };
});

function createCall(overrides = {}) {
  return {
    direction: 'Outbound',
    from: {
      name: 'Agent',
      phoneNumber: '+16505550100',
    },
    to: {
      name: 'Customer',
      phoneNumber: '+16505550101',
    },
    fromMatches: [],
    toMatches: [{
      id: 'contact-1',
      name: 'Customer One',
    }, {
      id: 'contact-2',
      name: 'Customer Two',
    }],
    webphoneSession: null,
    telephonySessionId: 'telephony-1',
    telephonyStatus: 'callConnected',
    startTime: 1000,
    offset: 0,
    activityMatches: [],
    telephonySession: {
      status: 'Answered',
      otherParties: [{
        status: {
          code: 'Answered',
        },
      }],
    },
    ...overrides,
  };
}

function createProps(overrides = {}) {
  return {
    call: createCall(),
    currentLocale: 'en-US',
    areaCode: '650',
    countryCode: 'US',
    webphoneHangup: jest.fn(),
    webphoneResume: jest.fn(),
    webphoneReject: jest.fn(),
    webphoneSwitchCall: jest.fn(),
    webphoneHold: jest.fn(),
    webphoneAnswer: jest.fn(),
    webphoneToVoicemail: jest.fn(),
    webphoneIgnore: jest.fn(),
    ringoutHangup: jest.fn(),
    ringoutTransfer: jest.fn(),
    ringoutReject: jest.fn(),
    onMergeCall: jest.fn(),
    onClick: jest.fn(),
    clickSwitchTrack: jest.fn(),
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    getAvatarUrl: undefined,
    updateSessionMatchedContact: jest.fn(),
    onLogCall: jest.fn(async () => {}),
    onViewContact: jest.fn(),
    ...overrides,
  };
}

describe('ActiveCallItem component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('handles inbound webphone ringing actions', () => {
    const props = createProps({
      call: createCall({
        direction: 'Inbound',
        fromMatches: [{ id: 'lead-1', name: 'Inbound Lead' }],
        toMatches: [],
        webphoneSession: {
          id: 'webphone-1',
          direction: 'Inbound',
          callStatus: sessionStatus.connecting,
        },
        telephonySessionId: 'telephony-inbound',
        telephonyStatus: 'Ringing',
      }),
      showIgnoreBtn: true,
      showHoldAnswerBtn: true,
    });
    render(<ActiveCallItem {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'toVoicemail' }));
    expect(props.webphoneToVoicemail).toHaveBeenCalledWith(
      'webphone-1',
      'telephony-inbound',
    );
    jest.advanceTimersByTime(3000);
    expect(props.webphoneReject).toHaveBeenCalledWith(
      'webphone-1',
      'telephony-inbound',
    );

    fireEvent.click(screen.getByRole('button', { name: 'ignore' }));
    fireEvent.click(screen.getByRole('button', { name: 'holdAndAnswer' }));
    expect(props.webphoneIgnore).toHaveBeenCalledWith('telephony-inbound');
    expect(props.webphoneAnswer).toHaveBeenCalledWith(
      'webphone-1',
      'telephony-inbound',
      true,
    );
  });

  it('handles connected webphone actions, logging, and contact viewing', async () => {
    const props = createProps({
      call: createCall({
        webphoneSession: {
          id: 'webphone-2',
          direction: 'Outbound',
          callStatus: sessionStatus.connected,
          contactMatch: { id: 'contact-2' },
        },
        activityMatches: [{ id: 'activity-1' }],
      }),
      getAvatarUrl: jest.fn(async (contact) => `avatar-${contact.id}.png`),
      showMergeCall: true,
      disableMerge: false,
      showLogButton: true,
      logButtonTitle: 'Log this call',
    });
    render(<ActiveCallItem {...props} />);

    await waitFor(() => {
      expect(props.updateSessionMatchedContact).toHaveBeenCalledWith({
        webphoneSessionId: 'webphone-2',
        contact: { id: 'contact-2', name: 'Customer Two' },
        telephonySessionId: 'telephony-1',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'hold' }));
    fireEvent.click(screen.getByRole('button', { name: 'mergeToConference' }));
    fireEvent.click(screen.getByRole('button', { name: 'hangup' }));
    fireEvent.click(screen.getByRole('button', { name: 'editLog' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'View log details' }).disabled).toBe(false);
    });
    fireEvent.click(screen.getByRole('button', { name: 'View log details' }));
    fireEvent.click(screen.getByRole('button', { name: 'View contact details' }));
    fireEvent.click(screen.getByRole('button', { name: 'select-contact-1' }));

    expect(props.webphoneHold).toHaveBeenCalledWith('webphone-2', 'telephony-1');
    expect(props.onMergeCall).toHaveBeenCalledWith('webphone-2', 'telephony-1');
    expect(props.webphoneHangup).toHaveBeenCalledWith('webphone-2', 'telephony-1');
    await waitFor(() => {
      expect(props.onLogCall).toHaveBeenCalledWith(expect.objectContaining({
        contact: { id: 'contact-2', name: 'Customer Two' },
        triggerType: 'editLog',
      }));
    });
    expect(props.onLogCall).toHaveBeenCalledWith(expect.objectContaining({
      triggerType: 'viewLog',
    }));
    expect(props.onViewContact).toHaveBeenCalledWith(expect.objectContaining({
      activityMatches: [{ id: 'activity-1' }],
      contactMatches: props.call.toMatches,
      phoneNumber: '+16505550101',
    }));
    await waitFor(() => {
      expect(props.getAvatarUrl).toHaveBeenCalledWith({
        id: 'contact-1',
        name: 'Customer One',
      });
    });
  });

  it('renders connected webphone calls with default optional handlers', () => {
    const props = createProps({
      call: createCall({
        webphoneSession: {
          id: 'default-webphone',
          direction: 'Outbound',
          callStatus: sessionStatus.connected,
        },
      }),
    });
    [
      'clickSwitchTrack',
      'onClick',
      'onLogCall',
      'onMergeCall',
      'onViewContact',
      'updateSessionMatchedContact',
      'webphoneIgnore',
    ].forEach((key) => {
      delete props[key];
    });

    render(<ActiveCallItem {...props} />);

    expect(screen.getByText('callConnected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'hold' }));
    fireEvent.click(screen.getByRole('button', { name: 'hangup' }));
    fireEvent.click(screen.getByRole('button', { name: 'View contact details' }));

    expect(props.webphoneHold).toHaveBeenCalledWith('default-webphone', 'telephony-1');
    expect(props.webphoneHangup).toHaveBeenCalledWith('default-webphone', 'telephony-1');
  });

  it('handles active call control actions and the switch confirmation dialog', () => {
    const props = createProps({
      call: createCall({
        telephonySession: {
          status: 'Answered',
          otherParties: [{
            status: {
              code: 'Answered',
            },
          }],
        },
      }),
      showRingoutCallControl: true,
      showSwitchCall: true,
      showTransferCall: true,
      showHoldOnOtherDevice: true,
    });
    render(<ActiveCallItem {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'hold' }));
    fireEvent.click(screen.getByRole('button', { name: 'transfer' }));
    fireEvent.click(screen.getByRole('button', { name: 'switchCall' }));
    expect(screen.getByTestId('switch-image')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'comfirmOKButton' }));
    fireEvent.click(screen.getByRole('button', { name: 'hangup' }));

    expect(props.webphoneHold).toHaveBeenCalledWith('', 'telephony-1');
    expect(props.ringoutTransfer).toHaveBeenCalledWith('telephony-1');
    expect(props.clickSwitchTrack).toHaveBeenCalled();
    expect(props.webphoneSwitchCall).toHaveBeenCalledWith(props.call);
    expect(props.ringoutHangup).toHaveBeenCalledWith('telephony-1');
  });

  it('uses external switch handling and conference avatars when provided', () => {
    const onSwitchCall = jest.fn();
    const props = createProps({
      call: createCall({
        fromMatches: [],
        toMatches: [],
      }),
      isOnConferenceCall: true,
      conferenceCallParties: [{
        avatarUrl: 'conference-avatar.png',
      }, {
        avatarUrl: 'second-avatar.png',
      }],
      onSwitchCall,
      showSwitchCall: true,
    });
    render(<ActiveCallItem {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'switchCall' }));
    expect(onSwitchCall).toHaveBeenCalledWith(props.call);
    expect(screen.queryByTestId('switch-image')).toBeNull();
  });

  it('handles held webphone calls and voicemail-drop display branches', () => {
    const heldProps = createProps({
      call: createCall({
        webphoneSession: {
          id: 'held-webphone',
          direction: 'Outbound',
          callStatus: sessionStatus.connected,
        },
        toMatches: [{ id: 'contact-1', name: 'Customer One' }],
      }),
      getAvatarUrl: undefined,
      isOnHold: jest.fn(() => true),
      showMultipleMatch: true,
    });
    render(<ActiveCallItem {...heldProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'unhold' }));
    fireEvent.click(screen.getByRole('button', { name: 'hangup' }));
    fireEvent.click(screen.getByRole('button', { name: 'select-contact-1' }));
    expect(heldProps.webphoneResume).toHaveBeenCalledWith('held-webphone', 'telephony-1');
    expect(heldProps.webphoneHangup).toHaveBeenCalledWith('held-webphone', 'telephony-1');
    expect(heldProps.updateSessionMatchedContact).not.toHaveBeenCalledWith(
      expect.objectContaining({
        contact: { id: 'contact-1', name: 'Customer One' },
      }),
    );

    const voicemailProps = createProps({
      call: createCall({
        webphoneSession: {
          id: 'voicemail-drop',
          direction: 'Outbound',
          callStatus: sessionStatus.connected,
          voicemailDropStatus: voicemailDropStatus.sending,
        },
      }),
      showMergeCall: true,
      showHold: true,
    });
    render(<ActiveCallItem {...voicemailProps} />);
    expect(screen.getByText('Dropping message')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'hold' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'mergeToConference' })).toBeNull();
  });

  it('handles incoming and held active-call-control branches', () => {
    const incomingProps = createProps({
      call: createCall({
        direction: 'Inbound',
        fromMatches: [],
        toMatches: [],
        telephonyStatus: 'Ringing',
        telephonySession: {
          status: 'Proceeding',
          otherParties: [{
            status: {
              code: 'Proceeding',
            },
          }],
        },
      }),
      showRingoutCallControl: true,
      showSwitchCall: true,
      showTransferCall: true,
      showHoldOnOtherDevice: true,
    });
    render(<ActiveCallItem {...incomingProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'reject' }));
    expect(incomingProps.ringoutReject).toHaveBeenCalledWith('telephony-1');
    expect(screen.getByRole('button', { name: 'switchCall' }).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'transfer' })).toBeNull();

    const heldOtherDeviceProps = createProps({
      call: createCall({
        fromMatches: [],
        toMatches: [],
        telephonySession: {
          status: 'Hold',
          otherParties: [{
            status: {
              code: 'Answered',
            },
          }],
        },
      }),
      showRingoutCallControl: true,
      showHoldOnOtherDevice: true,
      showTransferCall: false,
    });
    render(<ActiveCallItem {...heldOtherDeviceProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'unhold' }));
    expect(heldOtherDeviceProps.webphoneResume).toHaveBeenCalledWith('', 'telephony-1');
  });
});
