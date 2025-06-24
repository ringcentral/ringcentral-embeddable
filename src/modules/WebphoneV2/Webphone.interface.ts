import type InboundCallSession from 'ringcentral-web-phone-beta-2/dist/esm/call-session/inbound';
import type OutboundCallSession from 'ringcentral-web-phone-beta-2/dist/esm/call-session/outbound';

// extends InboundCallSession and OutboundCallSession
export interface WebphoneSession extends InboundCallSession, OutboundCallSession {
  __rc_extendedControls: string[];
  __rc_extendedControlStatus: string;
  __rc_creationTime: number;
  __rc_lastActiveTime: number;
  __rc_fromNumber: string;
  __rc_transferSessionId: string;
  __rc_contactMatch: any;
  __rc_isOnMute: boolean;
  __rc_localHold: boolean;
  __rc_isOnFlip: boolean;
  __rc_isToVoicemail: boolean;
  __rc_minimized: boolean;
  __rc_isForwarded: boolean;
  __rc_isOnTransfer: boolean;
  __rc_isReplied: boolean;
  __rc_recordStatus: string;
  startTime: Date;
}
