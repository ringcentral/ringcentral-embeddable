/** @jest-environment jsdom */
import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';
import { recordStatus } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';

import ActiveCallList from '../../src/components/ActiveCallList';
import ActiveCallPad from '../../src/components/CallCtrlPanel/ActiveCallPad';
import CallCtrlPanel from '../../src/components/CallCtrlPanel';
import { VoicemailDropSettingsPanel } from '../../src/components/VoicemailDropSettingsPanel';

jest.mock('@ringcentral-integration/widgets/components/ActiveCallList/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ActiveCallList/styles.scss', () => ({
  list: 'list',
  listTitle: 'listTitle',
}));

jest.mock('@ringcentral-integration/widgets/components/ActiveCallPad/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ActiveCallPad/utils', () => ({
  pickElements: jest.fn((actions, buttons) => (
    buttons.filter((button) => actions.includes(button.id) || actions.includes(button.dataSign))
  )),
}));

jest.mock('@ringcentral-integration/widgets/components/SpinnerOverlay', () => ({
  SpinnerOverlay: () => <span data-sign="spinner" data-testid="spinner">spinner</span>,
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
    CallAdd: createIcon('CallAdd'),
    CallMore: createIcon('CallMore'),
    Delete: createIcon('Delete'),
    Edit: createIcon('Edit'),
    FlipSp: createIcon('FlipSp'),
    Hold: createIcon('Hold'),
    Keypad: createIcon('Keypad'),
    Merge: createIcon('Merge'),
    Mic: createIcon('Mic'),
    MicOff: createIcon('MicOff'),
    ParkCall: createIcon('ParkCall'),
    PlayCircle: createIcon('PlayCircle'),
    Record: createIcon('Record'),
    StopRecord: createIcon('StopRecord'),
    TransferCall: createIcon('TransferCall'),
    ViewBorder: createIcon('ViewBorder'),
    Voicemail: createIcon('Voicemail'),
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
        'confirmButtonColor',
        'fullWidth',
        'max',
        'min',
        'primaryTypographyProps',
        'severity',
        'step',
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
      'data-sign': props['data-sign'] || testId,
      'data-testid': props['data-testid'] || props['data-sign'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, {
        ...cleanProps(props),
        ref,
        'data-sign': props['data-sign'] || `styled-${Component}`,
        'data-testid': props['data-testid'] || props['data-sign'] || `styled-${Component}`,
      }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div', 'styled-div');
  return {
    RcAlert: createComponent('div', 'alert'),
    RcButton: ({
      children,
      disabled,
      onClick,
    }) => (
      <button disabled={disabled} type="button" onClick={onClick}>
        {children}
      </button>
    ),
    RcFormLabel: ({ children }) => <label>{children}</label>,
    RcIcon: ({ symbol }) => <span>{symbol?.displayName || 'icon'}</span>,
    RcIconButton: ({
      disabled,
      onClick,
      symbol,
    }) => (
      <button disabled={disabled} type="button" onClick={onClick}>
        {symbol?.displayName || 'icon-button'}
      </button>
    ),
    RcList: createComponent('div', 'list'),
    RcListItem: createComponent('div', 'list-item'),
    RcListItemIcon: createComponent('span', 'list-item-icon'),
    RcListItemSecondaryAction: createComponent('span', 'list-item-secondary-action'),
    RcListItemText: ({ primary }) => <span>{primary}</span>,
    RcMenu: ({
      children,
      onClose,
      open,
    }) => (open ? (
      <section data-sign="active-call-pad-menu">
        <button type="button" onClick={onClose}>close-active-pad-menu</button>
        {children}
      </section>
    ) : null),
    RcMenuItem: ({
      children,
      disabled,
      onClick,
      ...props
    }) => (
      <button
        data-sign={props['data-sign']}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
    ),
    RcSlider: ({
      onChange,
      value,
    }) => (
      <button
        data-sign="silence-slider"
        type="button"
        onClick={() => onChange(null, value + 1)}
      >
        {`slider:${value}`}
      </button>
    ),
    RcTooltip: ({ children }) => <>{children}</>,
    RcTypography: ({ children }) => <span>{children}</span>,
    palette2: jest.fn(() => '#000'),
    styled,
  };
}

jest.mock('@ringcentral/juno', () => mockCreateJunoMock());

jest.mock('../../src/components/BackHeaderView', () => ({
  BackHeaderView: ({
    children,
    onBack,
    title,
  }) => (
    <section>
      <button data-sign="back" type="button" onClick={onBack}>
        {`back:${title}`}
      </button>
      {children}
    </section>
  ),
}));

jest.mock('../../src/components/CallCtrlButton', () => {
  const React = require('react');
  return React.forwardRef(({
    active,
    buttonRef,
    dataSign,
    disabled,
    onClick,
    title,
  }, ref) => (
    <button
      data-active={active ? 'true' : 'false'}
      data-sign={dataSign}
      disabled={disabled}
      ref={buttonRef || ref}
      type="button"
      onClick={onClick}
    >
      {title}
    </button>
  ));
});

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
        <button type="button" onClick={onConfirm}>confirm</button>
        <button type="button" onClick={onClose}>cancel</button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/VoicemailDropSettingsPanel/VoicemailDropMessage', () => ({
  VoicemailDropMessage: ({
    message,
    onSave,
  }) => (
    <section data-sign="voicemail-message-editor">
      <span>{`editor:${message.id || 'new'}`}</span>
      <button
        type="button"
        onClick={() => onSave({ ...message, label: 'Saved message' })}
      >
        save-message
      </button>
    </section>
  ),
}));

