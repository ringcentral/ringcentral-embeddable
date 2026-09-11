import React from 'react';
import { render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';

const mockPanel = jest.fn(({ actions }) => (
  <div data-sign="sharedCallControlPanel">
    {actions.map(({ type }) => type).join(',')}
  </div>
));

jest.mock('@ringcentral-integration/next-core', () => ({
  fromWatchValue: (_owner, selector) => require('rxjs').of(selector()),
  inject: () => () => undefined,
  injectable: () => (target) => target,
  optional: () => () => undefined,
  PortManager: class PortManager {},
  RouterPlugin: class RouterPlugin {},
  takeUntilAppDestroy: (source) => source,
  useConnector: (selector) => selector(),
}));

jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({}));

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppMainContent: ({ children }) => (
    <div data-sign="mainContentPortal">{children}</div>
  ),
}));

jest.mock('@ringcentral-integration/micro-contacts/src/app/services', () => ({
  ContactMatcher: class ContactMatcher {},
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  Call: class Call {},
  CallAction: class CallAction {},
  CALLING_ROUTE_PATH: '/calling',
  CallingSettings: class CallingSettings {},
  PreinsertCall: class PreinsertCall {},
  Webphone: class Webphone {},
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/ConnectingView/Connecting.view',
  () => ({
    ConnectingView: class ConnectingViewBase {
      constructor() {
        this.call = {
          direction: 'Outbound',
          from: { phoneNumber: '+16505550100' },
          sessionId: 'pre_insert_id_1',
          telephonySessionId: 'pre_insert_id_1',
          to: { phoneNumber: '+16505550101' },
        };
        this.connecting = true;
        this.preinsertConnectingWebphoneSessionId = 'webphone-session-1';
      }

      get isConnecting() {
        return this.connecting;
      }

      onInitOnce() {}

      resetPreinsertConnecting() {
        this.connecting = false;
      }

      async setPreinsertConnectingOnServer(value) {
        this.connecting = value;
      }

      async hangUpPreinsertConnecting() {
        this.connecting = false;
      }

      component(props) {
        const Component = this.Connecting;
        return this.isConnecting ? <Component {...props} /> : null;
      }
    },
  }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({ CallViewState: class CallViewState {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring',
  () => ({ CallControlView: class CallControlView {} }),
);

jest.mock('../../next/app/services/WebphoneV2', () => ({
  Webphone: class Webphone {},
}));

jest.mock(
  '../../next/app/views/CallView/CallControlView/VoicemailDropCallControlPanel',
  () => ({ VoicemailDropCallControlPanel: (props) => mockPanel(props) }),
);

import { ConnectingView } from '../../next/app/views/ConnectingView/Connecting.view';

function createConnectingView({ shared = false } = {}) {
  const callControlView = {
    getUIProps: jest.fn(() => ({ expanded: false, flipNumbers: [] })),
    useCallActions: jest.fn(() => [
      { type: 'mute', disabled: true },
      { type: 'keypad', disabled: true },
      { type: 'audio', disabled: true },
      { type: 'add', disabled: true },
      { type: 'hold', disabled: true },
      { type: 'transfer', disabled: true },
      { type: 'record', disabled: true },
      { type: 'aiNotes', disabled: true },
      { type: 'park', disabled: true },
      { type: 'flip', disabled: true },
      { type: 'hangUp', disabled: false },
    ]),
  };
  const portManager = {
    shared,
    onClient: jest.fn(),
    onServer: jest.fn(),
  };
  const webphone = {
    end$: new Subject(),
    onCallStart: jest.fn(),
  };
  const callAction = {};
  const callViewState = {};
  const router = {};
  const view = new ConnectingView(
    callControlView,
    {},
    callAction,
    callViewState,
    {},
    {},
    portManager,
    router,
    {},
    webphone,
  );
  return {
    callAction,
    callControlView,
    callViewState,
    portManager,
    router,
    view,
    webphone,
  };
}

describe('ConnectingView', () => {
  beforeEach(() => {
    mockPanel.mockClear();
  });

  test('uses the shared next call-control panel while connecting', () => {
    const { callControlView, view } = createConnectingView();
    const Component = view.component.bind(view);

    render(<Component />);

    expect(screen.getByTestId('sharedCallControlPanel')).toHaveTextContent(
      'park,flip,hangUp',
    );
    expect(screen.getByTestId('preinsertConnectingOverlay')).toHaveClass(
      'absolute',
      'inset-0',
      'z-drawer',
      'flex',
      'flex-col',
      'bg-neutral-base',
    );
    expect(screen.getByTestId('mainContentPortal')).toBeInTheDocument();
    expect(callControlView.useCallActions).toHaveBeenCalledWith({
      call: expect.objectContaining({
        telephonySessionId: 'pre_insert_id_1',
      }),
      actionsDisabled: true,
    });
  });

  test('shows a new connecting call when the previous view is post-call', () => {
    const { callViewState, view } = createConnectingView();
    callViewState.view = 'postCall';
    const Component = view.component.bind(view);

    render(<Component />);

    expect(screen.getByTestId('sharedCallControlPanel')).toBeInTheDocument();
    expect(view.isConnecting).toBe(true);
  });

  test('clears connecting when the matching active call is ready in the worker', () => {
    const { callAction, callViewState, portManager, router, view } =
      createConnectingView({ shared: true });
    callAction.displayCallTelephonyIdChange$ = {};
    callAction.activeCallInfo = {
      call: {
        webphoneSession: { id: 'webphone-session-1' },
      },
      meta: { open: true },
    };
    callViewState.view = 'activeCall';
    router.currentPath = '/calling';
    view.onInitOnce();

    expect(portManager.onServer).toHaveBeenCalledTimes(1);
    portManager.onServer.mock.calls[0][0]();

    expect(view.isConnecting).toBe(false);
  });

  test.each(['hangUp', 'back'])(
    'owns the preinsert %s action',
    async (actionType) => {
      const { view } = createConnectingView();
      const Component = view.component.bind(view);
      render(<Component />);

      await mockPanel.mock.calls[0][0].onAction(actionType);

      expect(view.isConnecting).toBe(false);
    },
  );

  test('closes the connecting panel when its webphone session ends', async () => {
    const { view, webphone } = createConnectingView();
    const Component = view.component.bind(view);
    view.onInitOnce();
    const { rerender } = render(<Component />);

    webphone.end$.next({ id: 'another-session' });
    rerender(<Component />);
    expect(screen.getByTestId('sharedCallControlPanel')).toBeInTheDocument();

    webphone.end$.next({ id: 'webphone-session-1' });
    await Promise.resolve();
    rerender(<Component />);
    expect(screen.queryByTestId('sharedCallControlPanel')).toBeNull();
  });

  test('clears connecting when its webphone session connects', async () => {
    const { view, webphone } = createConnectingView();
    view.onInitOnce();
    const onCallStart = webphone.onCallStart.mock.calls[0][0];

    onCallStart({ id: 'another-session' });
    await Promise.resolve();
    expect(view.isConnecting).toBe(true);

    onCallStart({ id: 'webphone-session-1' });
    await Promise.resolve();
    expect(view.isConnecting).toBe(false);
  });

  test('listens for webphone teardown in the active client when shared', async () => {
    const { portManager, view, webphone } = createConnectingView({
      shared: true,
    });
    view.onInitOnce();

    expect(portManager.onClient).toHaveBeenCalledTimes(1);
    portManager.onClient.mock.calls[0][0]();
    expect(webphone.onCallStart).toHaveBeenCalledTimes(1);
    webphone.end$.next({ id: 'webphone-session-1' });
    await Promise.resolve();

    expect(view.isConnecting).toBe(false);
  });
});
