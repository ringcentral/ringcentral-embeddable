import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import type { PartyData } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import type { Observable } from 'rxjs';

import type { SessionReplyOptions } from './Webphone.interface';
import type { RecordStatus } from './recordStatus';
import type { SessionStatus } from './sessionStatus';

export type WebphoneConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnecting'
  | 'disconnected'
  | 'connectFailed'
  | 'connectError'
  | 'inactiveDisconnecting'
  | 'inactive';

export type WebphoneCallDirection = 'Inbound' | 'Outbound';

export const WEBPHONE_REPLY_TYPES = [0, 1, 2, 4, 5] as const;
export interface WebphonePickupInboundCallParams {
  readonly sessionId: string;
  readonly toNumber: string;
  readonly fromNumber: string;
  readonly serverId: string;
  readonly telephonySessionId: string;
}

export interface WebphoneSwitchCallParams {
  readonly id: string;
  readonly from: { readonly phoneNumber: string };
  readonly direction: string;
  readonly to: { readonly phoneNumber: string };
  readonly sipData: { readonly fromTag: string; readonly toTag: string };
}

export interface WebphoneNormalizedSession {
  readonly id: string;
  readonly callId: string;
  readonly direction: WebphoneCallDirection;
  readonly callStatus: SessionStatus;
  readonly to: string;
  readonly toUserName: string;
  readonly from: string;
  readonly fromNumber: string;
  readonly fromUserName: string;
  readonly fromTag: string;
  readonly toTag: string;
  readonly startTime: number;
  readonly creationTime: number;
  readonly isOnHold: boolean;
  readonly isOnMute: boolean;
  readonly isOnFlip: boolean;
  readonly isOnTransfer: boolean;
  readonly isToVoicemail: boolean;
  readonly isForwarded: boolean;
  readonly isReplied: boolean;
  readonly recordStatus: RecordStatus;
  // Legacy consumers still pass this through APIs typed as NormalizedSession.
  readonly contactMatch: any;
  readonly minimized: boolean;
  readonly partyData: {
    readonly partyId: string;
    readonly sessionId: string;
  } | null;
  readonly __rc_partyData?: PartyData;
  readonly lastActiveTime: number;
  readonly cached: boolean;
  readonly removed: boolean;
  readonly callQueueName: string;
  readonly warmTransferSessionId: string;
  /**
   * Divergence from upstream: this app drops pre-recorded voicemail greetings,
   * and the call UI reads this status off the session.
   */
  readonly voicemailDropStatus?: string;
  readonly isReceivedTransfer?: boolean;
  readonly receivedTransferFromNumber?: string;
  readonly receivedTransferFromName?: string;
  readonly errorCode?:
    | 'callSetupFailed'
    | 'callSetupTimeout'
    | 'mediaOwnerLost';
}

export interface WebphoneCallEvent {
  readonly type:
    | 'callInit'
    | 'callProgress'
    | 'callRing'
    | 'callStart'
    | 'callHold'
    | 'callResume'
    | 'callEnd';
  readonly session: WebphoneNormalizedSession;
  readonly activeSession: WebphoneNormalizedSession | null;
  readonly ringSession: WebphoneNormalizedSession | null;
}

export interface WebphoneRecoveryEvent {
  readonly recoveredCallCount: number;
}

export interface WebphoneMakeCallParams {
  readonly toNumber: string;
  readonly fromNumber?: string;
  readonly homeCountryId: string;
  readonly extendedControls?: readonly string[];
  readonly transferSessionId?: string;
}

export interface WebphoneParkLocationTarget {
  readonly id: string;
  readonly name?: string;
  readonly extensionNumber?: string;
}

export interface WebphoneParkToLocationParams {
  readonly sessionId: string;
  readonly location: WebphoneParkLocationTarget;
}

