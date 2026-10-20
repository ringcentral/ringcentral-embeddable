// Opening a RingCX history row first puts the History tab in the path, so Back
// returns to that tab. Behind a routed side widget page the router is on that
// page instead, and replacing it would close the page the agent docked.

jest.mock('@ringcentral-integration/next-core', () =>
  jest.requireActual('../mocks/nextCoreMock'),
);
jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({
  ConnectivityManager: class ConnectivityManager {},
  RateLimiter: class RateLimiter {},
}));
jest.mock('@ringcentral-integration/micro-contacts/src/app/services', () => ({
  ContactMatcher: class ContactMatcher {},
}));
jest.mock('@ringcentral-integration/micro-setting/src/app/services', () => ({
  IntegrationConfig: class IntegrationConfig {},
}));
jest.mock(
  '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/components',
  () => ({ LogInfo: () => null }),
);
jest.mock('../../src/ringcx/services/CxCallHistory', () => ({
  CxCallHistory: class CxCallHistory {},
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({
  CxAuth: class CxAuth {},
}));
jest.mock('../../src/ringcx/services/CxCall', () => ({
  CxCall: class CxCall {},
}));
jest.mock('../../src/app/services/CallLogger', () => ({
  HostCallLogger: class HostCallLogger {},
}));
jest.mock('../../src/app/services/ContactMatcher', () => ({
  refreshContactMatch: jest.fn(),
}));
jest.mock('../../src/app/services/MatchedContactSelection', () => ({
  MatchedContactSelection: class MatchedContactSelection {},
}));
jest.mock('../../src/app/services/ThirdParty', () => ({
  ThirdParty: class ThirdParty {},
}));
jest.mock('../../src/app/views/CallHistoryView/CallHistoryLogAction', () => ({
  createCallHistoryLogActions: jest.fn(),
  hasLoggedCallActivity: jest.fn(),
}));
jest.mock('../../src/ringcx/components/CallHistoryList', () => ({
  CallHistoryList: () => null,
}));
jest.mock('../../src/ringcx/hooks/useCxCallContactRenderInfo', () => ({
  useCxCallContactRenderInfo: jest.fn(),
}));
jest.mock('../../src/ringcx/services/CxCallHistory/can-dial-history-call', () => ({
  canDialHistoryCall: jest.fn(),
}));

import { CxCallHistoryView } from '../../src/ringcx/views/CxCallHistoryView/CxCallHistoryView.view';

function openRowFrom(currentPath) {
  const router = {
    currentPath,
    push: jest.fn(),
    replace: jest.fn(),
  };
  const view = Object.create(CxCallHistoryView.prototype);
  view._router = router;
  view.goToCallDetail('history-1');
  return router;
}

describe('CxCallHistoryView history detail opening', () => {
  test('pins the History tab before opening a row from the agent home', () => {
    const router = openRowFrom('/agent/home');

    expect(router.replace).toHaveBeenCalledWith('/agent/home/history');
    expect(router.push).toHaveBeenCalledWith('/agent/history/history-1');
  });

  test('does not pin again when the History tab is already in the path', () => {
    const router = openRowFrom('/agent/home/history');

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/agent/history/history-1');
  });

  test('keeps a docked page when the home is parked behind it', () => {
    const router = openRowFrom('/history/call-1');

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/agent/history/history-1');
  });

  test('opens the next row over a history detail without leaving it first', () => {
    const router = openRowFrom('/agent/history/history-0');

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/agent/history/history-1');
  });
});
