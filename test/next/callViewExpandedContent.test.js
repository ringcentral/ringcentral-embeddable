import React from 'react';
import { render, screen } from '@testing-library/react';

import { CallView } from '../../next/app/views/CallView/Call.view';
import { EMBEDDABLE_CALL_ACTION_OPTIONS } from '../../next/app/views/CallView/Call.view.options';

jest.mock('@ringcentral-integration/next-core', () => ({
  autobind: (_target, _key, descriptor) => descriptor,
  computed: (_target, _key, descriptor) => descriptor,
  fromWatchValue: jest.fn(() => ({
    pipe: () => ({ subscribe: () => ({ unsubscribe() {} }) }),
  })),
  injectable: () => (target) => target,
  optional: () => () => undefined,
  PortManager: class PortManager {},
  Root: class Root {},
  RouterPlugin: class RouterPlugin {},
  takeUntilAppDestroy: (source) => source,
  useConnector: (selector) => selector(),
}));

jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({
  RateLimiter: class RateLimiter {},
  RingCentralExtensions: class RingCentralExtensions {},
}));

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppFooterNav: () => null,
  AppMainContent: ({ children }) => children ?? null,
  ToastPositionAdjustor: ({ children }) => children ?? null,
}));

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  SyncTabView: class SyncTabView {},
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  ActiveCallControl: class ActiveCallControl {},
  CallAction: class CallAction {},
  CallMonitor: class CallMonitor {},
  PreinsertCall: class PreinsertCall {},
  Webphone: class Webphone {},
  isRingingCall: () => false,
  sessionStatus: { finished: 'finished' },
  useActiveCallInfoWithPreinsert: () => undefined,
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView',
  () => ({
    CallView: class CallView {
      CallDetailForm({ variant }) {
        return <div data-sign={`callDetailForm-${variant}`} />;
      }

      CallLogArea() {
        return <div data-sign="baseCallLogArea" />;
      }
    },
  }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({ CallViewState: class CallViewState {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ActiveCallsViewSpring',
  () => ({ ActiveCallsView: class ActiveCallsView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/AddCallViewSpring',
  () => ({ AddCallView: class AddCallView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring',
  () => ({ CallControlView: class CallControlView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ForwardViewSpring',
  () => ({ ForwardView: class ForwardView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/IncomingCallViewSpring',
  () => ({ IncomingCallView: class IncomingCallView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/KeypadViewSpring',
  () => ({ KeypadView: class KeypadView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/PostCallViewSpring',
  () => ({ PostCallView: class PostCallView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ReplyWithMessageViewSpring',
  () => ({ ReplyWithMessageView: class ReplyWithMessageView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/TransferViewSpring',
  () => ({ TransferView: class TransferView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallLogFormView',
  () => ({ CallLogFormView: class CallLogFormView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/QuickCallActionView',
  () => ({ QuickCallActionView: class QuickCallActionView {} }),
);

jest.mock('../../next/app/views/CallView/ParkView', () => ({
  ParkView: class ParkView {},
}));

jest.mock('../../next/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

function createCallView(currentView, { sideWidgetView } = {}) {
  const callAction = {
    fromPostCall: false,
    leaveCallingRouteForSideWidget: jest.fn(async () => {}),
  };
  const postCallView = {
    component: ({ variant }) =>
      variant === 'header' ? (
        <div data-sign="postCallHeader">
          <button type="button" data-sign="backButton">
            Back
          </button>
        </div>
      ) : (
        <div data-sign="postCallInfo" />
      ),
    goBack: jest.fn(async () => {
      callAction.fromPostCall = true;
    }),
  };
  const dependencies = Array.from({ length: 26 }, () => ({}));
  dependencies[0] = callAction;
  dependencies[4] = {
    view: currentView,
    postCallCallLog: {
      sessionId: 'call-session',
      telephonySessionId: 'telephony-session',
    },
  };
  dependencies[12] = postCallView;
  dependencies[23] = undefined;
  dependencies[24] = undefined;
  dependencies[25] = sideWidgetView;
  return {
    callAction,
    callView: new CallView(...dependencies),
    callViewState: dependencies[4],
    postCallView,
  };
}

describe('CallView expanded content ownership', () => {
  test('does not mount the base call-log panel during an active call', () => {
    const { callView } = createCallView('activeCall');
    const CallLogArea = callView.CallLogArea;

    render(<CallLogArea />);

    expect(screen.queryByTestId('baseCallLogArea')).toBeNull();
  });

  test('preserves the base call-log panel for the post-call page', () => {
    const { callView } = createCallView('postCall');
    const CallLogArea = callView.CallLogArea;

    render(<CallLogArea />);

    expect(screen.getByTestId('baseCallLogArea')).toBeInTheDocument();
  });

  test('keeps built-in call-log expansion disabled', () => {
    expect(EMBEDDABLE_CALL_ACTION_OPTIONS).toEqual({
      expandedAbility: false,
    });
  });

  test('hosts post-call details in the side widget when it is enabled', async () => {
    const handle = { id: 'call-details-handle' };
    const sideWidgetView = {
      enabled: true,
      createContent: jest.fn(() => handle),
      updateContent: jest.fn((contentHandle, options) => {
        contentHandle.options = options;
      }),
      openContent: jest.fn(),
      closeContent: jest.fn(),
    };
    const { callAction, callView, postCallView } = createCallView('postCall', {
      sideWidgetView,
    });
    const contentOptions = sideWidgetView.createContent.mock.calls[0][0];

    callView.syncPostCallSideWidget('postCall');

    expect(contentOptions).toEqual(
      expect.objectContaining({ id: 'call-details', name: 'Call details' }),
    );
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle, {
      activate: true,
    });
    expect(callAction.leaveCallingRouteForSideWidget).toHaveBeenCalledTimes(1);

    const Content = contentOptions.view;
    render(<Content showCloseButton={false} />);
    expect(screen.getByTestId('postCallInfo')).toBeInTheDocument();
    expect(screen.getByTestId('callDetailForm-postCall')).toBeInTheDocument();
    expect(screen.getByTestId('postCallHeader').parentElement).toHaveClass(
      '[&_[data-sign=backButton]]:hidden',
    );

    contentOptions.onClose();
    await Promise.resolve();
    expect(postCallView.goBack).toHaveBeenCalledTimes(1);
    expect(callAction.fromPostCall).toBe(false);

    callView.syncPostCallSideWidget('hidden');
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(handle);
  });

  test('keeps started Smart Notes selected after a call ends', () => {
    const handle = { id: 'call-details-handle' };
    const sideWidgetView = {
      enabled: true,
      createContent: jest.fn(() => handle),
      updateContent: jest.fn((contentHandle, options) => {
        contentHandle.options = options;
      }),
      openContent: jest.fn(),
      closeContent: jest.fn(),
    };
    const { callView } = createCallView('postCall', { sideWidgetView });
    Object.defineProperty(callView, '_smartNotes', {
      value: { session: { id: 'smart-notes-session' } },
    });

    callView.syncPostCallSideWidget('postCall');

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle, {
      activate: false,
    });
  });

  test('does not duplicate post-call details in the main column', () => {
    const handle = { id: 'call-details-handle' };
    const sideWidgetView = {
      enabled: true,
      createContent: jest.fn(() => handle),
      updateContent: jest.fn((contentHandle, options) => {
        contentHandle.options = options;
      }),
      openContent: jest.fn(),
      closeContent: jest.fn(),
    };
    const { callView } = createCallView('postCall', { sideWidgetView });
    const CallLogArea = callView.CallLogArea;

    render(<CallLogArea />);

    expect(screen.queryByTestId('baseCallLogArea')).toBeNull();
  });
});
