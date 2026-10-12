// The calls list asks the call log for older calls under the direction its
// filter shows, and only while the list is not searched.

import { watch } from '@ringcentral-integration/next-core';

import { CallsListView } from '../../src/app/views/CallHistoryView/CallsList.view';
import { getOlderCallsScope } from '../../src/app/views/CallHistoryView/getOlderCallsScope';

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring',
  () => ({
    CallsListViewSpring: class CallsListViewSpringBase {
      constructor() {
        this.viewCallsFilter = 'all';
      }

      useCallHistoryItemInfo = () => ({ info: {}, actions: [] });

      useActionsHandler = () => jest.fn();

      onInitOnce() {}

      getUIProps() {
        return { calls: [] };
      }

      getUIFunctions() {
        return { useActionsHandler: this.useActionsHandler };
      }
    },
  }),
);

// jest.config.js maps the micro-* services to one mock module, so they share
// one factory, declared as a function so it is hoisted above the imports.
function mockMicroServices() {
  return {
    AppFeatures: class AppFeatures {},
    Call: class Call {},
    CallHistory: class CallHistory {},
    CallLog: class CallLog {},
    CallLogger: class CallLogger {},
    CallLogTasks: class CallLogTasks {},
    ComposeText: class ComposeText {},
    ConnectivityManager: class ConnectivityManager {},
    ContactMatcher: class ContactMatcher {},
    MessageStore: class MessageStore {},
    RateLimiter: class RateLimiter {},
    Toast: class Toast {},
    track: () => (_target, _key, descriptor) => descriptor,
  };
}

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () =>
  mockMicroServices(),
);

jest.mock('@ringcentral-integration/micro-setting/src/app/services', () => ({
  IntegrationConfig: class IntegrationConfig {},
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({ CallViewState: class CallViewState {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/DialerView',
  () => ({ DialerView: class DialerView {} }),
);

jest.mock('../../src/app/components/MatchedContactsTag', () => ({
  useCallDisplayNameWithMatches: (DisplayName) => DisplayName,
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

jest.mock('../../src/app/views/CallHistoryView/CallsListPage', () => ({
  CallsListPage: () => null,
}));

function createView({ searchInput = '' } = {}) {
  const stub = () => ({});
  const callHistory = { searchInput };
  const callLog = {
    canLoadOlderCalls: true,
    fetchOlderCalls: jest.fn(async () => undefined),
    loadingOlderCalls: false,
    setOlderCallsScope: jest.fn(async () => undefined),
  };
  const view = new CallsListView(
    stub(), // callViewState
    stub(), // connectivityManager
    callHistory,
    stub(), // rateLimiter
    stub(), // call
    stub(), // messageStore
    stub(), // router
    stub(), // appFeatures
    stub(), // toast
    stub(), // integrationConfig
    stub(), // contactMatcher
    stub(), // matchedContactSelection
    stub(), // callLogger
    stub(), // thirdParty
    stub(), // historyActiveCallsView
    callLog,
  );
  return { callHistory, callLog, view };
}

describe('getOlderCallsScope', () => {
  test.each([
    ['all', 'All'],
    [undefined, 'All'],
    ['missed', 'Inbound'],
    ['incoming', 'Inbound'],
    ['outgoing', 'Outbound'],
    ['logged', 'All'],
    ['unlogged', 'All'],
  ])('pages the %s filter under %s', (filter, scope) => {
    expect(getOlderCallsScope(filter)).toBe(scope);
  });
});

describe('CallsListView older calls', () => {
  beforeEach(() => {
    watch.mockClear();
  });

  test('loads older calls under the direction of the current filter', () => {
    const { callLog, view } = createView();
    view.viewCallsFilter = 'outgoing';

    view.getUIFunctions({}).onEndReached();

    expect(callLog.fetchOlderCalls).toHaveBeenCalledWith('Outbound');
  });

  test('loads no older calls while the list is searched', () => {
    const { callLog, view } = createView({ searchInput: 'ada' });

    view.getUIFunctions({}).onEndReached();

    expect(callLog.fetchOlderCalls).not.toHaveBeenCalled();
  });

  test('passes the paging state on to the page', () => {
    const { callLog, view } = createView();
    callLog.loadingOlderCalls = true;

    expect(view.getUIProps({})).toEqual({
      calls: [],
      hasMoreOlderCalls: true,
      loadingOlderCalls: true,
    });
  });

  test('offers no more older calls while the list is searched', () => {
    const { view } = createView({ searchInput: 'ada' });

    expect(view.getUIProps({}).hasMoreOlderCalls).toBe(false);
  });

  test('offers no more older calls once the call log has none', () => {
    const { callLog, view } = createView();
    callLog.canLoadOlderCalls = false;

    expect(view.getUIProps({}).hasMoreOlderCalls).toBe(false);
  });

  test('switches the older calls scope with the filter', () => {
    const { callLog, view } = createView();

    view.onInitOnce();
    const [, getFilter, onFilterChange] = watch.mock.calls[0];
    view.viewCallsFilter = 'missed';
    onFilterChange(getFilter());

    expect(callLog.setOlderCallsScope).toHaveBeenCalledWith('Inbound');
  });
});
