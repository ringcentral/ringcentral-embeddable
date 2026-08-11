import { CallAction } from '../../next/app/services/CallAction/CallAction';

const mockBaseLeaveCallingRoute = jest.fn(async () => {});

jest.mock('@ringcentral-integration/next-core', () => ({
  injectable: () => (target) => target,
  optional: () => () => undefined,
  PortManager: class PortManager {},
  Root: class Root {},
  RouterPlugin: class RouterPlugin {},
}));

jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({
  ConnectivityMonitor: class ConnectivityMonitor {},
}));

jest.mock('@ringcentral-integration/micro-core/src/app/services', () => ({
  Toast: class Toast {},
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  ActiveCallControl: class ActiveCallControl {},
  CallMonitor: class CallMonitor {},
  PreinsertCall: class PreinsertCall {},
  Webphone: class Webphone {},
  CallAction: class CallActionBase {
    leaveCallingRoute(...args) {
      return mockBaseLeaveCallingRoute.apply(this, args);
    }
  },
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/services/CallAction/ConferenceCallAction',
  () => ({ ConferenceCallAction: class ConferenceCallAction {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/services/CallAction/SwitchCallConfirm',
  () => ({ SwitchCallConfirm: class SwitchCallConfirm {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({ CallViewState: class CallViewState {} }),
);

function createCallAction(fullScreenCallActionOpened) {
  const callAction = new CallAction(...Array.from({ length: 13 }, () => ({})));
  Object.defineProperty(callAction, 'fullScreenCallActionOpened', {
    get: () => fullScreenCallActionOpened,
  });
  return callAction;
}

describe('CallAction leaveCallingRoute guard', () => {
  beforeEach(() => {
    mockBaseLeaveCallingRoute.mockClear();
  });

  test('ignores stale leave requests while the call screen should stay open', async () => {
    const callAction = createCallAction(true);

    await callAction.leaveCallingRoute();

    expect(mockBaseLeaveCallingRoute).not.toHaveBeenCalled();
  });

  test('leaves the calling page when the call screen is really closed', async () => {
    const callAction = createCallAction(false);

    await callAction.leaveCallingRoute();

    expect(mockBaseLeaveCallingRoute).toHaveBeenCalledTimes(1);
  });

  test('restores the main route while post-call content stays in the side widget', async () => {
    const callAction = createCallAction(true);

    await callAction.leaveCallingRouteForSideWidget();

    expect(mockBaseLeaveCallingRoute).toHaveBeenCalledTimes(1);
  });
});
