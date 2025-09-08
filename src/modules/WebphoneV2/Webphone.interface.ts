import type InboundCallSession from 'ringcentral-web-phone-beta-2/dist/esm/call-session/inbound';
import type OutboundCallSession from 'ringcentral-web-phone-beta-2/dist/esm/call-session/outbound';
import type { WebPhoneOptions } from '@ringcentral-integration/commons/modules/Webphone/Webphone.interface';

import type { RingCentralClient } from '@ringcentral-integration/commons/lib/RingCentralClient';
import type { Alert } from '@ringcentral-integration/commons/modules/Alert';
import type { AvailabilityMonitor } from '@ringcentral-integration/commons/modules/AvailabilityMonitor';
import type { Brand } from '@ringcentral-integration/commons/modules/Brand';
import type { ExtensionFeatures } from '@ringcentral-integration/commons/modules/ExtensionFeatures';
import type { RegionSettings } from '@ringcentral-integration/commons/modules/RegionSettings';
import type { Auth } from '../Auth';
import type { AudioSettings } from '../AudioSettings';
import type { AppFeatures } from '../AppFeatures';
import type { ContactMatcher } from '../ContactMatcher';
import type { Storage } from '../Storage';
import type { TabManager } from '../TabManager';
import type { NumberValidate } from '../NumberValidate';

export interface Deps {
  prefix: string;
  alert: Alert;
  auth: Auth;
  client: RingCentralClient;
  numberValidate: NumberValidate;
  extensionFeatures: ExtensionFeatures;
  appFeatures: AppFeatures;
  brand: Brand;
  regionSettings: RegionSettings;
  audioSettings: AudioSettings;
  storage: Storage;
  availabilityMonitor?: AvailabilityMonitor;
  tabManager?: TabManager;
  contactMatcher?: ContactMatcher;
  webphoneOptions: WebPhoneOptions;
}

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
  __rc_isStartedReply: boolean;
  startTime: Date;
  id?: string;
}
