/** @jest-environment jsdom */
import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import { callCtrlLayouts } from '@ringcentral-integration/widgets/enums/callCtrlLayouts';

import { IncomingCallView } from '../../src/components/IncomingCallView';
import { CallCtrlContainer } from '../../src/containers/CallCtrlPage/CallCtrlContainer';

jest.mock('@ringcentral-integration/commons/utils', () => ({
  sleep: jest.fn(async () => {}),
}));

jest.mock('@ringcentral-integration/widgets/components/IncomingCallView/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/CallCtrlContainer/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral/juno/foundation/hooks', () => ({
  useMountState: jest.fn(() => ({ current: true })),
}));

jest.mock('../../src/components/IncomingCallPanel', () => (
  function MockIncomingCallPanel({
    answer,
    answerAndEnd,
    answerAndHold,
    avatarUrl,
    callQueueName,
    children,
    fallBackName,
    hasOtherActiveCall,
    ignore,
    onBackButtonClick,
    onForward,
    onSelectMatcherName,
    reject,
    replyWithMessage,
    selectedMatcherIndex,
    startReply,
    toVoiceMail,
  }) {
    return (
      <section>
        <span>{`incoming:${fallBackName}:${selectedMatcherIndex}:${avatarUrl || 'no-avatar'}:${String(hasOtherActiveCall)}:${callQueueName || 'no-queue'}`}</span>
        <button type="button" onClick={answer}>answer</button>
        <button type="button" onClick={reject}>reject</button>
        <button type="button" onClick={ignore}>ignore</button>
        <button type="button" onClick={toVoiceMail}>voicemail</button>
        <button type="button" onClick={() => replyWithMessage('Busy')}>reply</button>
        <button type="button" onClick={onBackButtonClick}>minimize</button>
        <button type="button" onClick={answerAndEnd}>answer-end</button>
        <button type="button" onClick={answerAndHold}>answer-hold</button>
        <button type="button" onClick={() => onForward('+16505550123', { id: 'recipient-1' })}>forward</button>
        <button type="button" onClick={startReply}>start-reply</button>
        <button type="button" onClick={() => onSelectMatcherName({ id: 'contact-2' })}>select-incoming</button>
        {children}
      </section>
    );
  }
));

jest.mock('../../src/components/CallCtrlPanel', () => (
  function MockCallCtrlPanel({
    addDisabled,
    avatarUrl,
    backButtonLabel,
    callQueueName,
    children,
    fallBackName,
    gotoParticipantsCtrl,
    layout,
    mergeDisabled,
    onAdd,
    onBeforeMerge,
    onCompleteTransfer,
    onHangup,
    onHold,
    onKeyPadChange,
    onMerge,
    onMute,
    onPark,
    onRecord,
    onSelectMatcherName,
    onStopRecord,
    onUnhold,
    onUnmute,
    selectedMatcherIndex,
    sessionId,
  }) {
    return (
      <section>
        <span>{`callctrl:${sessionId}:${fallBackName}:${backButtonLabel}:${layout}:${String(addDisabled)}:${String(mergeDisabled)}:${selectedMatcherIndex}:${avatarUrl || 'no-avatar'}:${callQueueName || 'no-queue'}`}</span>
        <button type="button" onClick={onMute}>mute</button>
        <button type="button" onClick={onUnmute}>unmute</button>
        <button type="button" onClick={onHold}>hold</button>
        <button type="button" onClick={onUnhold}>unhold</button>
        <button type="button" onClick={onRecord}>record</button>
        <button type="button" onClick={onStopRecord}>stop-record</button>
        <button type="button" onClick={() => onKeyPadChange('5')}>dtmf</button>
        <button type="button" onClick={onHangup}>hangup</button>
        <button type="button" onClick={onAdd}>add</button>
        <button type="button" onClick={onMerge}>merge</button>
        <button type="button" onClick={onBeforeMerge}>before-merge</button>
        <button type="button" onClick={onPark}>park</button>
        <button type="button" onClick={gotoParticipantsCtrl}>participants</button>
        <button type="button" onClick={onCompleteTransfer}>complete-transfer</button>
        <button type="button" onClick={() => onSelectMatcherName({ id: 'contact-2' })}>select-call</button>
        {children}
      </section>
    );
  }
));