jest.mock('../../src/components/CallCtrlPanel/ActiveCallPanel', () => (
  function MockActiveCallPanel({
    addDisabled,
    callQueueName,
    children,
    controlBusy,
    fallBackName,
    hasConferenceCall,
    isOnTransfer,
    isOnWaitingTransfer,
    mergeDisabled,
    onAdd,
    onBackButtonClick,
    onCompleteTransfer,
    onFlip,
    onHangup,
    onHideKeyPad,
    onHold,
    onKeyPadChange,
    onMerge,
    onMute,
    onPark,
    onRecord,
    onSelectMatcherName,
    onShowKeyPad,
    onStopRecord,
    onTransfer,
    onUnhold,
    onUnmute,
    onVoicemailDrop,
    sessionId,
    showKeyPad,
  }) {
    return (
      <section data-sign="active-call-panel">
        <span>{`panel:${sessionId}:${String(showKeyPad)}:${fallBackName}:${String(addDisabled)}:${String(mergeDisabled)}:${String(controlBusy)}:${String(hasConferenceCall)}:${String(isOnTransfer)}:${String(isOnWaitingTransfer)}:${callQueueName || 'none'}`}</span>
        <button type="button" onClick={onBackButtonClick}>back-active</button>
        <button type="button" onClick={onShowKeyPad}>show-keypad</button>
        <button type="button" onClick={onHideKeyPad}>hide-keypad</button>
        <button type="button" onClick={() => onKeyPadChange('8')}>dtmf</button>
        <button type="button" onClick={onMute}>mute</button>
        <button type="button" onClick={onUnmute}>unmute</button>
        <button type="button" onClick={onHold}>hold</button>
        <button type="button" onClick={onUnhold}>unhold</button>
        <button type="button" onClick={onRecord}>record</button>
        <button type="button" onClick={onStopRecord}>stop-record</button>
        <button type="button" onClick={onPark}>park</button>
        <button type="button" onClick={onAdd}>add</button>
        <button type="button" onClick={onMerge}>merge</button>
        <button type="button" onClick={onCompleteTransfer}>complete-transfer</button>
        <button type="button" onClick={onFlip}>flip</button>
        <button type="button" onClick={onTransfer}>transfer</button>
        <button type="button" onClick={onVoicemailDrop}>voicemail-drop</button>
        <button type="button" onClick={() => onSelectMatcherName({ id: 'contact-1' })}>select-match</button>
        <button type="button" onClick={onHangup}>hangup</button>
        {children}
      </section>
    );
  }
));