export interface WebphoneMonitoredPickupCall {
  readonly telephonySessionId: string;
  readonly direction: WebphoneCallDirection;
  readonly from: { readonly phoneNumber: string; readonly name?: string };
  readonly to: { readonly phoneNumber: string; readonly name?: string };
  readonly sipData: { readonly fromTag: string; readonly toTag: string };
}

export interface WebphoneMonitoredPickupParams {
  readonly extensionId: string;
  readonly activeCall: WebphoneMonitoredPickupCall;
  readonly fromNumber: string;
}

export interface WebphoneFeatureCommands {
  parkToLocation?(params: WebphoneParkToLocationParams): Promise<string | null>;
  pickParkLocation?(
    params: WebphoneMonitoredPickupParams,
  ): Promise<{ id: string } | null>;
  pickGroupCall?(
    params: WebphoneMonitoredPickupParams,
  ): Promise<{ id: string } | null>;
  pickCallQueueCall?(
    params: WebphoneMonitoredPickupParams,
  ): Promise<{ id: string } | null>;
}

export interface WebphoneCommandError {
  readonly code:
    | 'deadlineExceeded'
    | 'mediaOwnerUnavailable'
    | 'missingSession'
    | 'terminalSession'
    | 'unsupported'
    | 'unknown';
  readonly operation: string;
  readonly message: string;
  readonly callId?: string;
  readonly details?: {
    readonly code: WebphoneCommandError['code'];
    readonly operation: string;
    readonly callId?: string;
  };
}

