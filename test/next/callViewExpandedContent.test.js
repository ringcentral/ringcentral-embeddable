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

function createCallView(currentView) {
  const dependencies = Array.from({ length: 25 }, () => ({}));
  dependencies[4] = { view: currentView };
  return {
    callView: new CallView(...dependencies),
    callViewState: dependencies[4],
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
});