jest.mock('../../src/components/CallCtrlPanel/ConfirmMergeModal', () => (
  function MockConfirmMergeModal({
    onCancel,
    onMerge,
    show,
  }) {
    return show ? (
      <section data-sign="confirm-merge">
        <button type="button" onClick={onMerge}>confirm-merge</button>
        <button type="button" onClick={onCancel}>cancel-merge</button>
      </section>
    ) : null;
  }
));

jest.mock('../../src/components/ActiveCallItem', () => ({
  ActiveCallItem: ({
    call,
    hasActionMenu,
    isOnConferenceCall,
    onClick,
    showMultipleMatch,
    warmTransferRole,
    webphoneAnswer,
    webphoneHangup,
  }) => (
    <section data-sign={`active-call-${call.id}`}>
      <button type="button" onClick={onClick}>
        {`item:${call.id}:${warmTransferRole || 'none'}:${String(isOnConferenceCall)}:${String(hasActionMenu)}:${String(showMultipleMatch)}`}
      </button>
      <button type="button" onClick={() => webphoneAnswer?.(call)}>answer:{call.id}</button>
      <button type="button" onClick={() => webphoneHangup?.(call)}>hangup:{call.id}</button>
    </section>
  ),
}));

function createCallCtrlProps(overrides = {}) {
  return {
    actions: [{ id: 'custom' }],
    addDisabled: false,
    afterConfirmMerge: jest.fn(),
    afterHideMergeConfirm: jest.fn(),
    afterOnMerge: jest.fn(),
    areaCode: '650',
    backButtonLabel: 'Calls',
    callQueueName: 'Support',
    conferenceCallEquipped: true,
    conferenceCallParties: [{ id: 'party-1' }],
    controlBusy: false,
    countryCode: 'US',
    currentLocale: 'en-US',
    fallBackName: 'Ada Caller',
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    getAvatarUrl: jest.fn(),
    gotoParticipantsCtrl: jest.fn(),
    hasConferenceCall: true,
    isOnTransfer: true,
    isOnWaitingTransfer: false,
    layout: callCtrlLayouts.normalCtrl,
    mergeDisabled: false,
    nameMatches: [{ id: 'contact-1' }],
    onAdd: jest.fn(),
    onBackButtonClick: jest.fn(),
    onBeforeMerge: jest.fn(() => true),
    onCompleteTransfer: jest.fn(),
    onFlip: jest.fn(),
    onHangup: jest.fn(),
    onHold: jest.fn(),
    onKeyPadChange: jest.fn(),
    onMerge: jest.fn(),
    onMute: jest.fn(),
    onPark: jest.fn(),
    onRecord: jest.fn(),
    onSelectMatcherName: jest.fn(),
    onStopRecord: jest.fn(),
    onTransfer: jest.fn(),
    onUnhold: jest.fn(),
    onUnmute: jest.fn(),
    onVoicemailDrop: jest.fn(),
    phoneNumber: '+16505550100',
    selectedMatcherIndex: 0,
    sessionId: 'session-1',
    showBackButton: true,
    showPark: true,
    showSpinner: true,
    showVoicemailDrop: true,
    ...overrides,
  };
}

