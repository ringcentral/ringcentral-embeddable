import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  injectable,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
  PortManager,
  delegate,
} from '@ringcentral-integration/next-core';

import {
  agentStateTypes,
  defaultAgentStateTexts,
  messageTypes,
} from '../../enums';
import type { DefaultAgentStateTexts } from '../../enums';
import { t } from './i18n';
import { CxCallbackTypes } from '../CxClient/enums';
import { CxClient } from '../CxClient';
import { CxAuth } from '../CxAuth';
import { CxSubscription } from '../CxSubscription';
import { CxCallMonitor } from '../CxCallMonitor';
import { CxPresence } from '../CxPresence';
import { CxAgentSession } from '../CxAgentSession';
import { CxCallDisposition } from '../CxCallDisposition';
import type {
  CxWorkingStateOptions,
  AgentState,
  WorkingState,
} from './CxWorkingState.interface';
import { shouldShowDispositionSubmitStep } from '../../utils/shouldShowDispositionSubmitStep';

const PENDING_DISPOSITION_STATE: AgentState = {
  agentState: 'PENDING-DISPOSITION',
  agentAuxState: 'Pending Disposition',
};

const DEFAULT_AGENT_STATE: AgentState = {
  agentState: agentStateTypes.available,
  agentAuxState: 'Available',
};

/**
 * CxWorkingState module - Agent working state management
 * Handles agent state changes, break time tracking, and disposition pending states
 */
@injectable({
  name: 'CxWorkingState',
})
class CxWorkingState extends RcModule {
  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private cxSubscription: CxSubscription,
    private cxCallMonitor: CxCallMonitor,
    private cxPresence: CxPresence,
    private cxAgentSession: CxAgentSession,
    private cxCallDisposition: CxCallDisposition,
    private toast: Toast,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    @optional('CxWorkingStateOptions')
    private evWorkingStateOptions?: CxWorkingStateOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  @storage
  @state
  time: number = Date.now();

  @storage
  @state
  agentState: AgentState = DEFAULT_AGENT_STATE;

  @storage
  @state
  isPendingDisposition = false;

  @storage
  @state
  pendingDispositionCallId = '';

  @action
  setAgentState(agentState: AgentState): void {
    this.agentState = agentState;
    if (agentState.agentState !== agentStateTypes.breakAfterCall) {
      this.time = Date.now();
    }
  }

  @action
  _setIsPendingDisposition(isPendingDisposition: boolean, callId = ''): void {
    this.isPendingDisposition = isPendingDisposition;
    this.pendingDispositionCallId = isPendingDisposition ? callId : '';
  }

  @delegate('server')
  async setIsPendingDisposition(isPendingDisposition: boolean, callId = ''): Promise<void> {
    this._setIsPendingDisposition(isPendingDisposition, callId);
  }

  @action
  resetWorkingState(): void {
    this.time = Date.now();
    this.isPendingDisposition = false;
    this.pendingDispositionCallId = '';
  }

  @action
  setTime(time: number): void {
    this.time = time;
  }

  @computed((that: CxWorkingState) => [
    that.agentState,
    that.isPendingDisposition,
  ])
  get workingState(): WorkingState {
    if (this.isPendingDisposition) {
      return PENDING_DISPOSITION_STATE;
    }
    return {
      ...this.agentState,
      agentAuxState:
        this.agentState.agentAuxState ||
        defaultAgentStateTexts[
          this.agentState.agentState as DefaultAgentStateTexts
        ] ||
        this.agentState.agentState,
    };
  }

  @computed((that: CxWorkingState) => [
    that.cxAuth.agentConfig,
    that.isPendingDisposition,
  ])
  get agentStates(): AgentState[] {
    const { agentConfig } = this.cxAuth;
    if (!agentConfig?.agentSettings?.availableAgentStates) {
      return [];
    }
    const { availableAgentStates } = agentConfig.agentSettings;
    if (this.isPendingDisposition) {
      return [PENDING_DISPOSITION_STATE, ...availableAgentStates];
    }
    return availableAgentStates;
  }

  @computed((that: CxWorkingState) => [that.agentStates])
  get workingAgentState(): AgentState | undefined {
    return this.agentStates.find(
      (s) => s.agentState === agentStateTypes.working,
    );
  }

  @computed((that: CxWorkingState) => [that.cxAuth.agentSettings])
  get maxBreakTime(): number {
    const { agentSettings } = this.cxAuth;
    if (!agentSettings) {
      return 0;
    }
    const { maxBreakTime, maxLunchTime } = agentSettings;
    if (this.isOnLunch) {
      return (parseInt(String(maxLunchTime || '0'), 10)) * 60 * 1000;
    }
    if (this.isOnBreakOrAway) {
      return (parseInt(String(maxBreakTime || '0'), 10)) * 60 * 1000;
    }
    return 60 * 1000;
  }

