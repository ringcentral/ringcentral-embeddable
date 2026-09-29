import { CallControlView } from '../src/app/views/CallView/CallControlView/CallControl.view';

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
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/AudioCardViewSpring',
  () => ({ AudioCardView: class AudioCardView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring',
  () => ({
    CallControlView: class CallControlViewBase {
      ignoredReadinessModules = [];

      _ignoreModuleReadiness(dep) {
        this.ignoredReadinessModules.push(dep);
      }

      useCallActions() {
        return [{ type: 'hangUp' }];
      }

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

jest.mock('../src/app/services/VoicemailDrop', () => ({
  VoicemailDrop: class VoicemailDrop {},
}));

jest.mock('../src/app/views/VoicemailDropView', () => ({
  VoicemailDropView: class VoicemailDropView {},
}));

jest.mock('../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

jest.mock('../src/app/views/SmartNotesView', () => ({
  SmartNotesView: class SmartNotesView {},
}));

jest.mock(
  '../src/app/views/CallView/CallControlView/VoicemailDropCallControlPanel',
  () => ({ VoicemailDropCallControlPanel: () => null }),
);

function createCallControlView() {
  const callAction = {
    updateCallMetaInfo: jest.fn(async () => {}),
    leaveCallingRoute: jest.fn(async () => {}),
  };
  const activeCallControl = {
    getActiveSession: jest.fn(() => ({ isOnHold: false })),
  };
  const forwardingNumber = { flipNumbers: [] };
  const webphone = {
    sessions: [],
    hangup: jest.fn(async () => {}),
  };
  const smartNotes = {
    startOrResumeNotes: jest.fn(async () => ({ id: 'telephony-session' })),
  };
  const smartNotesView = {
    open: jest.fn(async () => {}),
  };
  const view = new CallControlView(
    callAction,
    { isWebphoneMode: true },
    activeCallControl,
    forwardingNumber,
    {}, // appFeatures
    {}, // root
    {}, // syncTabView
    {}, // audioCardView
    { hasVoicemailDropPermission: false },
    webphone,
    {}, // voicemailDropView
    smartNotes,
    smartNotesView,
  );

  return { view, callAction, webphone, smartNotes, smartNotesView };
}

describe('CallControlView actions', () => {
  beforeEach(() => {
    mockBaseOnAction.mockClear();
  });

  test('does not wait for smart notes to be ready', () => {
    const { view, smartNotes, smartNotesView } = createCallControlView();

    expect(view.ignoredReadinessModules).toEqual([smartNotes, smartNotesView]);
  });

  test('keeps flip in the action list when no forwarding number is available', () => {
    const { view } = createCallControlView();

    const actions = view.useCallActions({
      call: { telephonySessionId: 'real-session-1' },
      actionsDisabled: false,
    });

    expect(actions).toContainEqual({ type: 'flip', disabled: true });
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
