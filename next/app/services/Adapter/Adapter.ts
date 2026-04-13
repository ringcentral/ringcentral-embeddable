import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { debounce } from '@ringcentral-integration/commons/lib/debounce-throttle';
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
  ExtensionInfo,
  OAuth,
  Presence,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Brand,
  Locale,
  Theme,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ComposeText,
  ConversationLogger,
  MessageStore,
  SmsTemplate,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  ActiveCallControl,
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
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';
import { presenceStatus } from '@ringcentral-integration/commons/enums/presenceStatus.enum';
import { dndStatus } from '@ringcentral-integration/commons/modules/Presence/dndStatus';
import callMonitorBarI18n from '@ringcentral-integration/widgets/components/CallMonitorBar/i18n';
import getPresenceStatusNameI18n from '@ringcentral-integration/widgets/lib/getPresenceStatusName/i18n';
import { getRcmEventTpl, getRcvEventTpl } from '@ringcentral-integration/widgets/lib/MeetingCalendarHelper';

import PopupWindowManager from '../../../lib/PopupWindowManager';
import messageTypes from '../../../lib/Adapter/messageTypes';
import { parseUri } from '../../../lib/Adapter/parseUri';

import type { Webphone as WebphoneV2 } from '../WebphoneV2';

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
      file: Blob;
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

    result.push({
      name: attachment.name,
      file: blob,
      size: blob.size,
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
  ) {
    super();
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
      this._portManager.onClient(() => this._bindClient());
      return;
    }
    this._bindClient();
  }

  private _bindClient() {
    if (!globalThis.window) {
      return () => {};
    }

    const isPopupWindow =
      Boolean((window as any).__ON_RC_POPUP_WINDOW) ||
      ['1', 'true'].includes(parseUri(window.location.href).fromPopup || '');
    this._popupWindowManager = new PopupWindowManager({
      prefix: this._prefix,
      isPopupWindow,
    });

    window.addEventListener('message', this._onWindowMessage);

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
        () => this.phoneNumberFormatSetting,
        () => {
          this._notifyPhoneNumberFormatSettings();
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
    this._syncWebphoneSessions();

    return () => {
      this._debouncedNotifyCallingSettings.cancel();
      window.removeEventListener('message', this._onWindowMessage);
      unwatchFns.forEach((fn) => fn?.());
    };
  }

  private _bindWebphoneEvents() {
    this._webphoneV2.onCallRing((session: any) => {
      this._postMessage({
        type: 'rc-call-ring-notify',
        call: session,
      });
    });
    this._webphoneV2.onCallInit((session: any) => {
      this._postMessage({
        type: 'rc-call-init-notify',
        call: session,
      });
    });
    this._webphoneV2.onCallStart((session: any) => {
      this._postMessage({
        type: 'rc-call-start-notify',
        call: session,
      });
    });
    this._webphoneV2.onCallEnd((session: any) => {
      this._postMessage({
        type: 'rc-call-end-notify',
        call: {
          ...session,
          endTime: Date.now(),
        },
      });
    });
    this._webphoneV2.onCallHold((session: any) => {
      this._postMessage({
        type: 'rc-call-hold-notify',
        call: session,
      });
    });
    this._webphoneV2.onCallResume((session: any) => {
      this._postMessage({
        type: 'rc-call-resume-notify',
        call: session,
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
        call: session,
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
      this._postMessage({
        type: 'rc-inbound-message-notify',
        message,
      });
    });
    this._messageStore?.onMessageUpdated((message) => {
      this._postMessage({
        type: 'rc-message-updated-notify',
        message,
      });
    });
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
        void this._newCall(data.phoneNumber, data.toCall);
        break;
      case 'rc-adapter-control-call':
        void this._controlCall(data.callAction, data.callId, data.options);
        break;
      case 'rc-adapter-logout':
        if (this._auth.loggedIn) {
          void this._auth.logout();
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
        if (data.presenceType) {
          void this._presence.setPresence(data.presenceType);
        }
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
        const response = this._openCustomAlert(data.body);
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
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: {
            error: 'unlogged calls are not supported in next adapter yet',
          },
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
        const call =
          (this._callLog?.calls || []).find((item: any) => {
            return (
              (data.body?.sessionId && item.sessionId === data.body.sessionId) ||
              (data.body?.telephonySessionId &&
                item.telephonySessionId === data.body.telephonySessionId)
            );
          }) ?? null;
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: {
            call,
          },
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
      this._presence.presenceOption,
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
      presenceOption: (this._auth.loggedIn && this._presence.presenceOption) || null,
    });
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

    this._postMessage({
      type: 'rc-calling-settings-notify',
      callWith: stripEnumPrefix(this._callingSettings.callWith),
      callingMode: stripEnumPrefix(this._callingSettings.callingMode),
      fromNumber: this._callingSettings.fromNumber,
      fromNumbers: this._callingSettings.fromNumbers.map((item: any) => ({
        phoneNumber: item.phoneNumber,
        usageType: item.usageType,
        primary: item.primary,
        label: item.label,
      })),
      myLocation: this._callingSettings.fromNumbers,
      myLocationNumbers: this._callingSettings.availableNumbersWithLabel,
    });
  }

  private _notifySmsSettings() {
    if (!this._composeText.ready) {
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
      connectionStatus: this._webphone.connectionStatus,
      deviceId: this._webphone.device?.id,
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
    const nextMap = new Map<string, string>();
    (this._presence.activeCalls || []).forEach((call: any) => {
      const key = `${call.sessionId}${call.direction}`;
      const signature = `${call.telephonyStatus ?? ''}|${call.terminationType ?? ''}`;
      nextMap.set(key, signature);
      if (this._lastActiveCalls.get(key) === signature) {
        return;
      }

      this._postMessage({
        type: 'rc-active-call-notify',
        call,
      });

      if (this._callingSettings.callingMode === callingModes.ringout) {
        this._postMessage({
          type: 'rc-ringout-call-notify',
          call,
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
          ...session,
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

  private _syncWebphoneSessions() {
    if (!this._webphone.ready) {
      return;
    }
    this._postMessage({
      type: 'rc-webphone-sessions-sync',
      calls: this._webphone.sessions.map((session: any) => ({
        ...session,
      })),
    });
  }

  private async _newSMS(
    phoneNumber?: string,
    text?: string,
    _conversation?: boolean,
    attachments: AttachmentPayload[] = [],
    recipient?: { name?: string; phoneNumber?: string },
  ) {
    if (!this._auth.loggedIn) {
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

  private async _newCall(phoneNumber?: string, toCall = false) {
    if (!this._auth.loggedIn || !phoneNumber || !this._call.isIdle) {
      return;
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

  private async _controlCall(
    action?: string,
    id?: string,
    options: ControlCallOptions = {},
  ) {
    const activeSessionId = id || this._webphone.activeSessionId;
    const ringSessionId = id || this._webphone.ringSessionId;

    try {
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
            await this._webphone.forward(ringSessionId, options.forwardNumber);
          }
          break;
        case 'startRecord':
          await this._webphone.startRecord(activeSessionId);
          break;
        case 'stopRecord':
          await this._webphone.stopRecord(activeSessionId);
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
    } catch (error: any) {
      this._postMessage({
        type: 'rc-control-call-error',
        error: 'ControlCallError',
        message: error?.message || 'Failed to control the call',
        callId: id,
      });
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
    if (path === 'goBack') {
      this._router.goBack();
      return;
    }

    if (path === '/history' || path === '/calls') {
      await this._navigateToViewCalls();
      return;
    }

    if (path.indexOf('/calls/active') === 0 || path === '/calling') {
      await this._navigateToCurrentCall();
      return;
    }

    if (path === '/composeText') {
      await this._router.push('/composeText');
      return;
    }

    if (path.startsWith('/') && this._router.currentPath !== path) {
      await this._router.push(path);
    }
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
  }) {
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



  _onWindowExpanded(expanded: boolean) {
    if (!globalThis.window) return;
    const newSize = {
      width: expanded ? 600 : 300,
      height: 540,
    };
    this.setSize(newSize);
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
