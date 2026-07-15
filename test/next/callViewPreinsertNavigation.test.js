import { CallView } from '../../next/app/views/CallView/Call.view';

jest.mock('@ringcentral-integration/next-core', () => {
  const { Subject } = require('rxjs');
  const fromWatchValueRecords = [];
  return {
    __fromWatchValueRecords: fromWatchValueRecords,
    autobind: (_target, _key, descriptor) => descriptor,
    computed: (_target, _key, descriptor) => descriptor,
    fromWatchValue: jest.fn((_module, selector) => {
      const subject = new Subject();
      fromWatchValueRecords.push({ subject, selector });
      return subject;
    }),
    injectable: () => (target) => target,
    optional: () => () => undefined,
    PortManager: class PortManager {},
    Root: class Root {},
    RouterPlugin: class RouterPlugin {},
    takeUntilAppDestroy: (source) => source,
    useConnector: (selector) => selector(),
  };
});

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
        return null;
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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createCallView({
  view = 'hidden',
  currentPath = '/dialer',
  allCalls = [],
  displayCallAllInfo = null,
} = {}) {
  const nextCore = require('@ringcentral-integration/next-core');
  nextCore.__fromWatchValueRecords.length = 0;

  const dependencies = Array.from({ length: 25 }, () => ({}));
  const callAction = {
    displayCallAllInfo,
    preInsertCallInfoList: [],
    leaveCallingRoute: jest.fn(async () => {}),
  };
  const callMonitor = { allCalls };
  const callViewState = {
    view,
    _setView: jest.fn(function setView(value) {
      this.view = value;
    }),
  };
  const preInsertCall = {
    isBringInPartyPreinsertStatus: jest.fn(() => false),
  };
  const router = {
    currentPath,
    push: jest.fn(async function push(path) {
      this.currentPath = path;
    }),
  };
  dependencies[0] = callAction;
  dependencies[1] = callMonitor;
  dependencies[4] = callViewState;
  dependencies[16] = preInsertCall;
  dependencies[17] = {}; // portManager, not shared -> binds immediately
  dependencies[22] = router;

  const callView = new CallView(...dependencies);
  const [record] = nextCore.__fromWatchValueRecords;

  return {
    callView,
    callAction,
    callMonitor,
    callViewState,
    preInsertCall,
    router,
    preinsertId$: record.subject,
    selector: record.selector,
  };
}

describe('CallView preinsert navigation', () => {
  test('navigates to the call control page when the outbound SIP session appears', async () => {
    const { callViewState, router, preinsertId$ } = createCallView();

    preinsertId$.next(null);
    preinsertId$.next('pre_insert_id_sip-1');
    await flush();

    expect(callViewState._setView).toHaveBeenCalledWith('activeCall');
    expect(router.push).toHaveBeenCalledWith('/calling');
  });

  test('does not navigate twice for the same connecting call', async () => {
    const { router, preinsertId$ } = createCallView();

    preinsertId$.next(null);
    preinsertId$.next('pre_insert_id_sip-1');
    preinsertId$.next('pre_insert_id_sip-1');
    await flush();

    expect(router.push).toHaveBeenCalledTimes(1);
  });

  test('does not push the router again when already on the calling page', async () => {
    const { callViewState, router, preinsertId$ } = createCallView({
      view: 'activeCall',
      currentPath: '/calling',
    });

    preinsertId$.next(null);
    preinsertId$.next('pre_insert_id_sip-1');
    await flush();

    expect(callViewState._setView).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  test('leaves the calling page when the call fails before the server session arrives', async () => {
    const { callAction, callViewState, router, preinsertId$ } =
      createCallView();

    preinsertId$.next(null);
    preinsertId$.next('pre_insert_id_sip-1');
    await flush();
    preinsertId$.next(null);
    await flush();

    expect(callViewState._setView).toHaveBeenLastCalledWith('hidden');
    expect(callAction.leaveCallingRoute).toHaveBeenCalled();
  });

  test('keeps the calling page when the server-backed call took over', async () => {
    const { callAction, callViewState, preinsertId$ } = createCallView();

    preinsertId$.next(null);
    preinsertId$.next('pre_insert_id_sip-1');
    await flush();
    callAction.displayCallAllInfo = { call: {}, meta: { open: true } };
    preinsertId$.next(null);
    await flush();

    expect(callViewState._setView).not.toHaveBeenCalledWith('hidden');
    expect(callAction.leaveCallingRoute).not.toHaveBeenCalled();
  });

  test('keeps the post call page when the call ends during connecting', async () => {
    const { callAction, callViewState, preinsertId$ } = createCallView();

    preinsertId$.next(null);
    preinsertId$.next('pre_insert_id_sip-1');
    await flush();
    callViewState.view = 'postCall';
    preinsertId$.next(null);
    await flush();

    expect(callViewState._setView).not.toHaveBeenCalledWith('hidden');
    expect(callAction.leaveCallingRoute).not.toHaveBeenCalled();
  });

  test('watches only open outbound preinsert calls', () => {
    const { callAction, preInsertCall, selector } = createCallView();

    callAction.preInsertCallInfoList = [
      {
        call: {
          direction: 'Inbound',
          sessionId: 'pre_insert_id_in',
          telephonySessionId: 'pre_insert_id_in',
        },
        meta: { open: true },
      },
      {
        call: {
          direction: 'Outbound',
          sessionId: 'pre_insert_id_closed',
          telephonySessionId: 'pre_insert_id_closed',
        },
        meta: { open: false },
      },
      {
        call: {
          direction: 'Outbound',
          sessionId: 'pre_insert_id_out',
          telephonySessionId: 'pre_insert_id_out',
        },
        meta: { open: true },
      },
    ];

    expect(selector()).toBe('pre_insert_id_out');

    preInsertCall.isBringInPartyPreinsertStatus.mockReturnValue(true);
    expect(selector()).toBe(null);
  });
});
