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
  CallAction: class CallActionBase {},
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

const {
  voicemailDropStatus,
} = require('../../src/app/services/WebphoneV2/voicemailDropStatus');
const { CallAction } = require('../../src/app/services/CallAction/CallAction');

/**
 * `hasHiddenCalls` drives the "back to call" announcement banner
 * (`Call.view.showQuickCallAction`). A call playing a pre-recorded voicemail
 * needs no attention and would otherwise sit in the banner, in the way of
 * placing the next call.
 */
function createCallAction(allCallInfoList) {
  const action = Object.create(CallAction.prototype);
  Object.defineProperty(action, 'allCallInfoList', {
    get: () => allCallInfoList,
  });
  Object.defineProperty(action, 'existRingingOpenCallMetaInfo', {
    get: () => undefined,
  });
  Object.defineProperty(action, 'announcementInfo', { get: () => undefined });
  return action;
}

const normalCall = (id = 'call-1') => ({ call: { id }, meta: {} });
const droppingCall = (id = 'call-drop', status = voicemailDropStatus.sending) => ({
  call: { id, webphoneSession: { voicemailDropStatus: status } },
  meta: {},
});

it('announces an ordinary hidden call', () => {
  expect(createCallAction([normalCall()]).hasHiddenCalls).toBe(true);
});

it('does not announce a call that is dropping voicemail', () => {
  expect(createCallAction([droppingCall()]).hasHiddenCalls).toBe(false);
});

it.each([
  ['waitingForGreetingEnd', voicemailDropStatus.waitingForGreetingEnd],
  ['sending', voicemailDropStatus.sending],
  ['finished', voicemailDropStatus.finished],
])('ignores a drop in state %s', (_label, status) => {
  expect(
    createCallAction([droppingCall('call-drop', status)]).hasHiddenCalls,
  ).toBe(false);
});

it('still announces when a real call is hidden alongside a drop', () => {
  expect(
    createCallAction([droppingCall(), normalCall()]).hasHiddenCalls,
  ).toBe(true);
});

it('does not announce when there are no calls', () => {
  expect(createCallAction([]).hasHiddenCalls).toBe(false);
});