function createIncomingProps(overrides = {}) {
  return {
    activeSessionId: 'active-session',
    answer: jest.fn(async () => {}),
    areaCode: '650',
    brand: 'RingCentral',
    container: document.body,
    countryCode: 'US',
    currentLocale: 'en-US',
    forwardingNumbers: [{ phoneNumber: '+16505550999' }],
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    getAvatarUrl: jest.fn(async (contact) => `avatar-${contact.id}`),
    hangup: jest.fn(async () => {}),
    ignore: jest.fn(),
    name: 'Incoming Caller',
    nameMatches: [
      { id: 'contact-1', name: 'Ada' },
      { id: 'contact-2', name: 'Grace' },
    ],
    onForward: jest.fn(),
    onHold: jest.fn(async () => {}),
    phoneNumber: '+16505550100',
    reject: jest.fn(),
    replyWithMessage: jest.fn(),
    searchContact: jest.fn(),
    searchContactList: [],
    session: {
      callQueueName: 'Support',
      direction: callDirections.inbound,
      from: 'anonymous',
      fromUserName: 'Hidden Caller',
      id: 'incoming-session',
      minimized: false,
    },
    showCallQueueName: true,
    showContactDisplayPlaceholder: true,
    startReply: jest.fn(),
    toPhoneNumber: '+16505550101',
    toVoiceMail: jest.fn(),
    toggleMinimized: jest.fn(),
    updateSessionMatchedContact: jest.fn(),
    ...overrides,
  };
}

function createCallCtrlProps(overrides = {}) {
  return {
    afterConfirmMerge: jest.fn(),
    afterHideMergeConfirm: jest.fn(),
    afterOnMerge: jest.fn(),
    areaCode: '650',
    backButtonLabel: null,
    brand: 'RingCentral',
    closeMergingPair: jest.fn(),
    conferenceCallEquipped: true,
    conferenceCallId: 'conference-1',
    conferenceCallParties: [],
    countryCode: 'US',
    currentLocale: 'en-US',
    formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    getAvatarUrl: jest.fn(async (contact) => `avatar-${contact.id}`),
    getDefaultContactMatch: jest.fn(() => ({ id: 'contact-1', name: 'Ada' })),
    getInitialLayout: jest.fn(() => callCtrlLayouts.normalCtrl),
    gotoParticipantsCtrl: jest.fn(),
    hasConferenceCall: false,
    isWebRTC: true,
    lastCallInfo: { status: sessionStatus.proceeding },
    loadConference: jest.fn(),
    nameMatches: [
      { id: 'contact-1', name: 'Ada' },
      { id: 'contact-2', name: 'Grace' },
    ],
    onAdd: jest.fn(),
    onBeforeMerge: jest.fn(),
    onCompleteTransfer: jest.fn(),
    onFlip: jest.fn(),
    onHangup: jest.fn(),
    onHold: jest.fn(),
    onMerge: jest.fn(),
    onMute: jest.fn(),
    onPark: jest.fn(),
    onRecord: jest.fn(),
    onStopRecord: jest.fn(),
    onTransfer: jest.fn(),
    onUnhold: jest.fn(),
    onUnmute: jest.fn(),
    onVoicemailDrop: jest.fn(),
    sendDTMF: jest.fn(),
    session: {
      callQueueName: 'Sales',
      direction: callDirections.inbound,
      from: 'anonymous',
      fromUserName: 'Anonymous',
      id: 'call-session',
      partyData: { id: 'party-1' },
      startTime: 1000,
    },
    setMergeParty: jest.fn(),
    showCallQueueName: true,
    showContactDisplayPlaceholder: true,
    showPark: true,
    updateSessionMatchedContact: jest.fn(),
    ...overrides,
  };
}