describe('call control flow components', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('runs call control panel keypad, merge confirmation, and call actions', () => {
    const props = createCallCtrlProps();
    const { rerender } = render(
      <CallCtrlPanel {...props}>
        <span>child-control</span>
      </CallCtrlPanel>,
    );

    fireEvent.click(screen.getByText('show-keypad'));
    expect(screen.getByText(/panel:session-1:true/)).toBeTruthy();
    fireEvent.click(screen.getByText('hide-keypad'));
    expect(screen.getByText(/panel:session-1:false/)).toBeTruthy();

    [
      'back-active',
      'dtmf',
      'mute',
      'unmute',
      'hold',
      'unhold',
      'record',
      'stop-record',
      'park',
      'add',
      'complete-transfer',
      'flip',
      'transfer',
      'voicemail-drop',
      'select-match',
      'hangup',
    ].forEach((label) => {
      fireEvent.click(screen.getByText(label));
    });

    expect(props.onBackButtonClick).toHaveBeenCalled();
    expect(props.onKeyPadChange).toHaveBeenCalledWith('8');
    expect(props.onMute).toHaveBeenCalled();
    expect(props.onUnmute).toHaveBeenCalled();
    expect(props.onHold).toHaveBeenCalled();
    expect(props.onUnhold).toHaveBeenCalled();
    expect(props.onRecord).toHaveBeenCalled();
    expect(props.onStopRecord).toHaveBeenCalled();
    expect(props.onPark).toHaveBeenCalled();
    expect(props.onAdd).toHaveBeenCalled();
    expect(props.onCompleteTransfer).toHaveBeenCalled();
    expect(props.onFlip).toHaveBeenCalledWith('session-1');
    expect(props.onTransfer).toHaveBeenCalledWith('session-1');
    expect(props.onVoicemailDrop).toHaveBeenCalledWith('session-1');
    expect(props.onSelectMatcherName).toHaveBeenCalledWith({ id: 'contact-1' });
    expect(props.onHangup).toHaveBeenCalled();

    fireEvent.click(screen.getByText('merge'));
    expect(props.onBeforeMerge).toHaveBeenCalled();
    expect(props.afterOnMerge).toHaveBeenCalled();
    fireEvent.click(screen.getByText('confirm-merge'));
    expect(props.onMerge).toHaveBeenCalled();
    expect(props.afterConfirmMerge).toHaveBeenCalled();

    fireEvent.click(screen.getByText('merge'));
    fireEvent.click(screen.getByText('cancel-merge'));
    expect(props.afterHideMergeConfirm).toHaveBeenCalled();

    const directMergeProps = createCallCtrlProps({
      hasConferenceCall: false,
      layout: 'transferCtrl',
      onBeforeMerge: jest.fn(() => true),
    });
    rerender(<CallCtrlPanel {...directMergeProps} />);
    fireEvent.click(screen.getByText('merge'));
    expect(directMergeProps.onMerge).toHaveBeenCalled();

    const blockedMergeProps = createCallCtrlProps({
      onBeforeMerge: jest.fn(() => false),
      sessionId: 'session-2',
    });
    rerender(<CallCtrlPanel {...blockedMergeProps} />);
    fireEvent.click(screen.getByText('merge'));
    expect(blockedMergeProps.onMerge).not.toHaveBeenCalled();
    expect(blockedMergeProps.afterOnMerge).toHaveBeenCalled();
  });

  it('renders call control panel with default optional props', () => {
    const props = createCallCtrlProps();
    [
      'actions',
      'addDisabled',
      'avatarUrl',
      'backButtonLabel',
      'brand',
      'callStatus',
      'callQueueName',
      'conferenceCallEquipped',
      'conferenceCallParties',
      'controlBusy',
      'direction',
      'disableFlip',
      'getAvatarUrl',
      'gotoParticipantsCtrl',
      'hasConferenceCall',
      'isOnHold',
      'isOnMute',
      'isOnTransfer',
      'isOnWaitingTransfer',
      'lastCallInfo',
      'mergeDisabled',
      'onAdd',
      'onBackButtonClick',
      'onBeforeMerge',
      'onCompleteTransfer',
      'onFlip',
      'onKeyPadChange',
      'onMerge',
      'onPark',
      'onRecord',
      'onSelectMatcherName',
      'onStopRecord',
      'onVoicemailDrop',
      'phoneNumber',
      'phoneSourceNameRenderer',
      'phoneTypeRenderer',
      'recordStatus',
      'sessionId',
      'showBackButton',
      'showContactDisplayPlaceholder',
      'showPark',
      'showSpinner',
      'showVoicemailDrop',
      'sourceIcons',
      'startTime',
      'voicemailDropStatus',
    ].forEach((key) => {
      delete props[key];
    });

    render(<CallCtrlPanel {...props} />);

    expect(screen.getByText(/panel:undefined:false:Ada Caller:false:false:false:false:false:false:none/))
      .toBeTruthy();
    [
      'show-keypad',
      'hide-keypad',
      'dtmf',
      'record',
      'stop-record',
      'park',
      'complete-transfer',
      'flip',
      'voicemail-drop',
      'select-match',
      'merge',
    ].forEach((label) => {
      fireEvent.click(screen.getByText(label));
    });
    expect(screen.queryByText('confirm-merge')).toBeNull();
  });

  it('renders active call pad primary, more-menu, transfer and voicemail states', () => {
    const getButton = (sign) => document.querySelector(`[data-sign="${sign}"]`);
    const props = {
      addDisabled: false,
      actions: [],
      conferenceCallEquipped: true,
      controlBusy: false,
      currentLocale: 'en-US',
      disableFlip: false,
      hasConferenceCall: false,
      isOnHold: false,
      isOnMute: false,
      isOnTransfer: false,
      isOnWaitingTransfer: false,
      layout: callCtrlLayouts.normalCtrl,
      mergeDisabled: false,
      onAdd: jest.fn(),
      onCompleteTransfer: jest.fn(),
      onFlip: jest.fn(),
      onHold: jest.fn(),
      onMerge: jest.fn(),
      onMute: jest.fn(),
      onPark: jest.fn(),
      onRecord: jest.fn(),
      onShowKeyPad: jest.fn(),
      onStopRecord: jest.fn(),
      onTransfer: jest.fn(),
      onUnhold: jest.fn(),
      onUnmute: jest.fn(),
      onVoicemailDrop: jest.fn(),
      recordStatus: '',
      showPark: true,
      showVoicemailDrop: true,
      voicemailDropStatus: '',
    };
    const { rerender } = render(<ActiveCallPad {...props} />);

    fireEvent.click(getButton('unmute'));
    fireEvent.click(getButton('keypad'));
    fireEvent.click(getButton('hold'));
    fireEvent.click(getButton('voicemailDrop'));
    fireEvent.click(getButton('record'));
    expect(props.onMute).toHaveBeenCalled();
    expect(props.onShowKeyPad).toHaveBeenCalled();
    expect(props.onHold).toHaveBeenCalled();
    expect(props.onVoicemailDrop).toHaveBeenCalled();
    expect(props.onRecord).toHaveBeenCalled();

    fireEvent.click(getButton('callActions'));
    fireEvent.click(getButton('add'));
    expect(props.onAdd).toHaveBeenCalled();
    fireEvent.click(getButton('callActions'));
    fireEvent.click(screen.getByText('close-active-pad-menu'));

    rerender(
      <ActiveCallPad
        {...props}
        hasConferenceCall
        recordStatus={recordStatus.recording}
      />,
    );
    fireEvent.click(getButton('callActions'));
    fireEvent.click(getButton('merge'));
    expect(props.onMerge).toHaveBeenCalled();
    if (!getButton('stopRecord')) {
      fireEvent.click(getButton('callActions'));
    }
    fireEvent.click(getButton('stopRecord'));
    expect(props.onStopRecord).toHaveBeenCalled();

    rerender(
      <ActiveCallPad
        {...props}
        isOnMute
        isOnWaitingTransfer
        layout={callCtrlLayouts.mergeCtrl}
        recordStatus={recordStatus.pending}
      />,
    );
    fireEvent.click(getButton('mute'));
    fireEvent.click(getButton('completeTransfer'));
    expect(props.onUnmute).toHaveBeenCalled();
    expect(props.onCompleteTransfer).toHaveBeenCalled();

    rerender(
      <ActiveCallPad
        {...props}
        actions={['unmute']}
        controlBusy
        voicemailDropStatus="sending"
      />,
    );
    expect(getButton('unmute').disabled).toBe(true);
    expect(getButton('keypad')).toBeNull();
  });

  it('maps active calls with conference and warm-transfer metadata', () => {
    const originalCall = {
      id: 'original',
      telephonySessionId: 'related-session',
    };
    const transferCall = {
      id: 'transfer',
      telephonySessionId: 'transfer-session',
      warmTransferInfo: {
        isOriginal: false,
        relatedTelephonySessionId: 'related-session',
      },
    };
    const warmOriginalCall = {
      id: 'warm-original',
      telephonySessionId: 'warm-original-session',
      warmTransferInfo: {
        isOriginal: true,
      },
    };
    const sessionConferenceCall = {
      id: 'session-conference',
      telephonySessionId: 'session-conference',
      webphoneSession: {
        id: 'conference-session',
      },
    };
    const otherDeviceConferenceCall = {
      id: 'other-conference',
      telephonySessionId: 'other-conference',
      to: {
        phoneNumber: [],
      },
      toName: 'Conference',
    };
    const props = {
      allCalls: [originalCall, transferCall],
      areaCode: '650',
      calls: [
        originalCall,
        transferCall,
        warmOriginalCall,
        sessionConferenceCall,
        otherDeviceConferenceCall,
      ],
      brand: 'RingCentral',
      className: 'custom',
      countryCode: 'US',
      currentLocale: 'en-US',
      formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
      isSessionAConferenceCall: jest.fn((id) => id === 'conference-session'),
      onCallItemClick: jest.fn(),
      showMergeCall: true,
      showMultipleMatch: true,
      title: 'Active calls',
      useV2: true,
      webphoneAnswer: jest.fn(),
      webphoneHangup: jest.fn(),
    };
    const { rerender } = render(<ActiveCallList {...props} />);

    expect(screen.getByText('Active calls')).toBeTruthy();
    expect(screen.getByText('item:transfer: (transferCall):undefined:true:true')).toBeTruthy();
    expect(screen.getByText('item:warm-original: (callerCall):undefined:true:true')).toBeTruthy();
    expect(screen.getByText('item:session-conference:none:true:false:true')).toBeTruthy();
    expect(screen.getByText('item:other-conference:none:true:false:true')).toBeTruthy();

    fireEvent.click(screen.getByText('item:transfer: (transferCall):undefined:true:true'));
    expect(props.onCallItemClick).toHaveBeenCalledWith(originalCall);
    fireEvent.click(screen.getByText('answer:original'));
    fireEvent.click(screen.getByText('hangup:original'));
    expect(props.webphoneAnswer).toHaveBeenCalledWith(originalCall);
    expect(props.webphoneHangup).toHaveBeenCalledWith(originalCall);

    rerender(<ActiveCallList {...props} calls={[]} />);
    expect(screen.queryByText('Active calls')).toBeNull();
  });

  it('runs voicemail drop settings edit, add, delete, external view, and timeout flows', async () => {
    const props = {
      currentLocale: 'en-US',
      externalVoicemailDropMessages: [{
        id: 'external-1',
        label: 'External message',
      }],
      noBeepSilenceDuration: 4,
      onBackButtonClick: jest.fn(),
      onDelete: jest.fn(),
      onLoadExternalVoicemailDropMessages: jest.fn(),
      onNoBeepSilenceDurationChange: jest.fn(),
      onSave: jest.fn(),
      voicemailMessages: [{
        id: 'message-1',
        label: 'Intro message',
      }],
    };
    render(<VoicemailDropSettingsPanel {...props} />);

    await waitFor(() => {
      expect(props.onLoadExternalVoicemailDropMessages).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText('slider:4'));
    expect(props.onNoBeepSilenceDurationChange).toHaveBeenCalledWith(5);

    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('editor:message-1')).toBeTruthy();
    fireEvent.click(screen.getByText('save-message'));
    expect(props.onSave).toHaveBeenCalledWith({
      id: 'message-1',
      label: 'Saved message',
    });

    fireEvent.click(screen.getByText('Add a pre-recorded message'));
    expect(screen.getByText('editor:new')).toBeTruthy();
    fireEvent.click(screen.getByText('back:Voicemail drop settings'));
    fireEvent.click(screen.getByText('back:Voicemail drop settings'));
    expect(props.onBackButtonClick).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('confirm'));
    expect(props.onDelete).toHaveBeenCalledWith({
      id: 'message-1',
      label: 'Intro message',
    });

    fireEvent.click(screen.getByText('ViewBorder'));
    expect(screen.getByText('editor:external-1')).toBeTruthy();
  });
});
