// A user with several RingCX agent accounts authenticates first and only logs
// in once an account is picked: the login stays `authing` until the picked
// account's socket opens. The picker has to be offered from that state, and
// switching to another account must not keep the first account's settings,
// which the Agent SDK caches after the first login phase 1.

jest.mock('@ringcentral-integration/next-core', () => ({
  ...jest.requireActual('../mocks/nextCoreMock'),
  load: jest.fn(async () => undefined),
  Redirect: require('react-router-dom').Redirect,
  Route: require('react-router-dom').Route,
  Switch: require('react-router-dom').Switch,
}));

jest.mock('../../src/app/services/load-ringcx-chunk', () => ({
  loadRingCXChunk: jest.fn(async () => ({
    getRingCXModules: jest.fn(() => []),
  })),
}));

jest.mock('../../src/app/services/RingCX/keep-router-path-on-load', () => ({
  keepRouterPathOnLoad: jest.fn(),
}));

jest.mock('@ringcentral-integration/micro-core/src/app/plugins', () => ({
  BlockPlugin: class BlockPlugin {},
}));

jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class CxAgentSession {},
}));
jest.mock('../../src/ringcx/views/CxAgentView', () => ({
  CxAgentView: class CxAgentView {},
}));
jest.mock('../../src/ringcx/views/CxActiveCallView', () => ({
  CxActiveCallView: class CxActiveCallView {},
}));
jest.mock('../../src/ringcx/views/CxActiveCallListView', () => ({
  CxActiveCallListView: class CxActiveCallListView {},
}));
jest.mock('../../src/ringcx/views/CxChooseAccountView', () => ({
  CxChooseAccountView: class CxChooseAccountView {},
}));
jest.mock('../../src/ringcx/views/CxSessionConfigView', () => ({
  CxSessionConfigView: class CxSessionConfigView {},
}));
jest.mock('../../src/ringcx/views/CxTransferView', () => ({
  CxTransferView: class CxTransferView {},
}));

import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';

import { RingCX } from '../../src/app/services/RingCX/RingCX';
import { CxAppView } from '../../src/ringcx/CxApp.view';
import { CxLoginStatus } from '../../src/ringcx/enums/loginStatus';
import { CxAuth } from '../../src/ringcx/services/CxAuth/CxAuth';

const AGENT_A = { agentId: '1001', accountName: 'Account A' };
const AGENT_B = { agentId: '1002', accountName: 'Account B' };

function createCxClient(agents = [AGENT_A, AGENT_B]) {
  return {
    initSDK: jest.fn(async () => undefined),
    getAndHandleAuthenticateResponse: jest.fn(async () => ({ agents })),
    closeSocket: jest.fn(async () => undefined),
    resetUIModel: jest.fn(),
  };
}

function createCxAuth(cxClient = createCxClient()) {
  const cxAuth = new CxAuth(
    cxClient,
    {
      loggedIn: true,
      accessToken: 'rc-token',
      ensureValidAccessToken: jest.fn(async () => undefined),
    },
    {
      service: {
        platform: () => ({
          auth: () => ({ data: jest.fn(async () => ({})) }),
        }),
      },
    },
    { subscribe: jest.fn() },
    { currentLocale: 'en-US' },
    { danger: jest.fn(), warning: jest.fn(), info: jest.fn() },
    { next: jest.fn((fn) => fn()) },
    { enable: jest.fn() },
    { shared: true, onServer: jest.fn() },
  );
  return { cxAuth, cxClient };
}

