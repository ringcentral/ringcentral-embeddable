import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { debounce } from '@ringcentral-integration/commons/lib/debounce-throttle';
import type { Message } from '@ringcentral-integration/commons/interfaces/MessageStore.model';
import { messageIsTextMessage } from '@ringcentral-integration/commons/lib/messageHelper';
import normalizeNumber from '@ringcentral-integration/commons/lib/normalizeNumber';
import { callingModes } from '@ringcentral-integration/micro-phone/src/app/services/CallingSettings/callingModes';
import { callingOptions } from '@ringcentral-integration/micro-phone/src/app/services/CallingSettings/callingOptions';
import { format } from '@ringcentral-integration/utils';
import {
  action,
  globalStorage,
  injectable,
  optional,
  PortManager,
  RcModule,
  RouterPlugin,
  state,
  StoragePlugin,
  watch,
  delegate,
  Root,
} from '@ringcentral-integration/next-core';
import {
  AccountInfo,
  AppFeatures,
  Auth,
  Client,
  ExtensionInfo,
  OAuth,
  Presence,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  Brand,
  Locale,
  Theme,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ComposeText,
  ConversationLogger,
  Conversations,
  MessageThread,
  MessageStore,
  SmsTemplate,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  ActiveCallControl,
  AudioSettings,
  Call,
  CallLog,
  CallLogger,
  CallMonitor,
  CallingSettings,
  RingtoneConfiguration,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import { DialerView } from '@ringcentral-integration/micro-phone/src/app/views';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import type { CallAction } from '@ringcentral-integration/micro-phone/src/app/services/CallAction';
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';
import type { SyncTabView } from '@ringcentral-integration/micro-core/src/app/views';
import { presenceStatus } from '@ringcentral-integration/commons/enums/presenceStatus.enum';
import { dndStatus } from '@ringcentral-integration/commons/modules/Presence/dndStatus';
import { connectionStatus } from '@ringcentral-integration/commons/modules/Webphone/connectionStatus';
import callMonitorBarI18n from '@ringcentral-integration/widgets/components/CallMonitorBar/i18n';
import getPresenceStatusNameI18n from '@ringcentral-integration/widgets/lib/getPresenceStatusName/i18n';
import { getRcmEventTpl, getRcvEventTpl } from '@ringcentral-integration/widgets/lib/MeetingCalendarHelper';

import PopupWindowManager from '../../../lib/PopupWindowManager';
import messageTypes from '../../../lib/Adapter/messageTypes';
import { parseUri } from '../../../lib/Adapter/parseUri';
import { isDuplicated } from '../../../lib/isDuplicated';
import { SideWidgetView } from '../../views/SideWidgetView';
import type { AdapterOptions } from './AdapterOptions';
import { resolveLegacyAdapterPath } from './resolveLegacyAdapterPath';

import { SmartNotes } from '../SmartNotes';
import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';
import type { MatchedContactSelection } from '../MatchedContactSelection';
import type {
  MonitoredExtensions,
  PresenceActiveCall,
} from '../MonitoredExtensions';
import { SmsTypingTimeTracker } from '../SmsTypingTimeTracker';
import type { TabManager } from '../TabManager';
import type { ActiveCallControl as ActiveCallControlV2 } from '../ActiveCallControl';
import type { EmbeddableCallLogger } from '../CallLogger';
import type { Webphone as WebphoneV2 } from '../WebphoneV2/Webphone';
import { t as webphoneT } from '../WebphoneV2/i18n';
import { recordStatus } from '../WebphoneV2/recordStatus';

dayjs.extend(utc);
dayjs.extend(timezone);

type AdapterSize = {
  width: number;
  height: number;
};

type AdapterPosition = {
  translateX: number;
  translateY: number;
  minTranslateX: number;
  minTranslateY: number;
};

type PhoneNumberFormatType = 'national' | 'international' | 'custom';

type PhoneNumberFormatSetting = {
  formatType: PhoneNumberFormatType;
  template: string;
  readOnly: boolean;
  readOnlyReason: string;
};

type AttachmentPayload = {
  name?: string;
  content?: string;
};

type ControlCallOptions = {
  dtmf?: string;
  forwardNumber?: string;
  transferNumber?: string;
};

type LegacyPresenceData = {
  dndStatus?: string;
  presenceType?: string;
  userStatus?: string;
};

type LegacyPresence = Presence & {
  _update(data: {
    dndStatus?: string;
    userStatus?: string;
  }): Promise<void>;
};

const SUPPORTED_ATTACHMENT_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/svg+xml',
  'video/3gpp',
  'video/mp4',
  'video/mpeg',
  'video/msvideo',
  'audio/mpeg',
  'text/vcard',
  'application/zip',
  'application/gzip',
  'application/rtf',
]);

const CALLING_SETTINGS_NOTIFY_DEBOUNCE_MS = 1000;
const DIAL_PAD_TAB_ID = 'dialPadTabs';
const MEETING_TAB_ID = 'meetingTabs';
const STOP_RECORD_DISABLED_MESSAGE =
  'Sorry, stopping recording is not supported for this call. Please contact your account administrator to enable "Allow mute in auto recording".';

