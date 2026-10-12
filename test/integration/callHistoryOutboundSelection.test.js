// The call-history row hands the contact it resolved to on to the call placed
// from it, so the call control page shows that contact instead of falling back
// to a `Maybe: <name>` guess among several matches.
//
// `CallsListView` is exercised through its own class so the wiring under test
// is the real one: the base `useActionsHandler` instance field, the wrapper the
// constructor installs around it, and the hand-off it performs.

const mockUseCallDisplayNameWithMatches = jest.fn(
  (BaseDisplayName) => BaseDisplayName,
);

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({ t: (key) => key }),
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring',
  () => ({
    CallsListViewSpring: class CallsListViewSpringBase {
      constructor() {
        this.baseCallHandler = jest.fn();
      }

      useCallHistoryItemInfo = () => ({ info: {}, actions: [] });

      useActionsHandler = () => this.baseCallHandler;

      getUIFunctions() {
        return { useActionsHandler: this.useActionsHandler };
      }

      get latestCalls() {
        return [];
      }
    },
  }),
);

// jest.config.js maps the micro-auth/contacts/core/message/phone services to
// one mock module, so each of their `jest.mock` calls replaces the same module
// and only the last factory would count. They share one factory instead,
// declared as a function so it is hoisted above the imports like the mocks.
function mockMicroServices() {
  return {
    AppFeatures: class AppFeatures {},
    Call: class Call {},
    CallHistory: class CallHistory {},
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

jest.mock('@ringcentral-integration/micro-auth/src/app/services', () =>
  mockMicroServices(),
);

jest.mock('@ringcentral-integration/micro-contacts/src/app/services', () =>
  mockMicroServices(),
);

jest.mock('@ringcentral-integration/micro-core/src/app/services', () =>
  mockMicroServices(),
);

jest.mock('@ringcentral-integration/micro-message/src/app/services', () =>
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
  useCallDisplayNameWithMatches: (...args) =>
    mockUseCallDisplayNameWithMatches(...args),
}));

jest.mock('../../src/app/services/ContactMatcher', () => ({
  refreshContactMatch: jest.fn(),
}));

jest.mock('../../src/app/services/ThirdParty', () => ({
  ThirdParty: class ThirdParty {},
}));

jest.mock('../../src/app/views/CallHistoryView/CallsListPage', () => ({
  CallsListPage: () => null,
}));

import { MatchedContactSelection } from '../../src/app/services/MatchedContactSelection';
import { CallsListView } from '../../src/app/views/CallHistoryView/CallsList.view';

const MATCHES = [
  { id: 'rc-1', name: 'Ada Byron', type: 'company' },
  { id: 'crm-1', name: 'Ada Lovelace', type: 'contact' },
];

function createView() {
  const selection = new MatchedContactSelection({ enable: jest.fn() });
  const stub = () => ({});
  const view = new CallsListView(
    stub(), // callViewState
    stub(), // connectivityManager
    stub(), // callHistory
    stub(), // rateLimiter
    stub(), // call
    stub(), // messageStore
    stub(), // router
    stub(), // appFeatures
    stub(), // toast
    stub(), // integrationConfig
    stub(), // contactMatcher
    selection,
    stub(), // callLogger
    stub(), // thirdParty
    stub(), // historyActiveCallsView
  );
  return { selection, view };
}

const OUTBOUND_CALL = {
  sessionId: 'session-1',
  direction: 'Outbound',
  type: 'Voice',
  activityMatches: [],
  fromMatches: [],
  toMatches: MATCHES,
};

const INFO = { renderInfo: { dialToPhoneNumber: '+16505550100' } };

async function clickCall(view, call, info = INFO) {
  await view.useActionsHandler(call, info, 'callHistory')('call');
}

describe('call-history outbound contact hand-off', () => {
  test('hands off the contact the user picked on the record', async () => {
    const { selection, view } = createView();
    await selection.select({
      scope: 'call',
      key: 'session-1',
      entityId: 'crm-1',
    });

    await clickCall(view, OUTBOUND_CALL);

    expect(selection.pendingOutbound).toEqual({
      entityId: 'crm-1',
      phoneNumber: '+16505550100',
    });
  });

  test('hands off the contact the call was logged against', async () => {
    // The row shows this contact with no `Maybe:` prefix, so from the user's
    // side it is just as selected as a pick — but it lives in the call's
    // activity matches, not in `MatchedContactSelection`.
    const { selection, view } = createView();

    await clickCall(view, {
      ...OUTBOUND_CALL,
      activityMatches: [{ contactId: 'crm-1', type: 'callLog' }],
    });

    expect(selection.pendingOutbound).toEqual({
      entityId: 'crm-1',
      phoneNumber: '+16505550100',
    });
  });

  test('prefers an explicit pick over the logged contact', async () => {
    const { selection, view } = createView();
    await selection.select({
      scope: 'call',
      key: 'session-1',
      entityId: 'rc-1',
    });

    await clickCall(view, {
      ...OUTBOUND_CALL,
      activityMatches: [{ contactId: 'crm-1', type: 'callLog' }],
    });

    expect(selection.pendingOutbound?.entityId).toBe('rc-1');
  });

  test('hands off nothing for an unresolved record', async () => {
    // Several matches and no pick renders as `Maybe: <guess>`; handing that on
    // would present the guess as a resolved contact.
    const { selection, view } = createView();

    await clickCall(view, OUTBOUND_CALL);

    expect(selection.pendingOutbound).toBeNull();
  });

  test('uses the inbound side for an inbound record', async () => {
    const { selection, view } = createView();

    await clickCall(view, {
      ...OUTBOUND_CALL,
      direction: 'Inbound',
      fromMatches: MATCHES,
      toMatches: [],
      activityMatches: [{ contactId: 'crm-1', type: 'callLog' }],
    });

    expect(selection.pendingOutbound?.entityId).toBe('crm-1');
  });

  test('clears a stale pending pick when the record has no contact', async () => {
    const { selection, view } = createView();
    await selection.setPendingOutbound({
      entityId: 'crm-1',
      phoneNumber: '+16505550100',
    });

    await clickCall(view, OUTBOUND_CALL);

    expect(selection.pendingOutbound).toBeNull();
  });

  test('still runs the base call action', async () => {
    const { view } = createView();

    await clickCall(view, OUTBOUND_CALL);

    expect(view.baseCallHandler).toHaveBeenCalledWith('call');
  });
});