export interface WebphoneCallEventHandlers {
  onCallInit(
    handler: (
      session: WebphoneNormalizedSession,
      activeSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  onCallRing(
    handler: (
      session: WebphoneNormalizedSession,
      ringSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  onCallStart(
    handler: (
      session: WebphoneNormalizedSession,
      activeSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  onBeforeCallEnd(
    handler: (
      session: WebphoneNormalizedSession,
      activeSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  /** @deprecated Use callEvents$ instead. */
  onCallEnd(
    handler: (
      session: WebphoneNormalizedSession,
      activeSession: WebphoneNormalizedSession | null,
      ringSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  onCallHold(
    handler: (
      session: WebphoneNormalizedSession,
      activeSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  onBeforeCallResume(
    handler: (
      session: WebphoneNormalizedSession,
      activeSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  onCallResume(
    handler: (
      session: WebphoneNormalizedSession,
      activeSession: WebphoneNormalizedSession | null,
    ) => void,
  ): () => void;
  onWebphoneRegistered(handler: () => void): () => void;
  onWebphoneUnregistered(handler: () => void): () => void;
}

export interface WebphoneLike
  extends WebphoneFeatureCommands,
    WebphoneCallEventHandlers {
  readonly connectionStatus: WebphoneConnectionStatus;
  readonly connectRetryCounts: number;
  readonly realtimeRecoveryRetryCounts: number;
  readonly errorCode: string | null | undefined;
  readonly statusCode: number | null | undefined;
  readonly device: { readonly id: string } | null | undefined;
  readonly enabled: boolean;
  readonly connecting: boolean;
  readonly reconnecting: boolean;
  readonly connected: boolean;
  readonly disconnected: boolean;
  readonly disconnecting: boolean;
  readonly inactive: boolean;
  readonly inactiveDisconnecting: boolean;
  readonly connectFailed: boolean;
  readonly connectError: boolean;
  readonly isUnavailable: boolean;
  readonly ready: boolean;
  readonly sessions: readonly WebphoneNormalizedSession[];
  readonly activeSessionId: string | null;
  readonly ringSessionId: string | null;
  readonly activeSession: WebphoneNormalizedSession | null;
  readonly ringSession: WebphoneNormalizedSession | null;
  readonly ringSessions: readonly WebphoneNormalizedSession[];
  readonly onHoldSessions: readonly WebphoneNormalizedSession[];
  readonly hasCallSessions: boolean;
  readonly sessionPhoneNumbers: readonly string[];
  readonly ringingCallOnView: WebphoneNormalizedSession | null;
  readonly isOnTransfer: boolean;
  readonly incomingAudio: string;
  readonly incomingAudioFile?: string | null;
  readonly outgoingAudio: string;
  readonly outgoingAudioFile?: string | null;
  readonly defaultIncomingAudio: string;
  readonly defaultIncomingAudioFile: string;
  readonly defaultOutgoingAudio: string;
  readonly sessions$: Observable<readonly WebphoneNormalizedSession[]>;
  readonly callEvents$: Observable<WebphoneCallEvent>;
  readonly recoveryEvents$?: Observable<WebphoneRecoveryEvent>;
  connect(options?: {
    force?: boolean;
    skipTimeout?: boolean;
    skipConnectDelay?: boolean;
    skipDLCheck?: boolean;
  }): Promise<void>;
  disconnect(): Promise<void>;
  makeCall(params: WebphoneMakeCallParams): Promise<{ id: string } | null>;
  answer(sessionId: string): Promise<void>;
  reject(sessionId: string): Promise<void>;
  resume(sessionId: string): Promise<void>;
  forward(sessionId: string, forwardNumber: string): Promise<void>;
  mute(
    sessionId: string,
    errorHandler?: (error: unknown) => void,
  ): Promise<void>;
  unmute(sessionId: string): Promise<void>;
  hold(
    sessionId: string,
    errorHandler?: (error: unknown) => void,
  ): Promise<void>;
  unhold(
    sessionId: string,
    errorHandler?: (error: unknown) => void,
  ): Promise<void>;
  startRecord(sessionId: string): Promise<void>;
  stopRecord(
    sessionId: string,
    errorHandler?: (error: unknown) => void,
  ): Promise<void>;
  park(sessionId: string): Promise<void>;
  transfer(transferNumber: string, sessionId: string): Promise<void>;
  startWarmTransfer(
    transferNumber: string,
    sessionId: string,
  ): Promise<{ id: string } | null>;
  completeWarmTransfer(newSessionId: string): Promise<void>;
  flip(flipValue: string, sessionId: string): Promise<void>;
  sendDTMF(dtmfValue: string, sessionId: string): Promise<void>;
  hangup(
    sessionId: string,
    errorHandler?: (error: unknown) => void,
  ): Promise<void>;
  toVoiceMail(sessionId: string): Promise<void>;
  /** Maps the shared reply input shape to the runtime SDK reply overload. */
  replyWithMessage(
    sessionId: string,
    replyOptions: SessionReplyOptions,
  ): Promise<boolean | void>;
  switchCall(
    activeCall: WebphoneSwitchCallParams,
    homeCountryId: string,
  ): Promise<string | undefined>;
  pickupInboundCall(params: WebphonePickupInboundCallParams): Promise<unknown>;
  updateSessionMatchedContact(
    sessionId: string,
    contact: Pick<Entity, 'id'>,
  ): Promise<void>;
  changeInputDevice(
    deviceId: string,
    sessionIds?: readonly string[],
  ): Promise<void>;
  changeOutputDevice(
    deviceId: string,
    sessionIds?: readonly string[],
  ): Promise<void>;
  ensureMediaOwner(): Promise<void>;
  toggleMinimized(sessionId: string): Promise<void>;
  setIncomingAudioIntoStorage(params: {
    fileName: string;
    dataUrl: string;
  }): Promise<void>;
  loadClientAudio(): Promise<void>;
  setRingtone(params: {
    incomingAudio: string;
    incomingAudioFile: string;
    outgoingAudio: string;
    outgoingAudioFile: string;
  }): Promise<void>;
  readonly invite$: Observable<WebphoneNormalizedSession>;
  readonly ignore$: Observable<string>;
  /** @deprecated V2 has one authoritative runtime; retained until V1 removal. */
  useWebphoneMainTab(target?: object): void;
  /** @deprecated V2 ignores tab ownership; retained until V1 removal. */
  switchWebphoneInstance(options?: {
    forceDisconnect?: boolean;
  }): Promise<boolean>;
}
