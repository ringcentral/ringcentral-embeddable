import type { ConnectivityType } from '@ringcentral-integration/micro-auth/src/app/services/ConnectivityManager';

export type ConnectivityMode =
  | ConnectivityType
  | 'socketDisconnected'
  | 'socketReconnecting'
  | 'sipUnstableConnection'
  | 'sipReconnectFailed'
  | 'sipConnecting'
  | 'webphoneInstanceIntercepted';

export interface ConnectivityViewProps {
  readonly className?: string;
  readonly mode: ConnectivityMode | null;
  readonly severity: 'error' | 'info';
  readonly loading: boolean;
  readonly retry: boolean;
  readonly onClick: () => void;
}
