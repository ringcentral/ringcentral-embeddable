import { CallControlView } from '../../next/app/views/CallView/CallControlView/CallControl.view';

const mockBaseOnAction = jest.fn(async () => {});

jest.mock('@ringcentral-integration/next-core', () => ({
  delegate: () => (_target, _key, descriptor) => descriptor,
  inject: () => () => {},
  injectable: () => (target) => target,
  optional: () => () => undefined,
  Root: class Root {},
  useConnector: (selector) => selector(),
}));

jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({
  AppFeatures: class AppFeatures {},
}));

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  SyncTabView: class SyncTabView {},
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  ActiveCallControl: class ActiveCallControl {},
  CallAction: class CallAction {},
  CallingSettings: class CallingSettings {},
  ForwardingNumber: class ForwardingNumber {},
  Webphone: class Webphone {},
  isPreinsertCallByTelephoneSessionId: (id) =>
    id?.startsWith('pre_insert_id'),
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/AudioCardViewSpring',
  () => ({ AudioCardView: class AudioCardView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring',
  () => ({
    CallControlView: class CallControlViewBase {
      getUIFunctions() {
        return { onAction: mockBaseOnAction };
      }
    },
  }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({ CallViewState: class CallViewState {} }),
);

jest.mock('../../next/app/services/VoicemailDrop', () => ({
  VoicemailDrop: class VoicemailDrop {},
}));

jest.mock('../../next/app/views/VoicemailDropView', () => ({
  VoicemailDropView: class VoicemailDropView {},
}));

jest.mock('../../next/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

jest.mock('../../next/app/views/SmartNotesView', () => ({
  SmartNotesView: class SmartNotesView {},
}));

jest.mock(
  '../../next/app/views/CallView/CallControlView/VoicemailDropCallControlPanel',
  () => ({ VoicemailDropCallControlPanel: () => null }),
);

function createCallControlView() {
  const callAction = {
    updateCallMetaInfo: jest.fn(async () => {}),
    leaveCallingRoute: jest.fn(async () => {}),
  };
  const webphone = {
    sessions: [],
    hangup: jest.fn(async () => {}),
  };
  const callViewState = {
    view: 'activeCall',
    _setView: jest.fn(function setView(value) {
      this.view = value;
    }),
  };
  const smartNotes = {
    startOrResumeNotes: jest.fn(async () => ({ id: 'telephony-session' })),
  };
  const smartNotesView = {
    open: jest.fn(async () => {}),
  };
  const view = new CallControlView(
    callAction,
    {}, // callingSettings
    {}, // activeCallControl
    {}, // forwardingNumber
    {}, // appFeatures
    {}, // root
    {}, // syncTabView
    {}, // audioCardView
    {}, // voicemailDrop
    webphone,
    {}, // voicemailDropView
    callViewState,
    smartNotes,
    smartNotesView,
  );

  return { view, callAction, webphone, callViewState, smartNotes, smartNotesView };
}

describe('CallControlView preinsert call actions', () => {
  beforeEach(() => {
    mockBaseOnAction.mockClear();
  });

  test('hangs up a connecting preinsert call through the webphone session', async () => {
    const { view, webphone } = createCallControlView();
    const { onAction } = view.getUIFunctions({
      call: {
        telephonySessionId: 'pre_insert_id_sip-1',
        webphoneSession: { id: 'wp-1' },
      },
    });

    await onAction('hangUp');

    expect(webphone.hangup).toHaveBeenCalledWith('wp-1');
    expect(mockBaseOnAction).not.toHaveBeenCalled();
  });

  test('closes the calling page on back for a connecting preinsert call', async () => {
    const { view, callAction, callViewState } = createCallControlView();
    const { onAction } = view.getUIFunctions({
      call: {
        telephonySessionId: 'pre_insert_id_sip-1',
        webphoneSession: { id: 'wp-1' },
      },
    });

    await onAction('back');

    expect(callViewState._setView).toHaveBeenCalledWith('hidden');
    expect(callAction.leaveCallingRoute).toHaveBeenCalled();
    expect(mockBaseOnAction).not.toHaveBeenCalled();
  });

  test('keeps the base handling for calls with a real telephony session', async () => {
    const { view, webphone } = createCallControlView();
    const { onAction } = view.getUIFunctions({
      call: {
        telephonySessionId: 'real-session-1',
        webphoneSession: { id: 'wp-1' },
      },
    });

    await onAction('hangUp');

    expect(webphone.hangup).not.toHaveBeenCalled();
    expect(mockBaseOnAction).toHaveBeenCalledWith('hangUp');
  });

  test('keeps the park navigation for real calls', async () => {
    const { view, callAction } = createCallControlView();
    const { onAction } = view.getUIFunctions({
      call: { telephonySessionId: 'real-session-1' },
    });

    await onAction('park');

    expect(callAction.updateCallMetaInfo).toHaveBeenCalledWith(
      'real-session-1',
      { currentPath: 'park' },
    );
  });

  test('starts the ai notes and presents the ai assistant on the notes action', async () => {
    const { view, smartNotes, smartNotesView } = createCallControlView();
    const { onAction } = view.getUIFunctions({
      call: { telephonySessionId: 'real-session-1' },
    });

    await onAction('aiNotes');

    expect(smartNotes.startOrResumeNotes).toHaveBeenCalledWith(
      'real-session-1',
    );
    expect(smartNotesView.open).toHaveBeenCalledWith({
      id: 'telephony-session',
    });
    expect(mockBaseOnAction).not.toHaveBeenCalled();
  });

  test('does not present the ai assistant when the notes cannot start', async () => {
    const { view, smartNotes, smartNotesView } = createCallControlView();
    smartNotes.startOrResumeNotes.mockResolvedValueOnce(null);
    const { onAction } = view.getUIFunctions({
      call: { telephonySessionId: 'real-session-1' },
    });

    await onAction('stopNotes');

    expect(smartNotes.startOrResumeNotes).toHaveBeenCalledWith(
      'real-session-1',
    );
    expect(smartNotesView.open).not.toHaveBeenCalled();
    expect(mockBaseOnAction).not.toHaveBeenCalled();
  });
});