function withAuthenticatedAccounts(cxAuth, agents = [AGENT_A, AGENT_B]) {
  cxAuth.loginStatus = CxLoginStatus.AUTHING;
  cxAuth.agent = { authenticateResponse: { agents } };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CxAuth agent selection', () => {
  test('waits for a pick after authenticating several agent accounts', () => {
    const { cxAuth } = createCxAuth();

    withAuthenticatedAccounts(cxAuth);

    expect(cxAuth.isAgentSelectionPending).toBe(true);
  });

  test.each([
    ['there is only one account', { agents: [AGENT_A] }],
    ['an account is picked', { agentId: AGENT_A.agentId }],
    ['the picked account is logged in', { loginStatus: CxLoginStatus.AUTH_SUCCESS }],
    ['the accounts are not known yet', { agents: null }],
  ])('does not wait for a pick when %s', (_name, overrides) => {
    const { cxAuth } = createCxAuth();
    withAuthenticatedAccounts(cxAuth, overrides.agents ?? [AGENT_A, AGENT_B]);
    if (overrides.agents === null) {
      cxAuth.agent = null;
    }
    if (overrides.agentId) {
      cxAuth.agentId = overrides.agentId;
    }
    if (overrides.loginStatus) {
      cxAuth.loginStatus = overrides.loginStatus;
    }

    expect(cxAuth.isAgentSelectionPending).toBe(false);
  });

  test('offers the picker only once the new authentication answers', async () => {
    const { cxAuth, cxClient } = createCxAuth();
    // Accounts stored by an earlier run that never logged out.
    cxAuth.agent = {
      authenticateResponse: { agents: [AGENT_A, AGENT_B] },
      agentConfig: { agentSettings: {} },
    };
    let pendingDuringAuthentication;
    cxClient.getAndHandleAuthenticateResponse.mockImplementationOnce(
      async () => {
        pendingDuringAuthentication = cxAuth.isAgentSelectionPending;
        return { agents: [AGENT_A, AGENT_B] };
      },
    );

    await cxAuth.startAgentLogin({ requestedByUser: true });

    expect(pendingDuringAuthentication).toBe(false);
    expect(cxAuth.agent).toEqual({
      authenticateResponse: { agents: [AGENT_A, AGENT_B] },
    });
    expect(cxAuth.loginStatus).toBe(CxLoginStatus.AUTHING);
    expect(cxAuth.isAgentSelectionPending).toBe(true);
  });

  test('switching account resets the SDK model and returns to the picker', async () => {
    const { cxAuth, cxClient } = createCxAuth();
    withAuthenticatedAccounts(cxAuth);
    cxAuth.agentId = AGENT_A.agentId;

    await cxAuth.reselectAgent();

    expect(cxClient.closeSocket).toHaveBeenCalledTimes(1);
    expect(cxClient.resetUIModel).toHaveBeenCalledTimes(1);
    expect(cxClient.closeSocket.mock.invocationCallOrder[0]).toBeLessThan(
      cxClient.resetUIModel.mock.invocationCallOrder[0],
    );
    expect(cxAuth.agentId).toBe('');
    expect(cxAuth.loginStatus).toBe(CxLoginStatus.AUTHING);
    expect(cxAuth.isAgentSelectionPending).toBe(true);
  });
});

describe('RingCX stage while an agent account is picked', () => {
  function createRingCX() {
    return new RingCX(
      { isRingCXEnabled: true },
      { addBeforeLogoutHandler: jest.fn(), loggedIn: true },
      {
        shared: true,
        isServer: true,
        onServer: jest.fn(),
        onClient: jest.fn(),
        portDetector: { syncFullState: jest.fn(async () => undefined) },
      },
      { currentPath: '/agent' },
      { enable: jest.fn() },
      { danger: jest.fn() },
      { currentLocale: 'en-US' },
      { server: 'https://platform.ringcentral.com' },
    );
  }

  test('offers the account picker instead of the starting page', async () => {
    const ringCX = createRingCX();
    ringCX.cxAuth = {
      loginStatus: 'authing',
      isOnlyOneAgent: false,
      isAgentSelectionPending: true,
      agentId: '',
    };
    ringCX.cxAgentSession = { configured: false, configSuccess: false };

    await ringCX.ensureLoaded();

    expect(ringCX.stage).toBe('chooseAccount');
    expect(ringCX.sessionWanted).toBe(false);
  });

  test('keeps the starting page while the picked account logs in', async () => {
    const ringCX = createRingCX();
    ringCX.cxAuth = {
      loginStatus: 'authing',
      isOnlyOneAgent: false,
      isAgentSelectionPending: false,
      agentId: AGENT_B.agentId,
    };
    ringCX.cxAgentSession = { configured: false, configSuccess: false };

    await ringCX.ensureLoaded();

    expect(ringCX.stage).toBe('authenticating');
  });
});

describe('CxAppView fallback route', () => {
  function renderAt(path, cxAuthState) {
    const view = new CxAppView(
      cxAuthState,
      { configSuccess: false },
      { component: () => <div data-sign="choose-account" /> },
      { component: () => <div data-sign="session-config" /> },
      { component: () => null },
      { component: () => null },
      { component: () => null },
      { component: () => null },
    );
    const Harness = () => view.component();
    let location;
    const result = render(
      <MemoryRouter initialEntries={[path]}>
        <Harness />
        <Route
          path="*"
          render={(props) => {
            location = props.location;
            return null;
          }}
        />
      </MemoryRouter>,
    );
    return { ...result, getPath: () => location.pathname };
  }

  test('leaves a session config page of the dropped account for the picker', () => {
    const { getPath, queryByTestId } = renderAt('/agent/sessionConfig', {
      agentId: '',
      isAgentSelectionPending: true,
      isOnlyOneAgent: false,
      loginStatus: 'authing',
    });

    expect(getPath()).toBe('/agent/chooseAccount');
    expect(queryByTestId('choose-account')).not.toBeNull();
  });
});
