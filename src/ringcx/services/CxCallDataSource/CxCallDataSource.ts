import {
  action,
  injectable,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
  delegate,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';
import dayjs from 'dayjs';

import { callStatus } from '../../enums';
import { getEvServerTimestamp } from '../../lib/getEvServerTimestamp';
import type {
  CxAddSessionNotification,
  CxBaseCall,
  CxDropSessionNotification,
  CxEndedCall,
  CxHoldResponse,
} from '../CxClient/interfaces';
import { CxClient } from '../CxClient';
import { CxAuth } from '../CxAuth';
import type {
  CxCallDataSourceOptions,
  CxCallData,
  CxRequeueCallGate,
  CallDataState,
} from './CxCallDataSource.interface';
import { stripSessionId } from './strip-session-id';

const DEFAULT_DATA: CallDataState = {
  callIds: [],
  otherCallIds: [],
  callLogsIds: [],
  callsMapping: {},
  rawCallsMapping: {},
};

/**
 * CxCallDataSource module - Call data storage and management
 * Handles call data persistence, call logs, and call limiting
 */
@injectable({
  name: 'CxCallDataSource',
})
class CxCallDataSource extends RcModule {
  eventEmitter = new EventEmitter();

  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private storagePlugin: StoragePlugin,
    @optional('CxCallDataSourceOptions')
    private evCallDataSourceOptions?: CxCallDataSourceOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
  }

  @storage
  @state
  data: CallDataState = { ...DEFAULT_DATA };

  get callIds(): string[] {
    return this.data.callIds;
  }

  get otherCallIds(): string[] {
    return this.data.otherCallIds;
  }

  get callLogsIds(): string[] {
    return this.data.callLogsIds;
  }

  get callsMapping(): Record<string, CxCallData> {
    return this.data.callsMapping;
  }

  get rawCallsMapping(): Record<string, CxCallData> {
    return this.data.rawCallsMapping;
  }

  /**
   * Check if calls are limited
   */
  get callsLimited(): boolean {
    if (typeof window !== 'undefined') {
      return window.localStorage?.getItem('callsLimited') === 'true';
    }
    return false;
  }

  /**
   * Set calls limited flag
   */
  changeCallsLimited(value: boolean): void {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('callsLimited', value?.toString());
    }
  }

  /**
   * Add a new call to raw calls mapping
   */
  @action
  addNewCall(call: CxBaseCall): void {
    let rawAgentRecording = call?.agentRecording;
    if (rawAgentRecording) {
      rawAgentRecording = {
        ...rawAgentRecording,
        pause: rawAgentRecording.pause ? Number(rawAgentRecording.pause) : 0,
      };
    }
    // Note: rawCallsMapping index is raw call uii
    this.data.rawCallsMapping[call.uii] = {
      ...call,
      // EV queueDts is an America/New_York wall-clock timestamp.
      timestamp: getEvServerTimestamp(call.queueDts),
      gate: this._getCurrentGateData(call),
      agentRecording: rawAgentRecording,
    } as CxCallData;
  }

  /**
   * Set a new session in call data
   */
  @action
  setNewSession(session: CxAddSessionNotification): void {
    const id = this.cxClient.encodeUii(session);
    if (session.agentId === this.cxAuth.agentId) {
      // Related to current agent session
      const index = this.callIds.indexOf(id);
      if (index === -1) {
        this.data.callIds.unshift(id);
      }
    } else {
      // Other session without current agent
      const index = this.otherCallIds.indexOf(id);
      if (index === -1) {
        this.data.otherCallIds.unshift(id);
      }
    }

    this.data.callsMapping[id] = {
      ...this.rawCallsMapping[session.uii],
      session,
    } as CxCallData;
  }

  /**
   * Add a new session and emit ringing event if applicable
   */
  @delegate('server')
  async addNewSession(session: CxAddSessionNotification): Promise<void> {
    await this.setNewSession(session);
    // Check with other phone - if agentId is empty, it's ringing
    if (session.agentId === '') {
      this.eventEmitter.emit(callStatus.RINGING, session);
    }
  }

  /**
   * Drop a session from other calls
   */
  @action
  dropSession(dropSession: CxDropSessionNotification): void {
    const id = this._getCallEncodeId(dropSession);
    this.data.otherCallIds = this.otherCallIds.filter(
      (callId) => callId !== id,
    );
  }

  /**
   * Remove an ended call and move to call logs
   */
  @action
  removeEndedCall(endedCall: CxEndedCall): void {
    const id = this._getCallEncodeId(endedCall);
    // Remove current agent session call with uii
    this.data.callIds = this.callIds.filter((callId) => callId !== id);
    // Remove other call session with uii
    this.data.otherCallIds = this.otherCallIds.filter(
      (callId) => !callId.includes(endedCall.uii),
    );

    // Add call with id (encodeUii({ uii, sessionId }))
    const callLogsIndex = this.callLogsIds.indexOf(id);
    if (callLogsIndex === -1) {
      this.data.callLogsIds.unshift(id);
    }
    if (this.callsMapping[id]) {
      this.data.callsMapping[id].endedCall = JSON.parse(
        JSON.stringify(endedCall),
      );
    }
  }

  /**
   * Clear all active calls
   */
  @action
  clearCalls(): void {
    this.data.callIds = [];
    this.data.otherCallIds = [];
  }

  /**
   * Set call hold status
   */
  @action
  setCallHoldStatus(res: CxHoldResponse): void {
    const id = this.cxClient.encodeUii(res);
    if (this.data.callsMapping[id]) {
      this.data.callsMapping[id].isHold = res.holdState;
    }
  }

  /**
   * Limit calls to max 250 and 7 days retention
   */
  @action
  limitCalls(): void {
    const lastWeekDayTimestamp = this._getLastWeekDayTimestamp();
    const storageCallData: CallDataState = {
      callIds: [],
      otherCallIds: [],
      callLogsIds: [],
      callsMapping: {},
      rawCallsMapping: {},
    };

    const fullCallLogsIds = this.callLogsIds
      .slice(0, 250)
      .reduce<string[]>((acc, curr) => [...acc, stripSessionId(curr)], []);

    // Valid rawCallsMapping
    storageCallData.rawCallsMapping = Object.keys(this.rawCallsMapping).reduce(
      (acc, id) => {
        if (
          fullCallLogsIds.includes(id) &&
          getEvServerTimestamp(this.rawCallsMapping[id].queueDts) >=
            lastWeekDayTimestamp
        ) {
          acc[id] = this.rawCallsMapping[id];
        }
        return acc;
      },
      {} as Record<string, CxCallData>,
    );

    // Valid callsMapping
    storageCallData.callsMapping = Object.keys(this.callsMapping).reduce(
      (acc, id) => {
        if (
          fullCallLogsIds.includes(stripSessionId(id)) &&
          getEvServerTimestamp(this.callsMapping[id].queueDts) >=
            lastWeekDayTimestamp
        ) {
          acc[id] = this.callsMapping[id];
          if (!id.endsWith('$1')) {
            storageCallData.callLogsIds.unshift(id);
          }
        }
        return acc;
      },
      {} as Record<string, CxCallData>,
    );

    this.data = storageCallData;
    this.changeCallsLimited(true);
  }

  /**
   * Resolve the local call id (`${uii}$${sessionId}`) for a server-side
   * segment id.
   *
   * Server call history keys interactions by `(uii, segmentId)` while local
   * call data keys them by `(uii, sessionId)`, and neither component is
   * derivable from the other. This index is the join between the two.
   *
   * The match is exact rather than best-effort: the agent library issues one
   * segment id per session, so a call with several legs has a distinct segment
   * id for each. `session.segmentId` is therefore the precise key; the
   * `segmentContext` fallback covers records stored before their ADD-SESSION
   * arrived, and identifies the agent's own leg.
   */
  getCallIdBySegmentId(segmentId: string): string | undefined {
    if (!segmentId) {
      return undefined;
    }
    return Object.keys(this.callsMapping).find((id) => {
      const call = this.callsMapping[id];
      const callSegmentId =
        call?.session?.segmentId || call?.segmentContext?.segmentId;
      return callSegmentId === segmentId;
    });
  }

  /**
   * Reset call data
   */
  @action
  resetData(): void {
    this.data = { ...DEFAULT_DATA };
  }

  private _getCallEncodeId(
    session: Partial<CxAddSessionNotification> | CxEndedCall,
  ): string {
    return this.cxClient.encodeUii(session);
  }

  private _getCurrentGateData(call: Partial<CxCallData>): CxRequeueCallGate {
    const currentGateId = call.queue?.number || '';
    const currentQueueGroup = this.cxAuth.availableRequeueQueues?.find(
      ({ gates }) => {
        return gates?.some(({ gateId }) => gateId === currentGateId);
      },
    );
    return {
      gateId: currentGateId,
      gateGroupId: currentQueueGroup?.gateGroupId,
    };
  }

  private _getLastWeekDayTimestamp(): number {
    const now = dayjs();
    const lastWeekDay = now.clone().subtract(7, 'days').startOf('day');
    return lastWeekDay.valueOf();
  }
}

export { CxCallDataSource };
