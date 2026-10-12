// When another registration takes the phone over and a fresh one is refused
// too, the header announcement tells the user to sign out elsewhere or sign in
// again. It is a RingEX condition, so it shows with or without a CX session.

import { resolveConnectivity } from '../../src/app/views/ConnectivityView/resolve-connectivity';

const idle = {
  baseMode: null,
  baseLoading: false,
  baseRetry: false,
  isLoggedIn: true,
  isWebphoneInstanceIntercepted: false,
  isAgentSessionActive: false,
  isReauthing: false,
  isReconnecting: false,
  isSocketDisconnected: false,
  isIntegratedSoftphone: false,
  sipUnstableConnection: false,
  sipRegistering: false,
  attemptingSoftphoneReconnect: false,
  manualSoftphoneReconnect: false,
};

const intercepted = { ...idle, isWebphoneInstanceIntercepted: true };

describe('resolveConnectivity for an intercepted webphone', () => {
  test('offers a retry without a CX agent session', () => {
    expect(resolveConnectivity(intercepted)).toEqual({
      mode: 'webphoneInstanceIntercepted',
      severity: 'error',
      loading: false,
      retry: true,
    });
  });

  test('takes precedence over CX connectivity states', () => {
    const result = resolveConnectivity({
      ...intercepted,
      isAgentSessionActive: true,
      isReconnecting: true,
      isIntegratedSoftphone: true,
      sipRegistering: true,
    });

    expect(result.mode).toBe('webphoneInstanceIntercepted');
  });

  test('yields to a host connectivity problem', () => {
    const result = resolveConnectivity({ ...intercepted, baseMode: 'offline' });

    expect(result.mode).toBe('offline');
  });

  test('stays hidden once the user has signed out', () => {
    const result = resolveConnectivity({ ...intercepted, isLoggedIn: false });

    expect(result.mode).toBeNull();
  });

  test('stays hidden while the webphone is fine', () => {
    expect(resolveConnectivity(idle).mode).toBeNull();
  });
});
