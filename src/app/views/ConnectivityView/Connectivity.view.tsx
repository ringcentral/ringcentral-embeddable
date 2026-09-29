import {
  Auth,
  ConnectivityManager,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ConnectivityView as BaseConnectivityView } from '@ringcentral-integration/micro-auth/src/app/views/ConnectivityView/Connectivity.view';
import type { ConnectivityViewOptions } from '@ringcentral-integration/micro-auth/src/app/views/ConnectivityView/Connectivity.view.interface';
import type { UIFunctions, UIProps } from '@ringcentral-integration/next-core';
import {
  dynamic,
  injectable,
  optional,
  useConnector,
} from '@ringcentral-integration/next-core';
import { useObservableState } from 'observable-hooks';
import React, { useRef } from 'react';

import { RingCX } from '../../services/RingCX';
import { ConnectivityPanel } from './ConnectivityPanel';
import type { ConnectivityViewProps } from './ConnectivityView.interface';
import { resolveConnectivity } from './resolve-connectivity';

interface CxClientConnectivity {
  readonly appStatus?: string;
}

interface CxAuthConnectivity {
  readonly isEvLogged: boolean;
  readonly isReauthing: boolean;
  retryConnection(): Promise<void>;
}

interface CxSoftphoneConnectivity {
  readonly isIntegratedSoftphone: boolean;
  readonly sipUnstableConnection: boolean;
  readonly sipRegistering: boolean;
  readonly attemptingSoftphoneReconnect: boolean;
  readonly manualSoftphoneReconnect: boolean;
  retrySoftphoneSession(): Promise<void>;
  resetSip(): Promise<void>;
}

const CX_CONNECTING_STATUS = 'RECONNECTING';
const CX_DISCONNECTED_STATUSES = new Set(['CLOSED', 'CONNECT_FAILURE']);

/**
 * Renders one connectivity announcement for host network, Agent SDK, and CX
 * integrated-softphone state.
 */
@injectable({
  name: 'ConnectivityView',
})
export class ConnectivityView extends BaseConnectivityView {
  @dynamic('CxClient')
  private readonly _cxClient?: CxClientConnectivity;

  @dynamic('CxAuth')
  private readonly _cxAuth?: CxAuthConnectivity;

  @dynamic('CxIntegratedSoftphone')
  private readonly _cxIntegratedSoftphone?: CxSoftphoneConnectivity;

  constructor(
    protected _connectivityManager: ConnectivityManager,
    private readonly _auth: Auth,
    private readonly _ringCX: RingCX,
    @optional('ConnectivityViewOptions')
    protected _connectivityViewOptions?: ConnectivityViewOptions,
  ) {
    super(_connectivityManager, _connectivityViewOptions);
  }

  override getUIProps(): UIProps<ConnectivityViewProps> {
    const baseProps = super.getUIProps();
    if (!this._ringCX.loaded) {
      return resolveConnectivity({
        baseMode: baseProps.mode,
        baseLoading: baseProps.loading,
        baseRetry: baseProps.retry,
        isLoggedIn: this._auth.loggedIn,
        isAgentSessionActive: false,
        isReauthing: false,
        isReconnecting: false,
        isSocketDisconnected: false,
        isIntegratedSoftphone: false,
        sipUnstableConnection: false,
        sipRegistering: false,
        attemptingSoftphoneReconnect: false,
        manualSoftphoneReconnect: false,
      });
    }
    const appStatus = this._cxClient?.appStatus;
    return {
      ...resolveConnectivity({
        baseMode: baseProps.mode,
        baseLoading: baseProps.loading,
        baseRetry: baseProps.retry,
        isLoggedIn: this._auth.loggedIn,
        isAgentSessionActive:
          (this._cxAuth?.isEvLogged ?? false) ||
          (this._cxAuth?.isReauthing ?? false),
        isReauthing: this._cxAuth?.isReauthing ?? false,
        isReconnecting: appStatus === CX_CONNECTING_STATUS,
        isSocketDisconnected:
          appStatus !== undefined &&
          CX_DISCONNECTED_STATUSES.has(appStatus),
        isIntegratedSoftphone:
          this._cxIntegratedSoftphone?.isIntegratedSoftphone ?? false,
        sipUnstableConnection:
          this._cxIntegratedSoftphone?.sipUnstableConnection ?? false,
        sipRegistering:
          this._cxIntegratedSoftphone?.sipRegistering ?? false,
        attemptingSoftphoneReconnect:
          this._cxIntegratedSoftphone?.attemptingSoftphoneReconnect ?? false,
        manualSoftphoneReconnect:
          this._cxIntegratedSoftphone?.manualSoftphoneReconnect ?? false,
      }),
    };
  }

  override getUIFunctions(): UIFunctions<ConnectivityViewProps> {
    const baseFunctions = super.getUIFunctions();
    return {
      onClick: async (): Promise<void> => {
        const { mode } = this.getUIProps();
        if (mode === 'sipReconnectFailed') {
          await this._cxIntegratedSoftphone?.retrySoftphoneSession();
          return;
        }
        if (mode === 'socketDisconnected') {
          await this._cxIntegratedSoftphone?.resetSip();
          await this._cxAuth?.retryConnection();
          return;
        }
        baseFunctions.onClick();
      },
    };
  }

  override component(
    props?: Pick<ConnectivityViewProps, 'className'>,
  ): React.ReactElement | null {
    const { current: uiFunctions } = useRef(this.getUIFunctions());
    const panelProps = useConnector(() => ({
      ...props,
      ...this.getUIProps(),
    }));
    const ready = useObservableState(
      this._connectivityManager.readyState$,
      false,
    );
    if (!ready) {
      return null;
    }
    return <ConnectivityPanel {...panelProps} {...uiFunctions} />;
  }
}