  get isOnBreakOrAway(): boolean {
    const { agentState } = this.workingState;
    return (
      agentState === agentStateTypes.away ||
      agentState === agentStateTypes.onBreak
    );
  }

  get isOnLunch(): boolean {
    const { agentState } = this.workingState;
    return agentState === agentStateTypes.lunch;
  }

  get isWorking(): boolean {
    const { agentState } = this.agentState;
    return agentState === agentStateTypes.working;
  }

  initialize() {
    this.cxAgentSession.onTriggerConfig(() => {
      this._handleTriggerConfig();
    });
    this.cxCallMonitor.onCallEnded((call) => {
      const encodedCallId = call?.session ? this.cxClient.encodeUii(call.session) : '';
      const mainCallId = call?.uii
        ? this.cxClient.getMainId(this.cxClient.decodeUii(call.uii))
        : '';
      const isDisposed = this.cxCallDisposition.isDisposed(encodedCallId) ||
        this.cxCallDisposition.isDisposed(mainCallId);
      if (isDisposed) {
        this.logger.info('onCallEnded~~ already disposed, skip pending disposition');
        this.setIsPendingDisposition(false);
        return;
      }
      if (!shouldShowDispositionSubmitStep(call, this.evWorkingStateOptions)) {
        this.logger.info('onCallEnded~~ no disposition step required, skip pending disposition');
        this.setIsPendingDisposition(false);
        return;
      }
      this.logger.info('onCallEnded~~ setIsPendingDisposition(true)');
      this.setIsPendingDisposition(true, encodedCallId || mainCallId);
    });
    // The server is the authority on pending disposition. Deriving it only
    // from a locally observed call end misses the case where the call ended
    // while the socket was down, which leaves the agent stuck as Engaged with
    // no way to reach the disposition UI.
    this.cxSubscription.subscribe(
      CxCallbackTypes.PENDING_DISP,
      (data?: { agentId?: string | number; status?: boolean | string }) => {
        if (!data) return;
        const { agentId } = this.cxAuth;
        if (agentId && String(data.agentId) !== String(agentId)) {
          return;
        }
        const isPending = data.status === true || data.status === 'true';
        if (isPending === this.isPendingDisposition) {
          return;
        }
        this.logger.info('PENDING_DISP~~', isPending);
        this.setIsPendingDisposition(
          isPending,
          isPending ? this.pendingDispositionCallId : '',
        );
      },
    );
    this.cxSubscription.subscribe(
      CxCallbackTypes.AGENT_STATE,
      ({ currentState, currentAuxState }: {
        currentState: string;
        currentAuxState: string;
      }) => {
        if (
          this.agentState.agentState !== currentState ||
          this.agentState.agentAuxState !== currentAuxState
        ) {
          this.setAgentState({
            agentState: currentState,
            agentAuxState: currentAuxState,
          });
        }
      },
    );
  }

  /**
   * Change agent working state
   */
  changeWorkingState({ agentState, agentAuxState }: AgentState): void {
    const isOnCall =
      this.agentState.agentState === agentStateTypes.transition ||
      this.agentState.agentState === agentStateTypes.engaged ||
      this.cxPresence.calls.length > 0;
    if (isOnCall && agentState !== agentStateTypes.onBreak) {
      this.toast.warning({
        message: t(messageTypes.INVALID_STATE_CHANGE),
        allowDuplicates: false,
        ttl: 0,
      });
      return;
    }
    this.cxClient.setAgentState(agentState, agentAuxState);
  }

  /**
   * Set working state to working
   */
  setWorkingStateWorking(): void {
    const workingState = this.workingAgentState;
    if (workingState) {
      this.changeWorkingState(workingState);
    }
  }

  /**
   * Alert when break time is exceeded
   */
  alertOverBreakTime(): void {
    this.toast.warning({
      message: t(messageTypes.OVER_BREAK_TIME),
      ttl: 0,
      allowDuplicates: false,
    });
  }

  /**
   * Handle trigger config: set initial login state and reset working state
   */
  private _handleTriggerConfig(): void {
    const { agentConfig } = this.cxAuth;
    if (agentConfig?.agentSettings?.initLoginState) {
      this.cxClient.setAgentState(
        agentConfig.agentSettings.initLoginState,
        agentConfig.agentSettings.initLoginStateLabel || '',
      );
    }
    this.resetWorkingState();
  }
}

export { CxWorkingState };
