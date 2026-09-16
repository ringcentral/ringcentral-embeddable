import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import type InboundCallSession from 'ringcentral-web-phone-v2/call-session/inbound';
import type OutboundCallSession from 'ringcentral-web-phone-v2/call-session/outbound';
import type { SipClientOptions, SipInfo, WebPhoneOptions } from 'ringcentral-web-phone-v2/types';

/**
 * Webphone Options
 * appKey: ringcentral client id
 * appName: app name for track
 * appVersion: app version for track
 * webphoneLogLevel: log level
 * onCall*: add handler when call event fired
 * webphoneSDKOptions: web phone sdk options
 * permissionCheck: if check phone number with numberValidate module
 * connectDelay: delay before creating web phone connection
 */
export interface WebphoneOptions {
  appKey: string;
  appName: string;
  appVersion: string;
  webphoneLogLevel?: number;
  onCallEnd?: () => CallEndHandler;
  onCallRing?: () => CallRingHandler;
  onCallStart?: () => CallStartHandler;
  onCallResume?: () => CallResumeHandler;
  onCallHold?: () => CallHoldHandler;
  onCallInit?: () => CallInitHandler;
  onBeforeCallResume?: () => BeforeCallResumeHandler;
  onBeforeCallEnd?: () => BeforeCallEndHandler;
  webphoneSDKOptions?: WebPhoneOptions;
  permissionCheck?: boolean;
  connectDelay?: number;
  enableContactMatchWhenNewCall?: boolean;
  /**
   * Maximum time (ms) to wait for websocket/subscription recovery after SIP reconnects.
   * Default handled in implementation when value not provided.
   */
  webSocketRecoveryTimeout?: number;
}


export interface SwitchCallActiveCallParams {
  id: string;
  from: { phoneNumber: string };
  direction: string;
  to: { phoneNumber: string };
  sipData: {
    fromTag: string;
    toTag: string;
  };
}

export type OffEventHandler = () => void;

export type ActiveWebphoneChangedHandler = (options: {
  activeId?: string | null;
  currentActive: boolean;
}) => void;

export type CallStartHandler = (
  session: NormalizedSession,
  activeSession: NormalizedSession,
) => void;

export type CallRingHandler = (
  session: NormalizedSession,
  ringSession: NormalizedSession,
) => void;

export type CallInitHandler = CallStartHandler;
export type BeforeCallEndHandler = CallStartHandler;
export type CallResumeHandler = CallStartHandler;
export type BeforeCallResumeHandler = CallStartHandler;
export type CallHoldHandler = CallStartHandler;

export type CallEndHandler = (
  session: NormalizedSession,
  activeSession: NormalizedSession,
  ringSession: NormalizedSession,
) => void;

export type CallVoicemailDroppedHandler = (
  session: NormalizedSession,
  activeSession: NormalizedSession,
) => void;

export interface SessionReplyOptions {
  replyType: number;
  replyText: string;
  timeValue: string;
  timeUnits: string;
  callbackDirection: string;
}

export type WebphoneSessionRequestHeader = {
  raw: string;
};

export type WebphoneSessionRequestHeaders = {
  [name: string]: Array<WebphoneSessionRequestHeader>;
};

export type TPickupInboundCall = {
  sessionId: string;
  toNumber: string;
  fromNumber: string;
  serverId: string;
  telephonySessionId: string;
};

export interface WebphoneSession
  extends InboundCallSession,
    OutboundCallSession {
  id?: string;
  data?: {
    sessionId?: string;
  };
  callId: string;
  localHold?: boolean;
  __rc_extendedControls?: string[];
  __rc_extendedControlStatus?: string;
  __rc_creationTime: number;
  __rc_lastActiveTime: number;
  __rc_fromNumber?: string;
  __rc_transferSessionId?: string;
  __rc_contactMatch?: unknown;
  __rc_isOnMute?: boolean;
  __rc_localHold?: boolean;
  __rc_isOnFlip?: boolean;
  __rc_isToVoicemail?: boolean;
  __rc_minimized?: boolean;
  __rc_isForwarded?: boolean;
  __rc_isOnTransfer?: boolean;
  __rc_isReplied?: boolean;
  __rc_recordStatus?: string;
  __rc_isStartedReply?: boolean;
  __rc_voicemailDropStatus?: string;
  __rc_originalRemoteNumber?: string;
  __rc_originalRemoteName?: string;
  __rc_isReceivedTransfer?: boolean;
  __rc_originalLocalNumber?: string;
  __rc_originalLocalName?: string;
  __rc_direction?: string;
  __rc_callStatus?: string;
  __rc_callId?: string;
  __rc_partyData?: unknown;
  startTime?: Date;
}
