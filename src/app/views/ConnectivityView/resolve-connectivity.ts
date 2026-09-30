import type {
  ConnectivityMode,
  ConnectivityViewProps,
} from './ConnectivityView.interface';

interface ConnectivityInputs {
  readonly baseMode: ConnectivityMode | null;
  readonly baseLoading: boolean;
  readonly baseRetry: boolean;
  readonly isLoggedIn: boolean;
  /** Another registration took this phone over and a fresh one was refused. */
  readonly isWebphoneInstanceIntercepted: boolean;
  readonly isAgentSessionActive: boolean;
  readonly isReauthing: boolean;
  readonly isReconnecting: boolean;
  readonly isSocketDisconnected: boolean;
  readonly isIntegratedSoftphone: boolean;
  readonly sipUnstableConnection: boolean;
  readonly sipRegistering: boolean;
  readonly attemptingSoftphoneReconnect: boolean;
  readonly manualSoftphoneReconnect: boolean;
}

type ConnectivityState = Pick<
  ConnectivityViewProps,
  'mode' | 'severity' | 'loading' | 'retry'
>;

/**
 * Resolves one announcement from host, Agent SDK, and CX SIP connectivity.
 */
export function resolveConnectivity(
  inputs: ConnectivityInputs,
): ConnectivityState {
  if (inputs.baseMode) {
    return {
      mode: inputs.baseMode,
      severity: 'error',
      loading: inputs.baseLoading,
      retry: inputs.baseRetry,
    };
  }
  if (!inputs.isLoggedIn) {
    return { mode: null, severity: 'error', loading: false, retry: false };
  }
  if (inputs.isWebphoneInstanceIntercepted) {
    return {
      mode: 'webphoneInstanceIntercepted',
      severity: 'error',
      loading: false,
      retry: true,
    };
  }
  if (!inputs.isAgentSessionActive) {
    return { mode: null, severity: 'error', loading: false, retry: false };
  }
  if (inputs.isReauthing || inputs.isReconnecting) {
    return {
      mode: 'socketReconnecting',
      severity: 'error',
      loading: true,
      retry: false,
    };
  }
  if (inputs.isSocketDisconnected) {
    return {
      mode: 'socketDisconnected',
      severity: 'error',
      loading: false,
      retry: true,
    };
  }
  if (!inputs.isIntegratedSoftphone) {
    return { mode: null, severity: 'error', loading: false, retry: false };
  }
  if (inputs.manualSoftphoneReconnect) {
    return {
      mode: 'sipReconnectFailed',
      severity: 'error',
      loading: false,
      retry: true,
    };
  }
  if (
    inputs.attemptingSoftphoneReconnect ||
    inputs.sipUnstableConnection
  ) {
    return {
      mode: 'sipUnstableConnection',
      severity: 'error',
      loading: true,
      retry: false,
    };
  }
  if (inputs.sipRegistering) {
    return {
      mode: 'sipConnecting',
      severity: 'info',
      loading: true,
      retry: false,
    };
  }
  return { mode: null, severity: 'error', loading: false, retry: false };
}