function dataURLtoBlob(dataUrl: string) {
  const arr = dataUrl.split(',');
  const mime = arr[0]?.match(/:(.*?);/)?.[1];
  if (!mime || !SUPPORTED_ATTACHMENT_MIME.has(mime)) {
    return null;
  }
  const bStr = atob(arr[1]);
  let n = bStr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bStr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function getValidAttachments(attachments: AttachmentPayload[] = []) {
  if (!attachments.length) {
    return [];
  }
  return attachments.reduce<
    {
      name: string;
      file: File;
      size: number;
    }[]
  >((result, attachment) => {
    if (
      !attachment ||
      typeof attachment.name !== 'string' ||
      typeof attachment.content !== 'string' ||
      !attachment.content.startsWith('data:') ||
      !attachment.content.includes(';base64,')
    ) {
      return result;
    }

    const blob = dataURLtoBlob(attachment.content);
    if (!blob) {
      return result;
    }

    const file = new File([blob], attachment.name, { type: blob.type });
    result.push({
      name: attachment.name,
      file,
      size: file.size,
    });
    return result;
  }, []);
}

function stripEnumPrefix(value?: string | null) {
  if (!value) {
    return value ?? null;
  }
  return value.replace(/^callingOptions-/, '').replace(/^callingModes-/, '');
}

function isSafeAudioUri(uri?: string) {
  if (!uri) {
    return false;
  }
  return (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('data:audio/')
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasResponseStatus(error: unknown, status: number): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return false;
  }
  const response = (error as { response?: { status?: number } }).response;
  return response?.status === status;
}

function normalizePhoneNumberFormatSetting(
  data: Partial<PhoneNumberFormatSetting>,
): PhoneNumberFormatSetting | null {
  const formatType = data.formatType;
  if (
    formatType !== 'national' &&
    formatType !== 'international' &&
    formatType !== 'custom'
  ) {
    return null;
  }

  const template =
    formatType === 'custom' && typeof data.template === 'string'
      ? data.template
      : '';

  if (formatType === 'custom' && !template.trim()) {
    return null;
  }

  return {
    formatType,
    template,
    readOnly: Boolean(data.readOnly),
    readOnlyReason:
      typeof data.readOnlyReason === 'string' ? data.readOnlyReason : '',
  };
}

function formatMeetingForm(meetingInfo: Record<string, any>, isRCV?: boolean) {
  if (!isRCV) {
    return meetingInfo;
  }
  return {
    name: meetingInfo.title,
    startTime: meetingInfo.schedule?.startTime,
    duration: meetingInfo.schedule?.durationInMinutes,
    allowJoinBeforeHost: meetingInfo.allowJoinBeforeHost,
    muteAudio: meetingInfo.muteAudio,
    muteVide: !meetingInfo.startParticipantsVideo,
    ...meetingInfo,
  };
}

function formatMeetingInfo(
  meetingInfo: any,
  brand: Brand,
  currentLocale: string,
  isRCV = false,
) {
  if (isRCV) {
    const { startTime, duration } = meetingInfo.meeting;
    return {
      topic: meetingInfo.meeting.name,
      location: meetingInfo.meeting.joinUri,
      timeFrom: dayjs.utc(startTime).format(),
      timeTo: dayjs.utc(startTime).add(duration, 'm').format(),
      details: getRcvEventTpl(meetingInfo, brand, currentLocale),
    };
  }

  const { schedule, meetingType } = meetingInfo.meeting;
  let timeFrom = null;
  let timeTo = null;
  if (schedule) {
    const startTime = schedule.startTime;
    const duration = schedule.durationInMinutes;
    timeFrom = dayjs.utc(startTime).format();
    timeTo = dayjs.utc(startTime).add(duration, 'm').format();
  }
  if (meetingType === 'Recurring') {
    timeFrom = dayjs.utc().format();
    timeTo = dayjs.utc().add(1, 'h').format();
  }
  return {
    topic: meetingInfo.meeting.topic,
    location: meetingInfo.meeting.links.joinUri,
    timeFrom,
    timeTo,
    details: getRcmEventTpl(meetingInfo, brand, currentLocale),
  };
}

@injectable({
  name: 'Adapter',
})
export class Adapter extends RcModule {
  private _messageTypes: Record<string, string>;
  private _popupWindowManager: PopupWindowManager | null = null;
  private _lastActiveCalls = new Map<string, string>();
  private _lastMuteStates = new Map<string, boolean>();
  private _lastMessageThreadSignatures = new Map<string, string>();
  private _lastMessageThreadEntitySignatures = new Map<string, string>();
  private _isMessageThreadSnapshotReady = false;
  private _isMessageThreadEntitySnapshotReady = false;
  private _lastTelephonySessionSequence = 0;
  private _bridgeBindingTimer: ReturnType<typeof setTimeout> | null = null;
  private _isClientBridgeBound = false;
  private _unbindClientBridge: (() => void) | null = null;
  private _debouncedNotifyCallingSettings = debounce({
    fn: () => {
      this._notifyCallingSettings();
    },
    threshold: CALLING_SETTINGS_NOTIFY_DEBOUNCE_MS,
  });
  private _customAlertGroup = 'rc-adapter-custom-alert';

  constructor(
    protected _root: Root,
    protected _storage: StoragePlugin,
    protected _portManager: PortManager,
    protected _router: RouterPlugin,
    protected _auth: Auth,
    protected _oAuth: OAuth,
    protected _accountInfo: AccountInfo,
    protected _extensionInfo: ExtensionInfo,
    protected _appFeatures: AppFeatures,
    protected _presence: Presence,
    protected _regionSettings: RegionSettings,
    protected _callingSettings: CallingSettings,
    protected _composeText: ComposeText,
    protected _call: Call,
    protected _webphone: Webphone,
    protected _callMonitor: CallMonitor,
    protected _activeCallControl: ActiveCallControl,
    protected _conversationLogger: ConversationLogger,
    protected _brand: Brand,
    protected _theme: Theme,
    protected _toast: Toast,
    protected _locale: Locale,
    protected _ringtoneConfiguration: RingtoneConfiguration,
    @optional('Prefix') protected _prefix?: string,
    @optional() protected _messageStore?: MessageStore,
    @optional() protected _dialerView?: DialerView,
    @optional() protected _callLog?: CallLog,
    @optional() protected _callLogger?: CallLogger,
    @optional() protected _callViewState?: CallViewState,
    @optional() protected _genericMeeting?: GenericMeeting,
    @optional() protected _smsTemplate?: SmsTemplate,
    @optional() protected _sideWidgetView?: SideWidgetView,
    @optional() protected _smartNotes?: SmartNotes,
    @optional('CallAction') protected _callAction?: CallAction,
    @optional('SyncTabView') protected _syncTabView?: SyncTabView,
    @optional()
    protected _smsTypingTimeTracker?: SmsTypingTimeTracker,
    @optional() protected _client?: Client,
    @optional() protected _audioSettings?: AudioSettings,
    @optional('TabManager') protected _tabManager?: TabManager,
    @optional() protected _contactMatcher?: ContactMatcher,
    @optional('MatchedContactSelection')
    protected _matchedContactSelection?: MatchedContactSelection,
    @optional() protected _conversations?: Conversations,
    @optional() protected _messageThread?: MessageThread,
    @optional('MonitoredExtensions')
    protected _monitoredExtensions?: MonitoredExtensions,
    @optional('AdapterOptions') protected _adapterOptions?: AdapterOptions,
  ) {
    super();
    if (this._smartNotes) {
      this._ignoreModuleReadiness(this._smartNotes);
    }
    this._storage.enable(this);
    this._messageTypes = messageTypes;
    this._setupClientBridge();
  }

  @globalStorage
  @state
  closed = false;

  @globalStorage
  @state
  minimized = false;

  @globalStorage
  @state
  size: AdapterSize = {
    width: 300,
    height: 540,
  };

  @globalStorage
  @state
  position: AdapterPosition = {
    translateX: 0,
    translateY: 0,
    minTranslateX: 0,
    minTranslateY: 0,
  };

  @globalStorage
  @state
  phoneNumberFormatSetting: PhoneNumberFormatSetting = {
    formatType: 'national',
    template: '',
    readOnly: false,
    readOnlyReason: '',
  };

  private get _webphoneV2() {
    return this._webphone as unknown as WebphoneV2 & {
      activeWebphoneId?: string | null;
      isWebphoneActiveTab?: boolean;
    };
  }

  private get _activeCallControlV2(): ActiveCallControlV2 {
    return this._activeCallControl as ActiveCallControlV2;
  }

  private get _appFeaturesV2(): EmbeddableAppFeatures {
    return this._appFeatures as EmbeddableAppFeatures;
  }

  @action
  private _setClosed(closed: boolean) {
    this.closed = closed;
  }

  @action
  private _setMinimized(minimized: boolean) {
    this.minimized = minimized;
  }

  @action
  private _setSize(size: Partial<AdapterSize>) {
    this.size = {
      width: size.width ?? this.size.width,
      height: size.height ?? this.size.height,
    };
  }

  @delegate('server')
  async setSize(size: Partial<AdapterSize>) {
    this._setSize(size);
  }

  @action
  private _setPosition(position: Partial<AdapterPosition>) {
    this.position = {
      translateX: position.translateX ?? this.position.translateX,
      translateY: position.translateY ?? this.position.translateY,
      minTranslateX: position.minTranslateX ?? this.position.minTranslateX,
      minTranslateY: position.minTranslateY ?? this.position.minTranslateY,
    };
  }

  @action
  private _setPhoneNumberFormatSetting(setting: PhoneNumberFormatSetting) {
    this.phoneNumberFormatSetting = setting;
  }

  private _setupClientBridge() {
    if (this._portManager.shared) {
      this._portManager.onClient(() => this._scheduleClientBridgeBinding());
      return;
    }
    this._scheduleClientBridgeBinding();
  }

  private _scheduleClientBridgeBinding(): () => void {
    if (!this._bridgeBindingTimer && !this._isClientBridgeBound) {
      this._bridgeBindingTimer = setTimeout(() => {
        this._bridgeBindingTimer = null;
        this._unbindClientBridge = this._bindClient();
      }, 0);
    }
    return () => this._teardownClientBridge();
  }

  private _teardownClientBridge(): void {
    if (this._bridgeBindingTimer) {
      clearTimeout(this._bridgeBindingTimer);
      this._bridgeBindingTimer = null;
    }
    this._unbindClientBridge?.();
    this._unbindClientBridge = null;
  }

  private _bindClient() {
    if (!globalThis.window || this._isClientBridgeBound) {
      return () => {};
    }
    this._isClientBridgeBound = true;

    const isPopupWindow =
      Boolean((window as any).__ON_RC_POPUP_WINDOW) ||
      ['1', 'true'].includes(parseUri(window.location.href).fromPopup || '');
    this._popupWindowManager = new PopupWindowManager({
      prefix: this._prefix,
      isPopupWindow,
    });

    window.addEventListener('message', this._onWindowMessage);
    this._captureMessageThreadSnapshots();
    this._lastTelephonySessionSequence =
      this._activeCallControlV2.telephonySessionUpdate?.sequence ?? 0;

    const multipleWatchOptions = { multiple: true } as const;
    const unwatchFns = [
      watch(
        this,
        () => this._root.expanded,
        () => {
          this._onWindowExpanded(this._root.expanded);
        }
      ),
      watch(
        this,
        () => this._watchAdapterStateValues(),
        () => {
          this._pushAdapterState();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchPresenceValues(),
        () => {
          this._pushPresence();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchCallBarValues(),
        () => {
          this._pushLocale();
          this._pushCalls();
          this._pushRingState();
          this._pushRouteState();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchRouteValues(),
        () => {
          this._pushRouteState();
          this._notifyRouteChanged();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchLoginStatusValues(),
        () => {
          this._notifyLoginStatus();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchRegionValues(),
        () => {
          this._notifyRegionSettings();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchCallingSettingsValues(),
        () => {
          this._debouncedNotifyCallingSettings();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchSmsSettingsValues(),
        () => {
          this._notifySmsSettings();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchCallLoggerAutoLogValues(),
        () => {
          this._notifyCallLoggerAutoLogSetting();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchConversationLoggerAutoLogValues(),
        () => {
          this._notifyConversationLoggerAutoLogSetting();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchDialerStatusValues(),
        () => {
          this._notifyDialerStatus();
        },
      ),
      watch(
        this,
        () => this._watchMeetingStatusValues(),
        () => {
          this._notifyMeetingStatus();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchBrandValues(),
        () => {
          this._notifyBrandAssets();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._theme.themeType,
        () => {
          this._notifyTheme();
        },
      ),
      watch(
        this,
        () => this._watchWebphoneStatusValues(),
        () => {
          this._notifyWebphoneStatus();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchCallLogSyncValues(),
        () => {
          this._notifyCallHistorySynced();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._presence.activeCalls,
        () => {
          this._notifyPresenceActiveCalls();
        },
      ),
      watch(
        this,
        () => this._webphone.sessions,
        () => {
          this._notifyMuteChanges();
        },
      ),
      watch(
        this,
        () => this._watchPhoneNumberFormatSettingsValues(),
        () => {
          this._notifyPhoneNumberFormatSettings();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => this._watchSmartNotesSettingsValues(),
        () => {
          this._notifySmartNotesSettings();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () => [
          this._messageThread?.data.threads,
          this._messageThread?.data.messages,
        ],
        () => {
          this._notifyMessageThreadUpdates();
        },
        multipleWatchOptions,
      ),
      watch(
        this,
        () =>
          this._activeCallControlV2.telephonySessionUpdate?.sequence ?? 0,
        () => {
          this._notifyTelephonySessionUpdate();
        },
      ),
    ];

    this._bindWebphoneEvents();
    this._bindMessageEvents();

    this._pushAdapterState();
    this._onWindowExpanded(this._root.expanded);
    this._pushPresence();
    this._pushLocale();
    this._pushCalls();
    this._pushRingState();
    this._pushRouteState();
    this._notifyRouteChanged();
    this._notifyLoginStatus();
    this._notifyRegionSettings();
    this._notifyCallingSettings();
    this._notifySmsSettings();
    this._notifyAutoLogSettings();
    this._notifyDialerStatus();
    this._notifyMeetingStatus();
    this._notifyBrandAssets();
    this._notifyTheme();
    this._notifyWebphoneStatus();
    this._notifyPhoneNumberFormatSettings();
    this._notifySmartNotesSettings();
    this._syncWebphoneSessions();

    return () => {
      this._isClientBridgeBound = false;
      this._debouncedNotifyCallingSettings.cancel();
      window.removeEventListener('message', this._onWindowMessage);
      unwatchFns.forEach((fn) => fn?.());
    };
  }

  private _bindWebphoneEvents() {
    this._webphoneV2.onCallRing((session: NormalizedSession) => {
      this._postMessage({
        type: 'rc-call-ring-notify',
        call: this._withContactMatch(session),
      });
      this._sideWidgetView?.onCallRing(session);
    });
    this._webphoneV2.onCallInit((session: NormalizedSession) => {
      this._postMessage({
        type: 'rc-call-init-notify',
        call: this._withContactMatch(session),
      });
      this._sideWidgetView?.onCallInit(session);
    });
    this._webphoneV2.onCallStart((session: any) => {
      this._postMessage({
        type: 'rc-call-start-notify',
        call: this._withContactMatch(session),
      });
    });
    this._webphoneV2.onCallEnd((session: any) => {
      this._postMessage({
        type: 'rc-call-end-notify',
        call: {
          ...this._withContactMatch(session),
          endTime: Date.now(),
        },
      });
      this._sideWidgetView?.onCallEnd(session);
    });
    this._webphoneV2.onCallHold((session: any) => {
      this._postMessage({
        type: 'rc-call-hold-notify',
        call: this._withContactMatch(session),
      });
    });
    this._webphoneV2.onCallResume((session: any) => {
      this._postMessage({
        type: 'rc-call-resume-notify',
        call: this._withContactMatch(session),
      });
    });
    this._webphoneV2.onActiveWebphoneChanged((payload: any) => {
      this._postMessage({
        type: 'rc-webphone-active-notify',
        ...payload,
      });
    });
    this._webphoneV2.onCallVoicemailDropped((session: any) => {
      this._postMessage({
        type: 'rc-call-drop-voicemail-notify',
        call: this._withContactMatch(session),
      });
    });

    this._postMessage({
      type: 'rc-webphone-active-notify',
      activeId: this._webphoneV2.activeWebphoneId ?? null,
      currentActive: Boolean(this._webphoneV2.isWebphoneActiveTab),
    });
  }

  private _bindMessageEvents() {
    this._messageStore?.newInboundMessage$.subscribe((message) => {
      if (
        isDuplicated(
          `${this._prefix ?? 'rc-widget'}-deduplicate-inbound-message-event`,
          String(message.id),
        )
      ) {
        return;
      }
      this._postMessage({
        type: 'rc-inbound-message-notify',
        message,
      });
    });
    this._messageStore?.onMessageUpdated((message) => {
      if (
        isDuplicated(
          `${this._prefix ?? 'rc-widget'}-deduplicate-message-updated-event`,
          `${message.id}-${message.lastModifiedTime}`,
          30,
        )
      ) {
        return;
      }
      this._postMessage({
        type: 'rc-message-updated-notify',
        message,
      });
    });
  }

  private _withContactMatch(
    session: NormalizedSession,
  ): NormalizedSession & { contactMatch?: unknown } {
    if (session.contactMatch) {
      return session;
    }
    const phoneNumber =
      session.direction === 'Outbound' ? session.to : session.from;
    const contactMatch = phoneNumber
      ? this._contactMatcher?.dataMapping[phoneNumber]?.[0]
      : undefined;
    return contactMatch ? { ...session, contactMatch } : session;
  }

  private _captureMessageThreadSnapshots(): void {
    this._lastMessageThreadSignatures = this._getMessageThreadSignatures();
    this._lastMessageThreadEntitySignatures =
      this._getMessageThreadEntitySignatures();
    this._isMessageThreadSnapshotReady = Boolean(this._messageThread?.token);
    this._isMessageThreadEntitySnapshotReady = Boolean(
      this._messageThread?.entriesToken,
    );
  }

  private _getMessageThreadSignatures(): Map<string, string> {
    const signatures = new Map<string, string>();
    Object.entries(this._messageThread?.data.threads ?? {}).forEach(
      ([threadId, thread]) => {
        if (thread.threadInfo) {
          signatures.set(threadId, JSON.stringify(thread.threadInfo));
        }
      },
    );
    return signatures;
  }

  private _getMessageThreadEntitySignatures(): Map<string, string> {
    return new Map(
      Object.entries(this._messageThread?.data.messages ?? {}).map(
        ([entityId, entity]) => [entityId, JSON.stringify(entity)],
      ),
    );
  }

  private _notifyMessageThreadUpdates(): void {
    const threads = this._messageThread?.data.threads ?? {};
    const threadSignatures = this._getMessageThreadSignatures();
    if (!this._messageThread?.token) {
      this._isMessageThreadSnapshotReady = false;
    } else if (this._isMessageThreadSnapshotReady) {
      threadSignatures.forEach((signature, threadId) => {
        if (this._lastMessageThreadSignatures.get(threadId) === signature) {
          return;
        }
        const thread = threads[threadId]?.threadInfo;
        if (thread) {
          this._postMessage({ type: 'rc-message-thread-notify', thread });
        }
      });
    } else {
      this._isMessageThreadSnapshotReady = true;
    }
    this._lastMessageThreadSignatures = threadSignatures;
    const entities = this._messageThread?.data.messages ?? {};
    const entitySignatures = this._getMessageThreadEntitySignatures();
    if (!this._messageThread?.entriesToken) {
      this._isMessageThreadEntitySnapshotReady = false;
    } else if (this._isMessageThreadEntitySnapshotReady) {
      entitySignatures.forEach((signature, entityId) => {
        if (
          this._lastMessageThreadEntitySignatures.get(entityId) === signature
        ) {
          return;
        }
        const entity = entities[entityId];
        if (entity) {
          this._postMessage({
            type: 'rc-message-thread-entity-notify',
            entity,
          });
        }
      });
    } else {
      this._isMessageThreadEntitySnapshotReady = true;
    }
    this._lastMessageThreadEntitySignatures = entitySignatures;
  }

  private _notifyTelephonySessionUpdate(): void {
    const update = this._activeCallControlV2.telephonySessionUpdate;
    if (!update || update.sequence === this._lastTelephonySessionSequence) {
      return;
    }
    this._lastTelephonySessionSequence = update.sequence;
    if (!update.session || this._shouldSuppressCallEvent()) {
      return;
    }
    this._postMessage({
      type: 'rc-telephony-session-notify',
      telephonySession: update.session,
    });
  }

  private _shouldSuppressCallEvent(): boolean {
    return Boolean(
      this._adapterOptions?.disableInactiveTabCallEvent &&
        this._tabManager?.ready &&
        !this._tabManager.active,
    );
  }

  private _onWindowMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data?.type) {
      return;
    }

    switch (data.type) {
      case this._messageTypes.syncClosed:
        this._setClosed(Boolean(data.closed));
        break;
      case this._messageTypes.syncMinimized:
        this._setMinimized(Boolean(data.minimized));
        break;
      case this._messageTypes.syncSize:
        if (data.size) {
          console.log('🐞 ~ _onWindowMessage ~ data.size:', data.size);
          this._setSize(data.size);
        }
        break;
      case this._messageTypes.syncPosition:
        if (data.position) {
          this._setPosition(data.position);
        }
        break;
      case this._messageTypes.presenceItemClicked:
        if (data.presenceType) {
          void this._presence.setPresence(data.presenceType);
        }
        break;
      case this._messageTypes.navigateToCurrentCall:
        void this._navigateToCurrentCall();
        break;
      case this._messageTypes.navigateToViewCalls:
        void this._navigateToViewCalls();
        break;
      case this._messageTypes.popOut:
        this._showClientWindow();
        break;
      case 'rc-adapter-set-environment':
        (window as any).toggleEnv?.();
        break;
      case 'rc-adapter-new-sms':
        void this._newSMS(
          data.phoneNumber,
          data.text,
          data.conversation,
          data.attachments,
          data.recipient,
        );
        break;
      case 'rc-adapter-new-call':
        void this._newCall(data.phoneNumber, data.toCall, data.callerId);
        break;
      case 'rc-adapter-auto-populate-conversation':
        void this._autoPopulateConversation(data.text, data.attachments);
        break;
      case 'rc-adapter-control-call':
        void this._controlCall(data.callAction, data.callId, data.options);
        break;
      case 'rc-adapter-pick-call':
        void this._pickCall(data.extensionId, data.telephonySessionId);
        break;
      case 'rc-adapter-logout':
        if (this._auth.loggedIn) {
          void this._auth.logout({ reason: 'Manually sign out' });
        }
        break;
      case 'rc-adapter-login':
        if (!this._auth.loggedIn) {
          this._oAuth.openOAuthPage();
        }
        break;
      case 'rc-calling-settings-update':
        void this._updateCallingSettings(data);
        break;
      case 'rc-sms-settings-update':
        void this._updateSmsSettings(data);
        break;
      case 'rc-adapter-message-request':
        void this._handleRCAdapterMessageRequest(data);
        break;
      case 'rc-adapter-navigate-to':
        if (data.path) {
          void this._navigateTo(data.path);
        }
        break;
      case 'rc-adapter-set-presence':
        void this._setPresence(data);
        break;
      case 'rc-adapter-webphone-sessions-sync':
        this._syncWebphoneSessions();
        break;
      case 'rc-adapter-update-ringtone':
        void this._updateRingtone(data);
        break;
      case 'rc-adapter-update-auto-log-settings':
        this._onUpdateAutoLogSettings(data);
        break;
      case 'rc-adapter-update-features-flags':
        void this._onUpdateFeatureConfig(data);
        break;
      case 'rc-adapter-update-sms-typing-time-tracking':
        this._onUpdateSmsTypingTimeTracking(data);
        break;
      case 'rc-adapter-update-ai-assistant-settings':
        this._onUpdateAiAssistantSettings(data);
        break;
      case 'rc-adapter-set-side-drawer-extended':
        void this._root.setExpanded(Boolean(data.extended));
        break;
      case 'rc-adapter-set-call-contact-matches-select':
        void this._setCallContactMatched(data);
        break;
      case 'rc-adapter-set-phone-number-format':
        this._onSetPhoneNumberFormat(data);
        break;
      default:
        break;
    }
  };

  private async _handleRCAdapterMessageRequest(data: {
    requestId: string;
    path: string;
    body?: any;
    alertLevel?: string;
    alertMessage?: string;
    ttl?: number;
  }) {
    if (!data.path) {
      return;
    }

    switch (data.path) {
      case '/schedule-meeting': {
        if (
          !this._genericMeeting ||
          !this._genericMeeting.ready ||
          !this._appFeatures.hasMeetingsPermission
        ) {
          this._postRCAdapterMessageResponse({
            responseId: data.requestId,
            response: { error: 'meeting service is unavailable' },
          });
          break;
        }

        const response = await this._genericMeeting.schedule(
          formatMeetingForm(data.body, this._genericMeeting.isRCV),
        );

        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: response
            ? {
                meeting: formatMeetingInfo(
                  response,
                  this._brand,
                  this._locale.currentLocale,
                  this._genericMeeting.isRCV,
                ),
              }
            : { error: 'schedule failed' },
        });
        break;
      }
      case '/check-popup-window': {
        let response = await this._popupWindowManager?.checkPopupWindowOpened();
        if (response && data.body?.alert) {
          this._toast.warning({
            message: 'Popup window is already opened.',
            allowDuplicates: false,
            group: this._customAlertGroup,
          });
        }
        if (!response && this._webphone.sessions.length > 0) {
          response = true;
          if (data.body?.alert) {
            this._toast.warning({
              message: 'Cannot open popup window while calls are active.',
              allowDuplicates: false,
              group: this._customAlertGroup,
            });
          }
        }
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: Boolean(response),
        });
        break;
      }
      case '/custom-alert-message': {
        const response = this._openCustomAlert({
          ...data.body,
          level: data.alertLevel || data.body?.level,
          message: data.alertMessage || data.body?.message,
          ttl: data.ttl || data.body?.ttl,
        });
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response,
        });
        break;
      }
      case '/dismiss-alert-message': {
        await this._dismissCustomAlert(data.body?.id);
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: 'ok',
        });
        break;
      }
      case '/create-sms-template': {
        if (!this._smsTemplate) {
          this._postRCAdapterMessageResponse({
            responseId: data.requestId,
            response: 'sms template service is unavailable',
          });
          break;
        }
        const result = await this._smsTemplate.createTemplate({
          title: data.body?.displayName,
          content: data.body?.text,
        });
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: result === true ? 'ok' : result || 'create template failed',
        });
        break;
      }
      case '/unlogged-calls': {
        const callLogger = this._callLogger as
          | EmbeddableCallLogger
          | undefined;
        if (!callLogger) {
          this._postRCAdapterMessageResponse({
            responseId: data.requestId,
            response: { error: 'call logger is unavailable' },
          });
          break;
        }
        const { calls, hasMore } = await callLogger.getRecentUnloggedCalls({
          perPage: data.body?.perPage,
          page: data.body?.page,
        });
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: { calls, hasMore },
        });
        break;
      }
      case '/get-call-log': {
        if (!data.body?.sessionId && !data.body?.telephonySessionId) {
          this._postRCAdapterMessageResponse({
            responseId: data.requestId,
            response: {
              error: 'sessionId or telephonySessionId is required',
            },
          });
          break;
        }
        const callLogger = this._callLogger as
          | EmbeddableCallLogger
          | undefined;
        const call = callLogger
          ? await callLogger.getCall(
              data.body.sessionId,
              data.body.telephonySessionId,
            )
          : null;
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: {
            call,
          },
        });
        break;
      }
      case '/refresh-login-session': {
        const response = await this._refreshLoginSession(
          Boolean(data.body?.force),
        );
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response,
        });
        break;
      }
      default: {
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: { data: 'no matched path' },
        });
      }
    }
  }

  private _getLocaleStrings() {
    const currentLocale = this._locale.currentLocale;
    const ringingCallsLength = this._callMonitor.activeRingCalls.length;
    const onHoldCallsLength = this._callMonitor.activeOnHoldCalls.length;
    const otherDeviceCallsLength = this._callMonitor.otherDeviceCalls.length;

    const ringCallsInfo =
      ringingCallsLength === 1
        ? format(callMonitorBarI18n.getString('incomingCall', currentLocale), {
            numberOf: ringingCallsLength,
          })
        : format(callMonitorBarI18n.getString('incomingCalls', currentLocale), {
            numberOf: ringingCallsLength,
          });

    const onHoldCallsInfo =
      onHoldCallsLength === 1
        ? format(callMonitorBarI18n.getString('callOnHold', currentLocale), {
            numberOf: onHoldCallsLength,
          })
        : format(callMonitorBarI18n.getString('callsOnHold', currentLocale), {
            numberOf: onHoldCallsLength,
          });

    const otherDeviceCallsInfo =
      otherDeviceCallsLength === 1
        ? format(callMonitorBarI18n.getString('otherDeviceCall', currentLocale), {
            numberOf: otherDeviceCallsLength,
          })
        : format(
            callMonitorBarI18n.getString('otherDeviceCalls', currentLocale),
            {
              numberOf: otherDeviceCallsLength,
            },
          );

    return {
      currentCallBtn: callMonitorBarI18n.getString('currentCall', currentLocale),
      viewCallsBtn: callMonitorBarI18n.getString('viewCalls', currentLocale),
      ringCallsInfo,
      onHoldCallsInfo,
      otherDeviceCallsInfo,
      availableBtn: getPresenceStatusNameI18n.getString(
        presenceStatus.available,
        currentLocale,
      ),
      busyBtn: getPresenceStatusNameI18n.getString(
        presenceStatus.busy,
        currentLocale,
      ),
      offlineBtn: getPresenceStatusNameI18n.getString(
        presenceStatus.offline,
        currentLocale,
      ),
      doNotAcceptAnyCallsBtn: getPresenceStatusNameI18n.getString(
        dndStatus.doNotAcceptAnyCalls,
        currentLocale,
      ),
    };
  }

  private _getEffectiveWidgetPath() {
    const currentPath = this._router.currentPath;
    if (currentPath === '/dialer') {
      const activeTab = this._syncTabView?.getActive(DIAL_PAD_TAB_ID);
      if (activeTab === 'calls') {
        return '/history';
      }
      if (activeTab === 'voicemail') {
        return '/messages/voicemail';
      }
      return '/dialer';
    }
    if (currentPath === '/meeting') {
      const activeTab = this._syncTabView?.getActive(MEETING_TAB_ID);
      if (activeTab === 'history') {
        return '/meeting/history';
      }
      if (activeTab === 'recordings') {
        return '/meeting/history/recordings';
      }
      return '/meeting/home';
    }
    if (currentPath !== '/calling') {
      return currentPath;
    }

    const callView = this._callViewState?.view;
    if (callView === 'callList' || callView === 'hidden') {
      return '/history';
    }
    if (callView === 'activeCall' || callView === 'addCall' || callView === 'postCall') {
      return '/calling';
    }

    const hasCallContext =
      this._callMonitor.activeRingCalls.length > 0 ||
      this._callMonitor.activeOnHoldCalls.length > 0 ||
      this._callMonitor.activeCurrentCalls.length > 0;

    return hasCallContext ? '/calling' : '/history';
  }

  private _watchAdapterStateValues() {
    return [
      this.closed,
      this.minimized,
      this.size.width,
      this.size.height,
      this.position.translateX,
      this.position.translateY,
      this.position.minTranslateX,
      this.position.minTranslateY,
      this._auth.loggedIn,
      this._presence.telephonyStatus,
      this._presence.userStatus,
      this._presence.dndStatus,
    ];
  }

  private _watchPresenceValues() {
    return [
      this._auth.loggedIn,
      this._presence.telephonyStatus,
      this._presence.userStatus,
      this._presence.dndStatus,
      this._getPresenceOption(),
    ];
  }

  private _watchCallBarValues() {
    return [
      this._locale.currentLocale,
      this._callMonitor.activeRingCalls,
      this._callMonitor.activeOnHoldCalls,
      this._callMonitor.otherDeviceCalls,
      this._callMonitor.activeCurrentCalls,
      this._callingSettings.callingMode,
      this._webphone.ringSessionId,
      this._presence.telephonyStatus,
    ];
  }

  private _watchRouteValues() {
    return [
      this._router.currentPath,
      this._syncTabView?.getActive(DIAL_PAD_TAB_ID),
      this._syncTabView?.getActive(MEETING_TAB_ID),
      this._callViewState?.view,
      this._callMonitor.activeCurrentCalls,
      this._callMonitor.activeRingCalls,
      this._callMonitor.activeOnHoldCalls,
    ];
  }

  private _watchLoginStatusValues() {
    if (!this._auth.ready) {
      return ['pending'];
    }
    if (
      this._auth.loggedIn &&
      (!this._extensionInfo.ready || !this._accountInfo.ready || !this._appFeatures.ready)
    ) {
      return ['pending', this._auth.loggedIn];
    }

    const extensionNumber =
      this._extensionInfo.extensionNumber &&
      this._extensionInfo.extensionNumber !== '0'
        ? this._extensionInfo.extensionNumber
        : null;

    return [
      'ready',
      this._auth.loggedIn,
      this._auth.loggedIn ? this._accountInfo.mainCompanyNumber : null,
      this._auth.loggedIn ? extensionNumber : null,
      this._auth.loggedIn
        ? this._accountInfo.serviceInfo?.contractedCountry?.isoCode ?? null
        : null,
      this._auth.loggedIn
        ? Boolean(this._extensionInfo.info?.permissions?.admin?.enabled)
        : false,
      this._auth.loggedIn ? this._appFeatures.hasOutboundSMSPermission : false,
      this._auth.loggedIn ? this._appFeatures.hasMeetingsPermission : false,
      this._auth.loggedIn ? this._appFeatures.hasGlipPermission : false,
      this._auth.loggedIn ? this._appFeatures.hasSmartNotePermission : false,
      this._auth.loggedIn ? this._appFeatures.isCallingEnabled : false,
      this._auth.isFreshLogin,
    ];
  }

  private _watchRegionValues() {
    return [
      this._regionSettings.ready,
      this._regionSettings.countryCode,
      this._regionSettings.areaCode,
    ];
  }

  private _watchCallingSettingsValues() {
    return [
      this._callingSettings.ready,
      this._callingSettings.data,
      this._callingSettings.myPhoneNumbers,
      this._callingSettings.availableNumbersWithLabel
    ];
  }

  private _watchSmsSettingsValues() {
    return [
      this._composeText.ready,
      this._composeText.senderNumber,
      this._composeText.senderNumbersList,
    ];
  }

  private _watchCallLoggerAutoLogValues() {
    return [
      this._callLogger.ready,
      this._callLogger.autoLog,
    ];
  }

  private _watchConversationLoggerAutoLogValues() {
    return [
      this._conversationLogger.ready,
      this._conversationLogger.autoLog,
    ];
  }

  private _watchDialerStatusValues() {
    return (
      this._dialerView.showSpinner ||
      this._dialerView.isCallButtonDisabled
    );
  }

  private _watchMeetingStatusValues() {
    return [
      this._genericMeeting?.ready,
      this._appFeatures.hasMeetingsPermission,
    ];
  }

  private _watchBrandValues() {
    return [
      this._brand.brandConfig?.assets?.logo,
      this._brand.brandConfig?.assets?.icon,
    ];
  }

  private _watchThemeValue() {
    return this._theme.themeType || '';
  }

  private _watchWebphoneStatusValues() {
    return [
      this._webphone.connectionStatus,
      this._webphone.device,
    ];
  }

  private _watchCallLogSyncValues() {
    return [
      this._callLog.ready,
      this._callLog.timestamp,
    ];
  }

  private _watchSmartNotesSettingsValues() {
    return [
      this._smartNotes?.showSmartNote,
      this._smartNotes?.autoStartSmartNote,
    ];
  }

  private _watchPhoneNumberFormatSettingsValues() {
    return [
      this.phoneNumberFormatSetting.formatType,
      this.phoneNumberFormatSetting.template,
    ];
  }

  private _pushAdapterState() {
    this._postMessage({
      type: this._messageTypes.pushAdapterState,
      size: this.size,
      minimized: this.minimized,
      closed: this.closed,
      position: this.position,
      telephonyStatus: (this._auth.loggedIn && this._presence.telephonyStatus) || null,
      userStatus: (this._auth.loggedIn && this._presence.userStatus) || null,
      dndStatus: (this._auth.loggedIn && this._presence.dndStatus) || null,
    });
  }

  private _pushPresence() {
    this._postMessage({
      type: this._messageTypes.syncPresence,
      telephonyStatus: (this._auth.loggedIn && this._presence.telephonyStatus) || null,
      userStatus: (this._auth.loggedIn && this._presence.userStatus) || null,
      dndStatus: (this._auth.loggedIn && this._presence.dndStatus) || null,
      presenceOption: (this._auth.loggedIn && this._getPresenceOption()) || null,
    });
  }

  private _getPresenceOption(): string {
    if (this._presence.dndStatus === dndStatus.doNotAcceptAnyCalls) {
      return dndStatus.doNotAcceptAnyCalls;
    }
    if (this._presence.userStatus === presenceStatus.busy) {
      return presenceStatus.busy;
    }
    if (this._presence.userStatus === presenceStatus.offline) {
      return presenceStatus.offline;
    }
    return presenceStatus.available;
  }

  private _pushLocale() {
    this._postMessage({
      type: this._messageTypes.pushLocale,
      locale: this._locale.currentLocale,
      strings: this._getLocaleStrings(),
    });
  }

  private _pushCalls() {
    this._postMessage({
      type: this._messageTypes.pushCalls,
      ringingCallsLength: this._callMonitor.activeRingCalls.length,
      onHoldCallsLength: this._callMonitor.activeOnHoldCalls.length,
      otherDeviceCallsLength: this._callMonitor.otherDeviceCalls.length,
      currentStartTime: this._callMonitor.activeCurrentCalls[0]?.startTime || 0,
    });
  }

  private _pushRingState() {
    const ringing =
      this._callingSettings.callingMode === callingModes.webphone
        ? Boolean(this._webphone.ringSessionId)
        : this._presence.telephonyStatus === 'Ringing';

    this._postMessage({
      type: this._messageTypes.pushRingState,
      ringing,
    });
  }

  private _pushRouteState() {
    const effectivePath = this._getEffectiveWidgetPath();
    this._postMessage({
      type: this._messageTypes.pushOnCurrentCallPath,
      onCurrentCallPath: effectivePath === '/calling',
    });
    this._postMessage({
      type: this._messageTypes.pushOnAllCallsPath,
      onAllCallsPath: effectivePath === '/history',
    });
  }

  private _notifyRouteChanged() {
    this._postMessage({
      type: 'rc-route-changed-notify',
      path: this._getEffectiveWidgetPath(),
    });
  }

  private _notifyLoginStatus() {
    if (!this._auth.ready) {
      return;
    }
    if (
      this._auth.loggedIn &&
      (!this._extensionInfo.ready || !this._accountInfo.ready || !this._appFeatures.ready)
    ) {
      return;
    }

    const extensionNumber =
      this._extensionInfo.extensionNumber &&
      this._extensionInfo.extensionNumber !== '0'
        ? this._extensionInfo.extensionNumber
        : null;

    this._postMessage({
      type: 'rc-login-status-notify',
      loggedIn: this._auth.loggedIn,
      loginNumber:
        this._auth.loggedIn && this._accountInfo.mainCompanyNumber
          ? [this._accountInfo.mainCompanyNumber, extensionNumber].join('*')
          : undefined,
      contractedCountryCode:
        this._accountInfo.serviceInfo?.contractedCountry?.isoCode,
      admin:
        this._extensionInfo.info?.permissions?.admin?.enabled || false,
      features: this._auth.loggedIn
        ? {
            sms: this._appFeatures.hasOutboundSMSPermission,
            meeting: this._appFeatures.hasMeetingsPermission,
            glip: this._appFeatures.hasGlipPermission,
            smartNote: this._appFeatures.hasSmartNotePermission,
            call: this._appFeatures.isCallingEnabled,
            ringSenseInsights:
              this._appFeaturesV2.hasRingSenseInsightsPermission,
            ringCX: this._appFeaturesV2.hasRingCXPermission,
          }
        : {},
      isFreshLogin: this._auth.isFreshLogin,
    });
  }

  private _notifyRegionSettings() {
    if (!this._regionSettings.ready) {
      return;
    }

    const showAreaCode =
      this._regionSettings.countryCode === 'US' ||
      this._regionSettings.countryCode === 'CA';

    this._postMessage({
      type: 'rc-region-settings-notify',
      countryCode: this._regionSettings.countryCode,
      areaCode: showAreaCode ? this._regionSettings.areaCode : '',
    });
  }

  private _notifyCallingSettings() {
    if (!this._callingSettings.ready) {
      return;
    }

    const message: Record<string, unknown> = {
      type: 'rc-calling-settings-notify',
      callWith: stripEnumPrefix(this._callingSettings.callWith),
      callingMode: stripEnumPrefix(this._callingSettings.callingMode),
    };
    if (
      this._adapterOptions?.enableFromNumberSetting &&
      (this._callingSettings.callWith === callingOptions.browser ||
        this._callingSettings.callWith === callingOptions.ringout)
    ) {
      message.fromNumber = this._callingSettings.fromNumber;
      message.fromNumbers = this._callingSettings.fromNumbers.map(
        (item: {
          label?: string;
          phoneNumber?: string;
          primary?: boolean;
          usageType?: string;
        }) => ({
          phoneNumber: item.phoneNumber,
          usageType: item.usageType,
          primary: item.primary,
          label: item.label,
        }),
      );
    }
    if (this._adapterOptions?.showMyLocationNumbers) {
      message.myLocation = this._callingSettings.myLocation;
      message.myLocationNumbers =
        this._callingSettings.availableNumbersWithLabel;
    }
    this._postMessage(message);
  }

  private _notifySmsSettings() {
    if (
      !this._adapterOptions?.enableSmsSettingEvent ||
      !this._composeText.ready
    ) {
      return;
    }

    this._postMessage({
      type: 'rc-sms-settings-notify',
      senderNumber: this._composeText.senderNumber,
      senderNumbers: this._composeText.senderNumbersList.map((item: any) => ({
        phoneNumber: item.phoneNumber,
        usageType: item.usageType,
        type: item.type,
        features: item.features,
        label: item.label,
      })),
    });
  }

  private _notifyAutoLogSettings() {
    this._notifyCallLoggerAutoLogSetting();
    this._notifyConversationLoggerAutoLogSetting();
  }

  private _notifyCallLoggerAutoLogSetting() {
    if (!this._callLogger?.ready) {
      return;
    }
    this._postMessage({
      type: 'rc-callLogger-auto-log-notify',
      autoLog: this._callLogger.autoLog,
    });
  }

  private _notifyConversationLoggerAutoLogSetting() {
    if (!this._conversationLogger.ready) {
      return;
    }
    this._postMessage({
      type: 'rc-messageLogger-auto-log-notify',
      autoLog: this._conversationLogger.autoLog,
    });
  }

  private _notifyDialerStatus() {
    const ready = !(
      this._dialerView?.showSpinner || this._dialerView?.isCallButtonDisabled
    );
    this._postMessage({
      type: 'rc-dialer-status-notify',
      ready,
    });
  }

  private _notifyMeetingStatus() {
    this._postMessage({
      type: 'rc-meeting-status-notify',
      ready: Boolean(this._genericMeeting?.ready),
      permission: this._appFeatures.hasMeetingsPermission,
    });
  }

  private _notifyBrandAssets() {
    this._postMessage({
      type: 'rc-brand-assets-notify',
      logoUri: this._brand.brandConfig?.assets?.logo,
      iconUri: this._brand.brandConfig?.assets?.icon,
    });
  }

  private _notifyTheme() {
    this._postMessage({
      type: 'rc-adapter-theme-notify',
      theme: this._theme.themeType,
    });
  }

  private _notifyWebphoneStatus() {
    this._postMessage({
      type: 'rc-webphone-connection-status-notify',
      // Hosts match against the documented `connectionStatus-*` values, while
      // the webphone module keeps the status unprefixed internally.
      connectionStatus:
        connectionStatus[this._webphone.connectionStatus] ??
        this._webphone.connectionStatus,
      deviceId: this._webphone.device?.id ?? null,
    });
  }

  private _notifyCallHistorySynced() {
    if (!this._callLog?.ready || !this._callLog.timestamp) {
      return;
    }
    this._postMessage({
      type: 'rc-call-history-synced-notify',
    });
  }

  private _notifyPresenceActiveCalls() {
    if (this._shouldSuppressCallEvent()) {
      this._lastActiveCalls = new Map(
        (this._presence.activeCalls || []).map((call) => [
          `${call.sessionId}${call.direction}`,
          `${call.telephonyStatus ?? ''}|${call.terminationType ?? ''}`,
        ]),
      );
      return;
    }
    const nextMap = new Map<string, string>();
    (this._presence.activeCalls || []).forEach((call: any) => {
      const key = `${call.sessionId}${call.direction}`;
      const signature = `${call.telephonyStatus ?? ''}|${call.terminationType ?? ''}`;
      nextMap.set(key, signature);
      if (this._lastActiveCalls.get(key) === signature) {
        return;
      }

      const activeCall = { ...call };
      Reflect.deleteProperty(activeCall, 'id');
      Reflect.deleteProperty(activeCall, 'sipData');
      this._postMessage({
        type: 'rc-active-call-notify',
        call: activeCall,
      });

      if (this._callingSettings.callingMode === callingModes.ringout) {
        const ringoutCall = { ...call };
        Reflect.deleteProperty(ringoutCall, 'id');
        this._postMessage({
          type: 'rc-ringout-call-notify',
          call: ringoutCall,
        });
      }
    });
    this._lastActiveCalls = nextMap;
  }

  private _notifyMuteChanges() {
    const nextMap = new Map<string, boolean>();
    this._webphone.sessions.forEach((session: any) => {
      const currentMuted = Boolean(session.isOnMute);
      nextMap.set(session.id, currentMuted);
      if (this._lastMuteStates.get(session.id) === currentMuted) {
        return;
      }
      this._postMessage({
        type: 'rc-call-mute-notify',
        call: {
          ...this._withContactMatch(session),
          isOnMute: currentMuted,
        },
      });
    });
    this._lastMuteStates = nextMap;
  }

  private _notifyPhoneNumberFormatSettings() {
    this._postMessage({
      type: 'rc-adapter-phone-number-format-settings-notify',
      formatType: this.phoneNumberFormatSetting.formatType,
      template:
        this.phoneNumberFormatSetting.formatType === 'custom'
          ? this.phoneNumberFormatSetting.template
          : '',
    });
  }

  private _notifySmartNotesSettings() {
    if (!this._smartNotes) {
      return;
    }
    this._postMessage({
      type: 'rc-adapter-ai-assistant-settings-notify',
      showAiAssistantWidget: this._smartNotes.showSmartNote,
      autoStartAiAssistant: this._smartNotes.autoStartSmartNote,
    });
  }

  private _syncWebphoneSessions() {
    if (!this._webphone.ready) {
      return;
    }
    this._postMessage({
      type: 'rc-webphone-sessions-sync',
      calls: this._webphone.sessions.map((session: any) => ({
        ...this._withContactMatch(session),
      })),
    });
  }

  private _showClientWindow(): void {
    this._setClosed(false);
    this._setMinimized(false);
    globalThis.window?.focus();
  }

  private async _setPresence(data: LegacyPresenceData): Promise<void> {
    if (data.userStatus || data.dndStatus) {
      const validUserStatus =
        !data.userStatus ||
        Object.values(presenceStatus).includes(data.userStatus as never);
      const validDndStatus =
        !data.dndStatus ||
        Object.values(dndStatus).includes(data.dndStatus as never);
      if (!validUserStatus || !validDndStatus || !this._presence.ready) {
        return;
      }
      await (this._presence as LegacyPresence)._update({
        userStatus: data.userStatus ?? this._presence.userStatus,
        dndStatus: data.dndStatus ?? this._presence.dndStatus,
      });
      return;
    }
    if (data.presenceType) {
      await this._presence.setPresence(data.presenceType as never);
    }
  }

  private async _autoPopulateConversation(
    text?: string,
    attachments: AttachmentPayload[] = [],
  ): Promise<void> {
    if (!this._conversations?.currentConversationId) {
      return;
    }
    if (typeof text === 'string') {
      await this._conversations.updateMessageText(text);
    }
    const validAttachments = getValidAttachments(attachments);
    if (validAttachments.length > 0) {
      await this._conversations.addAttachments(validAttachments);
    }
  }

  private _findConversation(phoneNumber: string): Message | undefined {
    if (!this._conversations) {
      return undefined;
    }
    const normalizedNumber = normalizeNumber({
      phoneNumber,
      countryCode: this._regionSettings.countryCode,
      areaCode: this._regionSettings.areaCode,
    });
    return this._conversations.allConversations.find((conversation) => {
      if (
        !conversation.to ||
        conversation.to.length > 1 ||
        !messageIsTextMessage(conversation)
      ) {
        return false;
      }
      if (conversation.direction === 'Inbound') {
        return (
          conversation.from?.phoneNumber === normalizedNumber ||
          conversation.from?.extensionNumber === normalizedNumber
        );
      }
      return conversation.to.some(
        (recipient) =>
          recipient.phoneNumber === normalizedNumber ||
          recipient.extensionNumber === normalizedNumber,
      );
    });
  }

  private async _openExistingConversation(
    phoneNumber: string,
    text?: string,
    attachments: AttachmentPayload[] = [],
  ): Promise<boolean> {
    const conversation = this._findConversation(phoneNumber);
    if (!conversation?.conversationId || !this._conversations) {
      return false;
    }
    await this._router.push(`/conversations/${conversation.conversationId}`);
    await this._conversations.loadConversation(conversation.conversationId);
    if (typeof text === 'string' && text.length > 0) {
      await this._conversations.updateMessageText(text);
    }
    const validAttachments = getValidAttachments(attachments);
    if (validAttachments.length > 0) {
      await this._conversations.addAttachments(validAttachments);
    }
    return true;
  }

  private async _newSMS(
    phoneNumber?: string,
    text?: string,
    conversation?: boolean,
    attachments: AttachmentPayload[] = [],
    recipient?: { name?: string; phoneNumber?: string },
  ) {
    if (!this._auth.loggedIn) {
      return;
    }

    if (
      conversation &&
      phoneNumber &&
      (await this._openExistingConversation(phoneNumber, text, attachments))
    ) {
      return;
    }

    await this._composeText.clean();
    await this._router.push('/composeText');

    if (recipient?.phoneNumber) {
      await this._composeText.addToNumber({
        phoneNumber: recipient.phoneNumber,
        name: recipient.name || recipient.phoneNumber,
      });
    } else if (phoneNumber) {
      const added = await this._composeText.addToNumber({
        phoneNumber,
        name: phoneNumber,
      });
      if (!added) {
        await this._composeText.updateTypingToNumber(phoneNumber);
      }
    }

    if (typeof text === 'string' && text.length > 0) {
      await this._composeText.updateMessageText(String(text));
    }

    const validAttachments = getValidAttachments(attachments);
    if (validAttachments.length > 0) {
      await this._composeText.addAttachments(validAttachments);
    }
  }

  private async _newCall(
    phoneNumber?: string,
    toCall = false,
    callerId?: string,
  ) {
    if (!this._auth.loggedIn || !phoneNumber || !this._call.isIdle) {
      return;
    }
    if (this._isCallOngoing(phoneNumber)) {
      return;
    }

    if (callerId) {
      const isAnonymous = callerId === 'anonymous';
      const isValid = this._callingSettings.fromNumbers.some(
        (item: { phoneNumber?: string }) => item.phoneNumber === callerId,
      );
      if (
        (isAnonymous || isValid) &&
        callerId !== this._callingSettings.fromNumber
      ) {
        await this._callingSettings.updateFromNumber({
          phoneNumber: callerId,
        });
      }
    }

    await this._router.push('/dialer');
    this._dialerView?.setToNumberField(phoneNumber);

    if (toCall && this._dialerView) {
      await this._dialerView.call({
        recipient: {
          phoneNumber,
        },
      });
    }
  }

  private _isCallOngoing(phoneNumber: string): boolean {
    const normalizedNumber = normalizeNumber({
      phoneNumber,
      countryCode: this._regionSettings.countryCode,
      areaCode: this._regionSettings.areaCode,
    });
    return this._webphone.sessions.some(
      (session: { to?: string }) => session.to === normalizedNumber,
    );
  }

  private async _controlCall(
    action?: string,
    id?: string,
    options: ControlCallOptions = {},
  ) {
    const activeSessionId = id || this._webphone.activeSessionId;
    const ringSessionId = id || this._webphone.ringSessionId;

    switch (action) {
      case 'answer':
        await this._webphone.answer(ringSessionId);
        break;
      case 'reject':
        await this._webphone.reject(ringSessionId);
        break;
      case 'hangup':
        await this._webphone.hangup(activeSessionId);
        break;
      case 'hold':
        await this._webphone.hold(activeSessionId);
        break;
      case 'unhold':
        await this._webphone.unhold(activeSessionId);
        break;
      case 'transfer':
        if (options.transferNumber) {
          await this._webphone.transfer(options.transferNumber, activeSessionId);
        }
        break;
      case 'toVoicemail':
        await this._webphone.toVoiceMail(ringSessionId);
        break;
      case 'forward':
        if (options.forwardNumber) {
          await this._forward(ringSessionId, options.forwardNumber);
        }
        break;
      case 'startRecord':
        await this._startRecord(activeSessionId);
        break;
      case 'stopRecord':
        await this._stopRecord(activeSessionId);
        break;
      case 'mute':
        await this._webphone.mute(activeSessionId);
        break;
      case 'unmute':
        await this._webphone.unmute(activeSessionId);
        break;
      case 'toggleRingingDialog':
        if (ringSessionId) {
          await this._webphone.toggleMinimized(ringSessionId);
        }
        break;
      case 'dtmf':
        if (options.dtmf) {
          await this._webphone.sendDTMF(options.dtmf, activeSessionId);
        }
        break;
      default:
        break;
    }
  }

  private async _pickCall(
    extensionId?: string,
    telephonySessionId?: string,
  ): Promise<void> {
    if (!extensionId || !telephonySessionId) {
      this._notifyPickCallError(
        'extensionId and telephonySessionId are required',
      );
      return;
    }
    if (this._callingSettings.callingMode !== callingModes.webphone) {
      this._notifyPickCallError(
        'Pick call is only supported in webphone mode',
      );
      return;
    }
    const monitoredExtension =
      this._monitoredExtensions?.monitoredExtensions.find(
        ({ extension }) => String(extension.id) === String(extensionId),
      );
    const activeCall = monitoredExtension?.presence?.activeCalls?.find(
      (call) => call.telephonySessionId === telephonySessionId,
    );
    if (!activeCall) {
      this._notifyPickCallError('Call not found in monitored extensions');
      return;
    }
    const extensionType = monitoredExtension?.extension.type;
    if (!extensionType) {
      this._notifyPickCallError('Extension not found in monitored extensions');
      return;
    }
    try {
      await this._executePickCall(
        extensionType,
        extensionId,
        activeCall,
      );
    } catch (error: unknown) {
      this._notifyPickCallError(getErrorMessage(error) || 'Failed to pick call');
    }
  }

  private async _executePickCall(
    extensionType: string,
    extensionId: string,
    activeCall: PresenceActiveCall,
  ): Promise<void> {
    const fromNumber = this._callingSettings.fromNumber ?? '';
    if (extensionType === 'ParkLocation') {
      await this._webphoneV2.pickParkLocation(
        extensionId,
        activeCall,
        fromNumber,
      );
      return;
    }
    if (extensionType === 'GroupCallPickup') {
      await this._webphoneV2.pickGroupCall(
        extensionId,
        activeCall,
        fromNumber,
        'gcp',
      );
      return;
    }
    if (extensionType === 'Department') {
      await this._webphoneV2.pickGroupCall(
        extensionId,
        activeCall,
        fromNumber,
        'qpk',
      );
      return;
    }
    this._notifyPickCallError(
      `Unsupported extension type for pick: ${extensionType}`,
    );
  }

  private _notifyPickCallError(message: string): void {
    this._postMessage({
      type: 'rc-control-call-error',
      error: 'PickError',
      message,
    });
  }

  private async _forward(
    webphoneSessionId: string | null | undefined,
    forwardNumber: string,
  ): Promise<void> {
    const webphoneSession = this._webphone.sessions.find(
      (session) => session.id === webphoneSessionId,
    );
    if (!webphoneSession || !webphoneSessionId) {
      return;
    }
    const telephonySessionId = webphoneSession.partyData?.sessionId;
    if (!telephonySessionId) {
      await this._webphone.forward(webphoneSessionId, forwardNumber);
      return;
    }
    await this._activeCallControlV2.forward(
      forwardNumber,
      telephonySessionId,
    );
  }

  private async _startRecord(
    requestedSessionId?: string | null,
  ): Promise<void> {
    const webphoneSessionId =
      requestedSessionId || this._webphone.activeSessionId;
    const webphoneSession = this._webphone.sessions.find(
      (session) => session.id === webphoneSessionId,
    );
    if (!webphoneSession || !webphoneSessionId) {
      return;
    }
    const telephonySessionId = webphoneSession.partyData?.sessionId;
    const telephonySession =
      telephonySessionId &&
      this._activeCallControlV2.hasTelephonySession(telephonySessionId)
        ? this._activeCallControl.getActiveSession(telephonySessionId)
        : undefined;
    const currentRecordStatus =
      telephonySession?.recordStatus ?? webphoneSession.recordStatus;
    if (currentRecordStatus !== recordStatus.idle) {
      this._postMessage({
        type: 'rc-control-call-error',
        error: 'RecordError',
        message: "Can't record at current status",
        callId: webphoneSessionId,
      });
      return;
    }
    if (!telephonySession || telephonySession.to === 'conference') {
      await this._webphone.startRecord(webphoneSessionId);
      return;
    }
    try {
      await this._webphoneV2.updateRecordStatus(
        webphoneSessionId,
        recordStatus.pending,
      );
      const succeeded = await this._activeCallControlV2.startRecord(
        telephonySessionId,
      );
      if (succeeded !== true) {
        await this._webphoneV2.updateRecordStatus(
          webphoneSessionId,
          recordStatus.idle,
        );
        return;
      }
      await this._webphoneV2.updateRecordStatus(
        webphoneSessionId,
        recordStatus.recording,
      );
    } catch (error: unknown) {
      this._toast.danger({
        message: webphoneT('recordError', {
          errorCode: getErrorMessage(error),
        }),
      });
      await this._webphoneV2.updateRecordStatus(
        webphoneSessionId,
        recordStatus.idle,
      );
    }
  }

  private async _stopRecord(
    requestedSessionId?: string | null,
  ): Promise<void> {
    const webphoneSessionId =
      requestedSessionId || this._webphone.activeSessionId;
    const webphoneSession = this._webphone.sessions.find(
      (session) => session.id === webphoneSessionId,
    );
    if (!webphoneSession || !webphoneSessionId) {
      return;
    }
    const telephonySessionId = webphoneSession.partyData?.sessionId;
    const telephonySession =
      telephonySessionId &&
      this._activeCallControlV2.hasTelephonySession(telephonySessionId)
        ? this._activeCallControl.getActiveSession(telephonySessionId)
        : undefined;
    const currentRecordStatus =
      telephonySession?.recordStatus ?? webphoneSession.recordStatus;
    if (currentRecordStatus !== recordStatus.recording) {
      this._postMessage({
        type: 'rc-control-call-error',
        error: 'RecordError',
        message: "Can't stop record at current status",
        callId: webphoneSessionId,
      });
      return;
    }
    if (!telephonySession || telephonySession.to === 'conference') {
      await this._webphone.stopRecord(webphoneSessionId);
      return;
    }
    try {
      await this._webphoneV2.updateRecordStatus(
        webphoneSessionId,
        recordStatus.pending,
      );
      const succeeded =
        await this._activeCallControlV2.stopRecordForAdapter(
          telephonySessionId,
        );
      if (!succeeded) {
        await this._webphoneV2.updateRecordStatus(
          webphoneSessionId,
          recordStatus.recording,
        );
        return;
      }
      await this._webphoneV2.updateRecordStatus(
        webphoneSessionId,
        recordStatus.idle,
      );
    } catch (error: unknown) {
      this._toast.danger(
        hasResponseStatus(error, 403)
          ? { message: STOP_RECORD_DISABLED_MESSAGE }
          : {
              message: webphoneT('recordError', {
                errorCode: getErrorMessage(error),
              }),
            },
      );
      await this._webphoneV2.updateRecordStatus(
        webphoneSessionId,
        recordStatus.recording,
      );
    }
  }

  private async _updateCallingSettings(data: {
    callWith?: string;
    myLocation?: string;
    ringoutPrompt?: boolean;
    fromNumber?: string;
  }) {
    if (!this._callingSettings.ready) {
      return;
    }

    if (data.callWith && (callingOptions as Record<string, string>)[data.callWith]) {
      await this._callingSettings.setData(
        {
          callWith: (callingOptions as Record<string, string>)[data.callWith],
          myLocation: data.myLocation,
          ringoutPrompt: data.ringoutPrompt,
        },
        false,
      );
    }

    if (data.fromNumber) {
      const isAnonymous = data.fromNumber === 'anonymous';
      const isValid = this._callingSettings.fromNumbers.find(
        (item: any) => item.phoneNumber === data.fromNumber,
      );
      if ((isAnonymous || isValid) && data.fromNumber !== this._callingSettings.fromNumber) {
        await this._callingSettings.updateFromNumber({
          phoneNumber: data.fromNumber,
        });
      }
    }
  }

  private async _updateSmsSettings(data: { senderNumber?: string }) {
    if (!this._composeText.ready || !data.senderNumber) {
      return;
    }

    const isValid = this._composeText.senderNumbersList.find(
      (item: any) => item.phoneNumber === data.senderNumber,
    );
    if (isValid) {
      await this._composeText.updateSenderNumber(data.senderNumber);
    }
  }

  private async _navigateTo(path: string) {
    const intent = resolveLegacyAdapterPath(path);
    switch (intent.kind) {
      case 'back':
        this._router.goBack();
        return;
      case 'activeCall':
        if (intent.webphoneSessionId) {
          await this._navigateToRequestedCall(intent.webphoneSessionId);
          return;
        }
        await this._navigateToCurrentCall();
        return;
      case 'activeCallList':
        await this._navigateToViewCalls();
        return;
      case 'dialerTab':
        await this._router.push('/dialer', {
          [DIAL_PAD_TAB_ID]: intent.tab,
        });
        return;
      case 'meetingTab':
        await this._router.push('/meeting', {
          [MEETING_TAB_ID]: intent.tab,
        });
        return;
      case 'route':
        if (this._router.currentPath !== intent.path) {
          await this._router.push(intent.path);
        }
        return;
      case 'unsupported':
        this.logger.warn('Unsupported legacy adapter navigation', intent);
        return;
    }
  }

  private async _navigateToRequestedCall(
    webphoneSessionId: string,
  ): Promise<void> {
    const webphoneSession = this._webphone.sessions.find(
      (session) => session.id === webphoneSessionId,
    );
    const telephonySessionId = webphoneSession?.partyData?.sessionId;
    if (!telephonySessionId || !this._callAction) {
      return;
    }
    await this._router.push('/calling');
    await this._callAction.navigateToActive(telephonySessionId);
  }

  private async _navigateToCurrentCall() {
    const currentSession =
      this._webphone.sessions.find((session: any) => session.callStatus === 'webphone-session-connected') ||
      this._webphone.activeSession;

    if (!currentSession && !this._webphone.ringSession) {
      return;
    }

    await this._router.push('/calling');
    if (this._callViewState) {
      await this._callViewState.setView('activeCall');
    }
    if (this._webphone.ringSession && !this._webphone.ringSession.minimized) {
      await this._webphone.toggleMinimized(this._webphone.ringSession.id);
    }
  }

  private async _navigateToViewCalls() {
    await this._router.push('/calling');
    if (this._callViewState) {
      await this._callViewState.setView('callList');
    }
    if (this._webphone.ringSession && !this._webphone.ringSession.minimized) {
      await this._webphone.toggleMinimized(this._webphone.ringSession.id);
    }
  }

  private async _updateRingtone(data: {
    name?: string;
    uri?: string;
    volume?: number;
  }) {
    if (
      typeof data.volume === 'number' &&
      data.volume >= 0 &&
      data.volume <= 1
    ) {
      await this._audioSettings?.setData({ ringtoneVolume: data.volume });
    }
    if (!data.name || !data.uri || !isSafeAudioUri(data.uri)) {
      return;
    }

    const id = `adapter-${Date.now()}`;
    await this._ringtoneConfiguration.uploadCustomRingtone(
      {
        id,
        name: data.name,
        url: data.uri,
        type: 'custom',
      },
      false,
    );
    await this._ringtoneConfiguration.setSelectedRingtoneId(id);
    await this._ringtoneConfiguration.updateIncomingRingtone();
  }

  private _onUpdateAutoLogSettings(data: {
    call?: boolean;
    message?: boolean;
  }) {
    if (typeof data.call === 'boolean' && this._callLogger) {
      void this._callLogger.setAutoLog(data.call);
    }
    if (typeof data.message === 'boolean') {
      void this._conversationLogger.setAutoLog(data.message);
    }
  }

  @delegate('server')
  private async _onUpdateFeatureConfig(data: {
    chat?: boolean;
    contacts?: boolean;
    fax?: boolean;
    meetings?: boolean;
    recordings?: boolean;
    text?: boolean;
    voicemail?: boolean;
  }): Promise<void> {
    const config: Record<string, boolean> = {};
    if (typeof data.chat === 'boolean') config.Glip = data.chat;
    if (typeof data.text === 'boolean') {
      config.Pages = data.text;
      config.SMS = data.text;
    }
    if (typeof data.fax === 'boolean') config.Fax = data.fax;
    if (typeof data.voicemail === 'boolean') config.Voicemail = data.voicemail;
    if (typeof data.meetings === 'boolean') config.Meetings = data.meetings;
    if (typeof data.contacts === 'boolean') config.Contacts = data.contacts;
    if (typeof data.recordings === 'boolean') {
      config.CallRecording = data.recordings;
    }
    if (Object.keys(config).length === 0) {
      return;
    }
    this._appFeaturesV2.setConfigState({
      ...this._appFeaturesV2.configState,
      ...config,
    });
  }

  private async _setCallContactMatched(data: {
    contactId?: string;
    telephonySessionId?: string;
  }): Promise<void> {
    if (!data.telephonySessionId || !data.contactId) {
      return;
    }
    const webphoneSession = this._webphone.sessions.find(
      (session: NormalizedSession) =>
        session.partyData?.sessionId === data.telephonySessionId,
    );
    if (!webphoneSession) {
      return;
    }
    const phoneNumber =
      webphoneSession.direction === 'Inbound'
        ? webphoneSession.from
        : webphoneSession.to;
    const contactMatch = phoneNumber
      ? this._contactMatcher?.dataMapping[phoneNumber]?.find(
          (match: { id?: string }) => match.id === data.contactId,
        )
      : undefined;
    if (!contactMatch) {
      return;
    }
    await this._webphoneV2.updateSessionMatchedContact(
      webphoneSession.id,
      contactMatch,
    );
    const call = this._callMonitor.allCalls.find(
      (item) => item.telephonySessionId === data.telephonySessionId,
    );
    if (call?.sessionId) {
      await this._matchedContactSelection?.select({
        scope: 'call',
        key: call.sessionId,
        entityId: data.contactId,
      });
    }
  }

  private _onUpdateSmsTypingTimeTracking(data: { enabled?: boolean }): void {
    if (typeof data.enabled === 'boolean') {
      void this._smsTypingTimeTracker?.setEnabled(data.enabled);
    }
  }

  private _onUpdateAiAssistantSettings(data: {
    showAiAssistantWidget?: boolean;
    showAiAssistantWidgetReadOnly?: boolean;
    showAiAssistantWidgetReadOnlyReason?: string;
    autoStartAiAssistant?: boolean;
    autoStartAiAssistantReadOnly?: boolean;
    autoStartAiAssistantReadOnlyReason?: string;
  }): void {
    if (!this._smartNotes) {
      return;
    }
    if (typeof data.showAiAssistantWidget === 'boolean') {
      void this._smartNotes.setShowSmartNote(
        data.showAiAssistantWidget,
        Boolean(data.showAiAssistantWidgetReadOnly),
        data.showAiAssistantWidgetReadOnlyReason ?? '',
      );
    }
    if (typeof data.autoStartAiAssistant === 'boolean') {
      void this._smartNotes.setAutoStartSmartNote(
        data.autoStartAiAssistant,
        Boolean(data.autoStartAiAssistantReadOnly),
        data.autoStartAiAssistantReadOnlyReason ?? '',
      );
    }
  }

  @delegate('server')
  private async _refreshLoginSession(
    force: boolean,
  ): Promise<{ result: 'ok' | 'error'; message?: string }> {
    try {
      if (!this._client) {
        throw new Error('client service is unavailable');
      }
      if (force) {
        await this._client.service
          .platform()
          .get('/restapi/v1.0/account/~');
      } else {
        await this._client.service.ensureLoggedIn();
      }
      return { result: 'ok' };
    } catch (error: unknown) {
      return { result: 'error', message: getErrorMessage(error) };
    }
  }

  private _onSetPhoneNumberFormat(data: Partial<PhoneNumberFormatSetting>) {
    const setting = normalizePhoneNumberFormatSetting(data);
    if (!setting) {
      return;
    }
    this._setPhoneNumberFormatSetting(setting);
  }

  private _openCustomAlert(body: {
    message?: string;
    level?: string;
    ttl?: number;
    details?: unknown;
  }) {
    const message = [
      typeof body?.message === 'string' ? body.message : '',
      typeof body?.details === 'string' ? body.details : '',
    ]
      .filter(Boolean)
      .join('\n');

    const toastOptions = {
      message,
      ttl: typeof body?.ttl === 'number' ? body.ttl : undefined,
      group: this._customAlertGroup,
    };

    switch (body?.level) {
      case 'success':
        return this._toast.success(toastOptions).id;
      case 'danger':
      case 'error':
        return this._toast.danger(toastOptions).id;
      case 'warning':
        return this._toast.warning(toastOptions).id;
      case 'hint':
        return this._toast.hint(toastOptions).id;
      case 'info':
      default:
        return this._toast.info(toastOptions).id;
    }
  }

  private async _dismissCustomAlert(id?: string | null) {
    if (id) {
      await this._toast.dismiss(id);
      return;
    }
    await this._toast.dismissByGroup([this._customAlertGroup]);
  }

  private _postMessage(data: Record<string, unknown>) {
    if (globalThis.window?.parent) {
      window.parent.postMessage(data, '*');
    }
  }

  private _postRCAdapterMessageResponse({
    responseId,
    response,
  }: {
    responseId: string;
    response: unknown;
  }) {
    this._postMessage({
      type: 'rc-adapter-message-response',
      responseId,
      response,
    });
  }



  _onWindowExpanded(expanded: boolean): void {
    if (!globalThis.window) return;
    const newSize = {
      width: expanded ? 600 : 300,
      height: 540,
    };
    void this.setSize(newSize);
    this._postMessage({
      type: this._messageTypes.syncSize,
      size: newSize,
    });
    this._postMessage({
      type: 'rc-adapter-side-drawer-open-notify',
      open: expanded,
    });
  }
}
