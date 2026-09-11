import React from 'react';
import { render, screen } from '@testing-library/react';

import { CallView } from '../src/app/views/CallView/Call.view';
import { EMBEDDABLE_CALL_ACTION_OPTIONS } from '../src/app/views/CallView/Call.view.options';

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

jest.mock('../src/app/views/CallView/ParkView', () => ({
  ParkView: class ParkView {},
}));

jest.mock('../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

function createCallView(
  currentView,
  { callLogFormView, sideWidgetView, smartNotes, smartNotesView } = {},
) {
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
  dependencies[2] = { setActive: jest.fn() };
  dependencies[12] = postCallView;
  dependencies[23] = callLogFormView;
  dependencies[24] = undefined;
  dependencies[25] = sideWidgetView;
  const callView = new CallView(...dependencies);
  if (smartNotes) {
    Object.defineProperty(callView, '_smartNotes', { value: smartNotes });
  }
  if (smartNotesView) {
    Object.defineProperty(callView, '_smartNotesView', {
      value: smartNotesView,
    });
  }
  return {
    callAction,
    callView,
    callViewState: dependencies[4],
    postCallView,
    syncTabView: dependencies[2],
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

  test('leaves the calling route without opening Call Details', () => {
    const sideWidgetView = {
      enabled: true,
      createContent: jest.fn(),
      updateContent: jest.fn(),
      openContent: jest.fn(),
      closeContent: jest.fn(),
    };
    const { callAction, callView } = createCallView('postCall', {
      sideWidgetView,
    });

    callView.handlePostCallViewChange('postCall');

    expect(callAction.leaveCallingRouteForSideWidget).toHaveBeenCalledTimes(1);
    expect(sideWidgetView.createContent).not.toHaveBeenCalled();
    expect(sideWidgetView.updateContent).not.toHaveBeenCalled();
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();

    callView.handlePostCallViewChange('hidden');
    expect(callAction.leaveCallingRouteForSideWidget).toHaveBeenCalledTimes(1);
  });

  test('embeds call-history Smart Notes without outer tabs', () => {
    const callLogFormView = {
      component: ({ variant }) => (
        <div data-sign="directCallLog" data-variant={variant} />
      ),
    };
    const smartNotesView = {
      component: ({ embedded, mode }) => (
        <div
          data-sign="embeddedSmartNotes"
          data-embedded={String(embedded)}
          data-mode={mode}
        />
      ),
    };
    const { callView } = createCallView('hidden', {
      callLogFormView,
      smartNotesView,
    });
    const CallDetailForm = callView.CallDetailForm;

    render(
      <CallDetailForm
        variant="history"
        info={{ hasSmartNote: true, telephonySessionId: 'telephony-session' }}
      />,
    );

    expect(screen.getByTestId('history-call-details-content')).toHaveClass(
      'flex',
      'flex-col',
    );
    expect(screen.getByTestId('history-call-details-content')).not.toHaveClass(
      'overflow-y-auto',
    );
    expect(screen.getByTestId('history-call-log-form')).toHaveClass(
      'flex-none',
    );
    expect(screen.getByTestId('directCallLog')).toHaveAttribute(
      'data-variant',
      'history',
    );
    expect(screen.getByTestId('embeddedSmartNotes')).toHaveAttribute(
      'data-embedded',
      'true',
    );
    expect(screen.getByTestId('embeddedSmartNotes')).toHaveAttribute(
      'data-mode',
      'post-call',
    );
    expect(screen.queryByTestId('callDetailForm-postCall')).toBeNull();
  });

  test('preserves the independent post-call Smart Notes form', () => {
    const { callView } = createCallView('postCall');
    const CallDetailForm = callView.CallDetailForm;

    render(
      <CallDetailForm
        variant="postCall"
        info={{ hasSmartNote: true, telephonySessionId: 'telephony-session' }}
      />,
    );

    expect(screen.getByTestId('callDetailForm-postCall')).toBeInTheDocument();
    expect(screen.queryByTestId('embeddedSmartNotes')).toBeNull();
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