describe('incoming and active call container views', () => {
  it('handles incoming call actions, active-call alternatives, forwarding, and matcher selection', async () => {
    const props = createIncomingProps();
    const { rerender } = render(
      <IncomingCallView {...props}>
        <span>child-content</span>
      </IncomingCallView>,
    );

    expect(screen.getByText('child-content')).toBeTruthy();
    expect(screen.getByText('incoming:anonymous:0:no-avatar:true:Support')).toBeTruthy();
    await waitFor(() => {
      expect(props.getAvatarUrl).toHaveBeenCalledWith({ id: 'contact-1', name: 'Ada' });
    });
    fireEvent.click(screen.getByText('answer'));
    fireEvent.click(screen.getByText('reject'));
    fireEvent.click(screen.getByText('ignore'));
    fireEvent.click(screen.getByText('voicemail'));
    fireEvent.click(screen.getByText('reply'));
    fireEvent.click(screen.getByText('minimize'));
    fireEvent.click(screen.getByText('answer-end'));
    fireEvent.click(screen.getByText('answer-hold'));
    fireEvent.click(screen.getByText('forward'));
    fireEvent.click(screen.getByText('start-reply'));
    fireEvent.click(screen.getByText('select-incoming'));

    expect(props.answer).toHaveBeenCalledWith('incoming-session');
    expect(props.reject).toHaveBeenCalledWith('incoming-session');
    expect(props.ignore).toHaveBeenCalledWith('incoming-session');
    expect(props.toVoiceMail).toHaveBeenCalledWith('incoming-session');
    expect(props.replyWithMessage).toHaveBeenCalledWith('incoming-session', 'Busy');
    expect(props.toggleMinimized).toHaveBeenCalledWith('incoming-session');
    await waitFor(() => {
      expect(props.hangup).toHaveBeenCalledWith('active-session');
      expect(props.onHold).toHaveBeenCalledWith('active-session');
    });
    expect(props.onForward).toHaveBeenCalledWith(
      'incoming-session',
      '+16505550123',
      { id: 'recipient-1' },
    );
    expect(props.startReply).toHaveBeenCalledWith('incoming-session');
    expect(props.updateSessionMatchedContact).toHaveBeenCalledWith(
      'incoming-session',
      { id: 'contact-2', name: 'Grace' },
    );

    rerender(
      <IncomingCallView
        {...props}
        session={{ ...props.session, minimized: true }}
      />,
    );
    expect(screen.queryByText(/incoming:/)).toBeNull();
  });

  it('handles active call control actions, avatar selection, and merge state updates', async () => {
    const props = createCallCtrlProps();
    const { rerender, unmount } = render(
      <CallCtrlContainer {...props}>
        <span>call-child</span>
      </CallCtrlContainer>,
    );

    expect(screen.getByText('call-child')).toBeTruthy();
    expect(screen.getByText(/callctrl:call-session:anonymous:activeCalls/)).toBeTruthy();
    await waitFor(() => {
      expect(props.updateSessionMatchedContact).toHaveBeenCalledWith(
        'call-session',
        { id: 'contact-1', name: 'Ada' },
      );
    });
    fireEvent.click(screen.getByText('mute'));
    fireEvent.click(screen.getByText('unmute'));
    fireEvent.click(screen.getByText('hold'));
    fireEvent.click(screen.getByText('unhold'));
    fireEvent.click(screen.getByText('record'));
    fireEvent.click(screen.getByText('stop-record'));
    fireEvent.click(screen.getByText('dtmf'));
    fireEvent.click(screen.getByText('hangup'));
    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('merge'));
    fireEvent.click(screen.getByText('before-merge'));
    fireEvent.click(screen.getByText('park'));
    fireEvent.click(screen.getByText('participants'));
    fireEvent.click(screen.getByText('complete-transfer'));
    fireEvent.click(screen.getByText('select-call'));

    expect(props.onMute).toHaveBeenCalledWith('call-session');
    expect(props.onUnmute).toHaveBeenCalledWith('call-session');
    expect(props.onHold).toHaveBeenCalledWith('call-session');
    expect(props.onUnhold).toHaveBeenCalledWith('call-session');
    expect(props.onRecord).toHaveBeenCalledWith('call-session');
    expect(props.onStopRecord).toHaveBeenCalledWith('call-session');
    expect(props.sendDTMF).toHaveBeenCalledWith('5', 'call-session');
    expect(props.onHangup).toHaveBeenCalledWith('call-session', callCtrlLayouts.normalCtrl);
    expect(props.onAdd).toHaveBeenCalledWith('call-session');
    expect(props.onMerge).toHaveBeenCalledWith('call-session');
    expect(props.onBeforeMerge).toHaveBeenCalledWith('call-session');
    expect(props.onPark).toHaveBeenCalledWith('call-session');
    expect(props.gotoParticipantsCtrl).toHaveBeenCalledWith('call-session');
    expect(props.onCompleteTransfer).toHaveBeenCalledWith('call-session');
    expect(props.updateSessionMatchedContact).toHaveBeenCalledWith(
      'call-session',
      { id: 'contact-2', name: 'Grace' },
    );
    await waitFor(() => {
      expect(screen.getByText(/avatar-contact-2/)).toBeTruthy();
    });

    rerender(
      <CallCtrlContainer
        {...props}
        session={{
          ...props.session,
          contactMatch: { id: 'contact-2', name: 'Grace' },
        }}
      />,
    );
    unmount();

    const mergeProps = createCallCtrlProps({
      getInitialLayout: () => callCtrlLayouts.mergeCtrl,
      hasConferenceCall: true,
      isConferenceCallOverload: true,
      lastCallInfo: { status: sessionStatus.finished },
      session: {
        ...props.session,
        id: 'call-session-2',
        warmTransferSessionId: 'warm-1',
      },
    });
    render(<CallCtrlContainer {...mergeProps} />);
    expect(mergeProps.setMergeParty).toHaveBeenCalledWith({ toSessionId: 'call-session-2' });
    await waitFor(() => {
      expect(mergeProps.closeMergingPair).toHaveBeenCalled();
    });
  });
});
