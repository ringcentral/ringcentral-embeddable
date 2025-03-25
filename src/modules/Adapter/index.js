import moduleStatuses
  from '@ringcentral-integration/commons/enums/moduleStatuses';
import {
  presenceStatus as presenceStatusEnum,
} from '@ringcentral-integration/commons/enums/presenceStatus.enum';
import debounce from '@ringcentral-integration/commons/lib/debounce';
import { Module } from '@ringcentral-integration/commons/lib/di';
import ensureExist from '@ringcentral-integration/commons/lib/ensureExist';
import normalizeNumber from '@ringcentral-integration/commons/lib/normalizeNumber';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';
import { callingOptions } from '@ringcentral-integration/commons/modules/CallingSettings/callingOptions';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { dndStatus as dndStatusEnum } from '@ringcentral-integration/commons/modules/Presence/dndStatus';
import recordStatus from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import webphoneErrors from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';
import { isOnHold } from '@ringcentral-integration/commons/modules/Webphone/webphoneHelper';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import AdapterModuleCore from '@ringcentral-integration/widgets/lib/AdapterModuleCore';

import messageTypes from '../../lib/Adapter/messageTypes';
import { getWebphoneSessionContactMatch } from '../../lib/contactMatchHelper';
import { formatMeetingForm, formatMeetingInfo } from '../../lib/formatMeetingInfo';
import { isDuplicated } from '../../lib/isDuplicated';
import PopupWindowManager from '../../lib/PopupWindowManager';
import actionTypes from './actionTypes';
import getReducer from './getReducer';
import {
  setOutputDeviceWhenCall,
  getValidAttachments,
  trackWebphoneCallEnded,
} from './helper';
import { findExistedConversation, getConversationPhoneNumber } from '../../lib/conversationHelper';
import { getCallContact } from '../../lib/callHelper';

@Module({
  name: 'Adapter',
  deps: [
    'Auth',
    'Alert',
    'OAuth',
    'ExtensionInfo',
    'AccountInfo',
    'RouterInteraction',
    'AppFeatures',
    'Presence',
    'ComposeText',
    'Call',
    'DialerUI',
    'Webphone',
    'RegionSettings',
    'CallingSettings',
    'GlobalStorage',
    'Locale',
    'MessageStore',
    'TabManager',
    'CallLog',
    'CallLogger',
    'CallHistory',
    'CallMonitor',
    'ConversationLogger',
    'GenericMeeting',
    'Brand',
    'Conversations',
    'ActiveCallControl',
    'ContactMatcher',
    'Contacts',
    'AudioSettings',
    'SmsTemplates',
    'SideDrawerUI',
    'SmartNotes',
    'ComposeTextUI',
    'Analytics',
    'Theme',
    'ThirdPartyService',
    { dep: 'AdapterOptions', optional: true }
  ]
})
export default class Adapter extends AdapterModuleCore {
  constructor({
    auth,
    alert,
    analytics,
    oAuth,
    extensionInfo,
    accountInfo,
    presence,
    composeText,
    call,
    dialerUI,
    webphone,
    regionSettings,
    callingSettings,
    messageStore,
    stylesUri,
    prefix,
    enableFromNumberSetting,
    showMyLocationNumbers,
    disableInactiveTabCallEvent,
    tabManager,
    callLogger,
    callLog,
    callHistory,
    callMonitor,
    conversationLogger,
    genericMeeting,
    brand,
    appFeatures,
    conversations,
    activeCallControl,
    contactMatcher,
    contacts,
    audioSettings,
    fromPopup,
    isUsingDefaultClientId,
    smsTemplates,
    sideDrawerUI,
    smartNotes,
    composeTextUI,
    theme,
    thirdPartyService,
    ...options
  }) {
    super({
      ...options,
      prefix,
      actionTypes,
      messageTypes,
      presence,
      storageKey: 'adapterData',
      webphone,
    });
    this._messageTypes = messageTypes;
    this._auth = this:: ensureExist(auth, 'auth');
    this._presence = this:: ensureExist(presence, 'presence');
    this._composeText = this:: ensureExist(composeText, 'composeText');
    this._webphone = this:: ensureExist(webphone, 'webphone');
    this._regionSettings = this:: ensureExist(regionSettings, 'regionSettings');
    this._callingSettings = this:: ensureExist(callingSettings, 'callingSettings');
    this._call = this:: ensureExist(call, 'call');
    this._dialerUI = this:: ensureExist(dialerUI, 'dialerUI');
    this._messageStore = this:: ensureExist(messageStore, 'messageStore');
    this._tabManager = this:: ensureExist(tabManager, 'tabManager');
    this._alert = alert;
    this._callLogger = callLogger;
    this._callLog = callLog;
    this._callHistory = callHistory;
    this._callMonitor = callMonitor;
    this._conversationLogger = conversationLogger;
    this._extensionInfo = extensionInfo;
    this._accountInfo = accountInfo;
    this._meeting = genericMeeting;
    this._brand = brand;
    this._appFeatures = appFeatures;
    this._conversations = conversations;
    this._activeCallControl = activeCallControl;
    this._oAuth = oAuth;
    this._contactMatcher = contactMatcher;
    this._contacts = contacts;
    this._audioSettings = audioSettings;
    this._smsTemplates = smsTemplates;
    this._sideDrawerUI = sideDrawerUI;
    this._smartNotes = smartNotes;
    this._composeTextUI = composeTextUI;
    this._analytics = analytics;
    this._theme = theme;
    this._thirdPartyService = thirdPartyService;

    this._reducer = getReducer(this.actionTypes);
    this._callSessions = new Map();
    this._stylesUri = stylesUri;
    this._enableFromNumberSetting = enableFromNumberSetting;
    this._showMyLocationNumbers = showMyLocationNumbers;
    this._disableInactiveTabCallEvent = disableInactiveTabCallEvent;
    this._isUsingDefaultClientId = isUsingDefaultClientId;
    this._loggedIn = null;
    this._regionCountryCode = null;
    this._lastActiveCalls = [];
    this._callWith = null;
    this._ringoutMyLocation = null;
    this._callLoggerAutoLogEnabled = null;
    this._conversationLoggerAutoLogEnabled = null;
    this._dialerDisabled = null;
    this._meetingReady = null;
    this._brandConfig = null;
    this._sideDrawerExtended = null;
    this._themeType = null;
    this._aiAssistantEnabled = null;
    this._aiAssistantAutoStart = null;
    this._popupWindowManager = new PopupWindowManager({ prefix, isPopupWindow: fromPopup });

    this._messageStore.onNewInboundMessage((message) => {
      if (isDuplicated(`${prefix}-deduplicate-inbound-message-event`, message.id)) {
        return;
      }
      this._postMessage({
        type: 'rc-inbound-message-notify',
        message,
      });
    });
    this._messageStore.onMessageUpdated((message) => {
      if (isDuplicated(
        `${prefix}-deduplicate-message-updated-event`,
        `${message.id}-${message.lastModifiedTime}`,
        30,
      )) {
        return;
      }
      this._postMessage({
        type: 'rc-message-updated-notify',
        message,
      });
    });
    this._webphone.onCallEnd((session) => {
      this.endCallNotify(session);
      if (this._webphone._webphone && !this._webphone.originalSessions[session.id]) {
        trackWebphoneCallEnded(this._analytics, session);
      }
    });
    this._webphone.onCallInit((session) => {
      this.initCallNotify(session);
      // TODO: HACK to fix not audio issue when user change output device id
      setOutputDeviceWhenCall(this._webphone, this._audioSettings);
    });
    this._webphone.onCallStart((session) => {
      const rawSession = this._webphone._sessions.get(session.id);
      this.startCallNotify(session);
      // TODO: add mute event in web phone module to make mute work at inactive webphone tab
      if (rawSession) {
        rawSession.on('muted', () => {
          const newSession = this._webphone.sessions.find(s => s.id === session.id);
          this.muteCallNotify(newSession, true);
        });
        rawSession.on('unmuted', () => {
          const newSession = this._webphone.sessions.find(s => s.id === session.id);
          this.muteCallNotify(newSession, false);
        });
      }
    });
    this._webphone.onCallRing((session) => {
      this.ringCallNotify(session);
      setOutputDeviceWhenCall(this._webphone, this._audioSettings);
      // TODO: this will be support in new widgets lib
      if (
        this._webphone._webphone &&
        this._webphone.activeSession &&
        !isOnHold(this._webphone.activeSession)
      ) {
        this._webphone._webphone.userAgent.audioHelper.playIncoming(false);
      }
    });
    this._webphone.onCallHold((session) => {
      this.holdCallNotify(session);
    });
    this._webphone.onCallResume((session) => {
      this.resumeCallNotify(session);
    });
    this._webphone.onActiveWebphoneChanged((event) => {
      this.activeWebphoneNotify(event);
    });
    this._activeCallControl.onTelephonySessionUpdated((session) => {
      this.telephonySessionNotify(session);
    });
    this._webphoneConnectionStatus = null;
    this._callLog.onSyncSuccess(() => {
      this.callLogSyncedNotify();
    });
  }

  initialize() {
    window.addEventListener('message', event => this._onMessage(event));
    this._insertExtendStyle();
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      this._pushAdapterState();
      this._checkIfShowDemoWarning();
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    }
    this._pushPresence();
    this._pushLocale();
    this._checkLoginStatus();
    this._checkRegionChanged();
    this._pushActiveCalls();
    this._checkRouteChanged();
    this._checkCallingSettingsChanged();
    this._checkAutoCallLoggerChanged();
    this._checkAutoConversationLoggerChanged();
    this._checkDialUIStatusChanged();
    this._checkMeetingStatusChanged();
    this._checkBrandConfigChanged();
    this._checkWebphoneStatus();
    this._checkSideDrawerOpen();
    this._checkThemeType();
    this._checkAiAssistantSettings();
  }

  _onMessage(event) {
    const data = event.data;
    if (data) {
      switch (data.type) {
        case 'rc-adapter-set-environment':
          if (window.toggleEnv) {
            window.toggleEnv();
          }
          break;
        case 'rc-adapter-new-sms':
          this._newSMS(data.phoneNumber, data.text, data.conversation, data.attachments);
          break;
        case 'rc-adapter-new-call':
          this._newCall(data.phoneNumber, data.toCall);
          break;
        case 'rc-adapter-auto-populate-conversation':
          this._autoPopulateConversationText(data.text, data.attachments);
          break;
        case 'rc-adapter-control-call':
          this._controlCall(data.callAction, data.callId, data.options);
          break;
        case 'rc-adapter-logout':
          if (this._auth.loggedIn) {
            this._auth.logout();
          }
          break;
        case 'rc-adapter-login':
          if (!this._auth.loggedIn) {
            this._oAuth.openOAuthPage();
          }
          break;
        case 'rc-calling-settings-update':
          if (this._callingSettings.ready) {
            this._updateCallingSettings(data);
          }
          break;
        case 'rc-adapter-message-request': {
          this._handleRCAdapterMessageRequest(data);
          break;
        }
        case 'rc-adapter-navigate-to': {
          if (data.path) {
            this._navigateTo(data.path);
          }
          break;
        }
        case 'rc-adapter-set-presence': {
          this._setPresence(data);
          break;
        }
        case 'rc-adapter-webphone-sessions-sync': {
          this._syncWebphoneSessions();
          break;
        }
        case 'rc-adapter-update-ringtone': {
          this._updateRingtone(data);
          break;
        }
        case 'rc-adapter-update-auto-log-settings': {
          this._onUpdateAutoLogSettings(data);
          break;
        }
        case 'rc-adapter-update-features-flags': {
          this._onUpdateFeatureConfig(data);
          break;
        }
        case 'rc-adapter-update-ai-assistant-settings': {
          this._onUpdateAIAssistantSettings(data);
          break;
        }
        case 'rc-adapter-set-side-drawer-extended': {
          this._setSideDrawerExtended(data.extended);
          break;
        }
        case 'rc-adapter-set-call-contact-matches-select': {
          this._setCallContactMatched(data);
          break;
        }
        default:
          super._onMessage(data);
          break;
      }
    }
  }

  async _handleRCAdapterMessageRequest(data) {
    if (!data.path) {
      return;
    }
    switch (data.path) {
      case '/schedule-meeting': {
        if (this._meeting.ready && this._appFeatures.hasMeetingsPermission) {
          const res = await this._scheduleMeeting(data.body);
          this._postRCAdapterMessageResponse({
            responseId: data.requestId,
            response: res,
          });
        }
        break;
      }
      case '/check-popup-window': {
        let res = await this._popupWindowManager.checkPopupWindowOpened();
        if (res && data.body.alert) {
          this._alert.warning({ message: 'popupWindowOpened' });
        }
        if (!res && this._webphone.sessions.length > 0) {
          res = true;
          if (data.body.alert) {
            this._alert.warning({ message: 'cannotPopupWindowWithCall' });
          }
        }
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: res,
        });
        break;
      }
      case '/custom-alert-message':
        const alertId = await this._alert.alert({
          level: data.alertLevel || data.body && data.body.level, // to support old format
          ttl: data.ttl || data.body && data.body.ttl,
          message: 'showCustomAlertMessage',
          payload: {
            alertMessage: data.alertMessage || data.body && data.body.message,
            details: data.body && data.body.details,
          }
        });
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: alertId,
        });
        break;
      case '/dismiss-alert-message':
        if (data.body && data.body.id) {
          this._alert.dismiss(data.body.id);
        } else {
          this._alert.dismissAll();
        }
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: 'ok',
        });
        break;
      case '/create-sms-template': {
        const error = await this._smsTemplates.createOrUpdateTemplate({
          displayName: data.body.displayName,
          body: {
            text: data.body.text,
          },
        });
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: error ? error.message : 'ok',
        });
        break;
      }
      case '/unlogged-calls': {
        const { calls, hasMore } = await this._callLogger.getRecentUnloggedCalls({
          perPage: data.body.perPage,
          page: data.body.page,
        });
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: {
            calls,
            hasMore,
          },
        });
        break;
      }
      default: {
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: { data: 'no matched path' }
        });
        break;
      }
    }
  }

  _pushAdapterState() {
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

  _pushPresence() {
    if (
      this.ready &&
      (
        this._lastDndStatus !== this._presence.dndStatus ||
        this._lastUserStatus !== this._presence.userStatus ||
        this._lastTelephonyStatus !== this._presence.telephonyStatus
      )
    ) {
      this._lastDndStatus = this._presence.dndStatus;
      this._lastUserStatus = this._presence.userStatus;
      this._lastTelephonyStatus = this._presence.telephonyStatus;
      this._postMessage({
        type: this._messageTypes.syncPresence,
        telephonyStatus: (this._auth.loggedIn && this._presence.telephonyStatus) || null,
        userStatus: (this._auth.loggedIn && this._presence.userStatus) || null,
        dndStatus: (this._auth.loggedIn && this._presence.dndStatus) || null,
        presenceOption: (this._auth.loggedIn && this._presence.presenceOption) || null,
      });
    }
  }

  _pushActiveCalls() {
    if (this._disableInactiveTabCallEvent && this._tabManager.ready && (!this._tabManager.active)) {
      this._lastActiveCalls = this._presence.activeCalls;
      return;
    }
    if (this._lastActiveCalls === this._presence.activeCalls) {
      return;
    }
    const lastActiveCallsMap = {};
    this._lastActiveCalls.forEach((call) => {
      lastActiveCallsMap[`${call.sessionId}${call.direction}`] = call;
    });
    this._lastActiveCalls = this._presence.activeCalls;
    const changedCalls = [];
    // Ended Call is not in this._presence.calls
    // So if one call existed in last calls and not existed in new calls, it is ended
    this._presence.activeCalls.forEach((call) => {
      const oldCall = lastActiveCallsMap[`${call.sessionId}${call.direction}`];
      if (!oldCall) {
        changedCalls.push({ ...call });
        return;
      }
      if (
        oldCall.telephonyStatus !== call.telephonyStatus ||
        oldCall.terminationType !== call.terminationType
      ) {
        changedCalls.push({ ...call });
      }
    });
    this._sendRingoutCallNotification(changedCalls);
    this._sendActiveCallNotification(changedCalls);
  }

  async _sendActiveCallNotification(activeCalls) {
    activeCalls.forEach(({ sipData, id, ...call }) => {
      this._postMessage({
        type: 'rc-active-call-notify',
        call,
      });
    });
  }

  _sendRingoutCallNotification(calls) {
    if (this._callingSettings.callingMode != callingModes.ringout) {
      return;
    }
    calls.forEach(({ id, ...call }) => {
      this._postMessage({
        type: 'rc-ringout-call-notify',
        call,
      });
    });
  }

  _checkLoginStatus() {
    if (!this._auth.ready) {
      return;
    }
    if (this._loggedIn === this._auth.loggedIn) {
      return;
    }
    if (this._auth.loggedIn && (
      !this._extensionInfo.ready ||
      !this._accountInfo.ready ||
      !this._appFeatures.ready
    )) {
      return;
    }
    this._loggedIn = this._auth.loggedIn;
    let loginNumber;
    let contractedCountryCode;
    let isAdmin = false;
    let features = {};
    if (this._loggedIn) {
      const extensionNumber =
        this._extensionInfo.extensionNumber && this._extensionInfo.extensionNumber !== '0'
          ? this._extensionInfo.extensionNumber
          : null;
      loginNumber = [this._accountInfo.mainCompanyNumber, extensionNumber].join(
        '*',
      );
      contractedCountryCode =
        this._accountInfo.serviceInfo &&
        this._accountInfo.serviceInfo.contractedCountry &&
        this._accountInfo.serviceInfo.contractedCountry.isoCode;
      isAdmin = (
        this._extensionInfo.info &&
        this._extensionInfo.info.permissions &&
        this._extensionInfo.info.permissions.admin &&
        this._extensionInfo.info.permissions.admin.enabled
      ) || false;
      features = {
        sms: this._appFeatures.hasSMSSendingFeature,
        meeting: this._appFeatures.hasMeetingsPermission,
        glip: this._appFeatures.hasGlipPermission,
        smartNote: this._appFeatures.hasSmartNotePermission,
        call: this._appFeatures.isCallingEnabled,
      };
    }
    this._postMessage({
      type: 'rc-login-status-notify',
      loggedIn: this._loggedIn,
      loginNumber,
      contractedCountryCode,
      admin: isAdmin,
      features,
      isFreshLogin: this._auth.isFreshLogin,
    });
  }

  _checkRegionChanged() {
    if (!this._regionSettings.ready) {
      return;
    }

    const triggerEvent = (
      this._regionCountryCode !== this._regionSettings.countryCode ||
      this._regionAreaCode !== this._regionSettings.areaCode
    );

    if (triggerEvent) {
      this._regionCountryCode = this._regionSettings.countryCode;
      this._regionAreaCode = this._regionSettings.areaCode;
      const showAreaCode = this._regionCountryCode === 'US' || this._regionCountryCode === 'CA'
      this._postMessage({
        type: 'rc-region-settings-notify',
        countryCode: this._regionSettings.countryCode,
        areaCode: showAreaCode ? this._regionSettings.areaCode : '',
      });
    }
  }

  _checkRouteChanged() {
    if (this._currentRoute !== this._router.currentPath) {
      this._currentRoute = this._router.currentPath;
      this.routeChangedNotify(this._currentRoute);
    }
  }

  _checkAutoCallLoggerChanged() {
    if (!this._callLogger.ready) {
      return;
    }
    if (this._callLoggerAutoLogEnabled !== this._callLogger.autoLog) {
      this._callLoggerAutoLogEnabled = this._callLogger.autoLog;
      this._postMessage({
        type: 'rc-callLogger-auto-log-notify',
        autoLog: this._callLogger.autoLog,
      });
    }
  }

  _checkAutoConversationLoggerChanged() {
    if (!this._conversationLogger.ready) {
      return;
    }
    if (this._conversationLoggerAutoLogEnabled !== this._conversationLogger.autoLog) {
      this._conversationLoggerAutoLogEnabled = this._conversationLogger.autoLog;
      this._postMessage({
        type: 'rc-messageLogger-auto-log-notify',
        autoLog: this._conversationLogger.autoLog,
      });
    }
  }

  _checkCallingSettingsChanged() {
    if (!this._callingSettings.ready) {
      return;
    }
    if (
      this._callWith === this._callingSettings.callWith &&
      this._ringoutMyLocation === this._callingSettings.myLocation &&
      (!this._enableFromNumberSetting || this._fromNumbers === this._callingSettings.fromNumbers)
    ) {
      return;
    }
    this._callWith = this._callingSettings.callWith;
    this._ringoutMyLocation = this._callingSettings.myLocation;
    this._fromNumbers = this._callingSettings.fromNumbers;
    const callingMode = this._callingSettings.callingMode;
    const message = {
      type: 'rc-calling-settings-notify',
      callWith: this._callWith && this._callWith.replace('callingOptions-', ''),
      callingMode: callingMode && callingMode.replace('callingModes-', ''),
    };
    if (this._enableFromNumberSetting && this._callWith === callingOptions.browser) {
      message.fromNumbers = this._fromNumbers.map(n => ({ phoneNumber: n.phoneNumber, usageType: n.usageType }));
    }
    if (this._showMyLocationNumbers) {
      message.myLocation = this._callingSettings.myLocation;
      message.myLocationNumbers = this._callingSettings.availableNumbersWithLabel;
    }
    this._postMessage(message);
  }

  _checkDialUIStatusChanged() {
    const dialerDisabled = this._dialerUI.showSpinner || this._dialerUI.isCallButtonDisabled;
    if (this._dialerDisabled === dialerDisabled) {
      return;
    }
    this._dialerDisabled = dialerDisabled;
    this._postMessage({
      type: 'rc-dialer-status-notify',
      ready: !dialerDisabled,
    });
  }

  _checkMeetingStatusChanged() {
    if (this._meetingReady === this._meeting.ready) {
      return;
    }
    this._meetingReady = this._meeting.ready;
    this._postMessage({
      type: 'rc-meeting-status-notify',
      ready: this._meeting.ready,
      permission: !!(
        this._appFeatures.ready &&
        this._appFeatures.hasMeetingsPermission
      ),
    });
  }

  _checkBrandConfigChanged() {
    if (this._brandConfig === this._brand.brandConfig) {
      return;
    }
    this._brandConfig = this._brand.brandConfig;
    this._postMessage({
      type: 'rc-brand-assets-notify',
      logoUri: this._brandConfig.assets && this._brandConfig.assets.logo,
      iconUri: this._brandConfig.assets && this._brandConfig.assets.icon,
    });
  }

  _checkWebphoneStatus() {
    if (this._webphoneConnectionStatus !== this._webphone.connectionStatus) {
      this._webphoneConnectionStatus = this._webphone.connectionStatus;
      this._postMessage({
        type: 'rc-webphone-connection-status-notify',
        connectionStatus: this._webphoneConnectionStatus,
        deviceId: this._webphone.device && this._webphone.device.id,
      });
    }
  }

  _syncWebphoneSessions() {
    if (!this._webphone.ready) {
      return;
    }
    const sessions = this._webphone.sessions.map(session => ({
      ...session,
      contactMatch: getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping),
    }));
    this._postMessage({
      type: 'rc-webphone-sessions-sync',
      calls: sessions,
    });
  }

  _insertExtendStyle() {
    if (!this._stylesUri) {
      return;
    }
    const link = window.document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = this._stylesUri;
    window.document.head.appendChild(link);
  }

  ringCallNotify(session) {
    const contactMatch = getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping);
    this._postMessage({
      type: 'rc-call-ring-notify',
      call: {
        ...session,
        contactMatch,
      },
    });
    if (!this._sideDrawerUI.enabled) {
      return
    }
    if (this._thirdPartyService.apps.length === 0) {
      return;
    }
    this._sideDrawerUI.openApps({
      phoneNumber: session.from,
      name: session.fromUserName,
      ...(contactMatch || {}),
    });
  }

  initCallNotify(session) {
    const contactMatch = getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping);
    this._postMessage({
      type: 'rc-call-init-notify',
      call: {
        ...session,
        contactMatch,
      },
    });
    if (!this._sideDrawerUI.enabled) {
      return
    }
    if (this._thirdPartyService.apps.length === 0) {
      return;
    }
    this._sideDrawerUI.openApps({
      phoneNumber: session.to,
      name: session.toUserName,
      ...(contactMatch || {}),
    });
  }

  startCallNotify(session) {
    this._postMessage({
      type: 'rc-call-start-notify',
      call: {
        ...session,
        contactMatch: getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping),
      },
    });
  }

  endCallNotify(session) {
    this._postMessage({
      type: 'rc-call-end-notify',
      call: {
        ...session,
        endTime: Date.now(),
        contactMatch: getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping),
      },
    });
  }

  holdCallNotify(session) {
    this._postMessage({
      type: 'rc-call-hold-notify',
      call: {
        ...session,
        callStatus: sessionStatus.onHold,
        contactMatch: getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping),
      },
    });
  }

  resumeCallNotify(session) {
    this._postMessage({
      type: 'rc-call-resume-notify',
      call: {
        ...session,
        contactMatch: getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping),
      },
    });
  }

  muteCallNotify(session, muted) {
    this._postMessage({
      type: 'rc-call-mute-notify',
      call: {
        ...session,
        isOnMute: muted,
        contactMatch: getWebphoneSessionContactMatch(session, this._contactMatcher.dataMapping),
      },
    });
  }

  activeWebphoneNotify({ activeId, currentActive }) {
    this._postMessage({
      type: 'rc-webphone-active-notify',
      activeId,
      currentActive,
    });
  }

  telephonySessionNotify(session) {
    if (this._disableInactiveTabCallEvent && this._tabManager.ready && (!this._tabManager.active)) {
      return;
    }
    this._postMessage({
      type: 'rc-telephony-session-notify',
      telephonySession: session,
    });
  }

  routeChangedNotify = debounce((path) => {
    this._postMessage({
      type: 'rc-route-changed-notify',
      path,
    });
  })

  _controlCall(action, id, options) {
    switch (action) {
      case 'answer':
        this._webphone.answer(id || this._webphone.ringSessionId);
        break;
      case 'reject':
        this._webphone.reject(id || this._webphone.ringSessionId);
        break;
      case 'hangup':
        this._webphone.hangup(id || this._webphone.activeSessionId);
        break;
      case 'hold':
        this._webphone.hold(id || this._webphone.activeSessionId);
        break;
      case 'unhold':
        this._webphone.unhold(id || this._webphone.activeSessionId);
        break;
      case 'transfer':
        this._webphone.transfer(options.transferNumber, id || this._webphone.activeSessionId);
        break;
      case 'toVoicemail':
        this._webphone.toVoiceMail(id || this._webphone.ringSessionId);
        break;
      case 'forward':
        this._webphone.forward(id || this._webphone.ringSessionId, options.forwardNumber);
        break;
      case 'startRecord':
        this._startRecord(id);
        break;
      case 'stopRecord':
        this._stopRecord(id);
        break;
      case 'mute':
        this._webphone.mute(id || this._webphone.activeSessionId);
        break;
      case 'unmute':
        this._webphone.unmute(id || this._webphone.activeSessionId);
        break;
      case 'toggleRingingDialog':
        this._webphone.toggleMinimized(id || this._webphone.ringSessionId);
        break;
      default:
        break;
    }
  }

  async _startRecord(id) {
    const webphoneSessionId = id || this._webphone.activeSessionId;
    let webphoneSession = this._webphone.sessions.find(s => s.id === webphoneSessionId);
    if (!webphoneSession) {
      return;
    }
    const telephonySessionId = webphoneSession.partyData && webphoneSession.partyData.sessionId;
    const telephonySession = this._activeCallControl.getActiveSession(telephonySessionId);
    const currentRecordStatus = telephonySession ? telephonySession.recordStatus : webphoneSession.recordStatus;
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
      this._webphone.updateRecordStatus(webphoneSessionId, recordStatus.pending);
      await this._activeCallControl.startRecord(telephonySessionId);
      this._webphone.updateRecordStatus(webphoneSessionId, recordStatus.recording);
    } catch (e) {
      this._alert.danger({
        message: webphoneErrors.recordError,
        payload: {
          errorCode: e.message,
        },
      });
      this._webphone.updateRecordStatus(webphoneSessionId, recordStatus.idle);
    }
  }

  async _stopRecord(id) {
    const webphoneSessionId = id || this._webphone.activeSessionId;
    let webphoneSession = this._webphone.sessions.find(s => s.id === webphoneSessionId);
    if (!webphoneSession) {
      return;
    }
    const telephonySessionId = webphoneSession.partyData && webphoneSession.partyData.sessionId;
    const telephonySession = this._activeCallControl.getActiveSession(telephonySessionId);
    const currentRecordStatus = telephonySession ? telephonySession.recordStatus : webphoneSession.recordStatus;
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
      this._webphone.updateRecordStatus(webphoneSessionId, recordStatus.pending);
      await this._activeCallControl.stopRecord(telephonySessionId);
      this._webphone.updateRecordStatus(webphoneSessionId, recordStatus.idle);
    } catch (e) {
      if (e.response && e.response.status === 403) {
        this._alert.danger({
          message: 'stopRecordDisabled',
        });
      } else {
        this._alert.danger({
          message: webphoneErrors.recordError,
          payload: {
            errorCode: e.message,
          },
        });
      }
      this._webphone.updateRecordStatus(webphoneSessionId, recordStatus.recording);
    }
  }

  _setSideDrawerExtended(value) {
    this._sideDrawerUI.setExtended(value);
  }

  async _navigateTo(path) {
    if (path.indexOf('/log/call/') === 0) {
      const sessionId = path.split('/')[3];
      let call = this._callHistory.latestCalls.find((call) => call.sessionId === sessionId);
      if (!call) {
        call = this._callMonitor.calls.find((call) => call.sessionId === sessionId);
      }
      this._sideDrawerUI.gotoLogCall(sessionId, getCallContact(call));
      return;
    }
    if (path.indexOf('/log/messages/') === 0) {
      const conversationId = path.split('/')[3];
      const conversation = this._conversations.allConversations.find(
        item => item.conversationId === conversationId,
      );
      if (conversation) {
        const phoneNumber = getConversationPhoneNumber(conversation);
        this._sideDrawerUI.gotoLogConversation(conversation, { phoneNumber });
      }
      return;
    }
    if (path === '/composeText') {
      this._composeTextUI.gotoComposeText();
      return;
    }
    if (path.indexOf('/conversations/') === 0) {
      const conversationId = path.split('/')[2];
      const conversation = this._conversations.allConversations.find(
        item => item.conversationId === conversationId,
      );
      if (conversation) {
        const phoneNumber = getConversationPhoneNumber(conversation);
        this._sideDrawerUI.gotoConversation(conversationId, { phoneNumber });
      }
      return;
    }
    if (path.indexOf('/contacts/') === 0) {
      const contactType = path.split('/')[2];
      const contactId = path.split('/')[3];
      if (contactType) {
        const contact = await this._contacts.findContact({
          contactId,
          sourceName: contactType,
        });
        this._sideDrawerUI.gotoContactDetails(contact);
        return;
      }
    }
    if (path.indexOf('/glip/groups/') === 0) {
      const groupId = path.split('/')[3];
      this._sideDrawerUI.gotoGlipChat(groupId);
      return;
    }
    if (path.indexOf('/') === 0 && this._router.currentPath !== path) {
      this._router.push(path);
    }
    if (path === 'goBack') {
      this._router.goBack();
    }
  }

  _newSMS(phoneNumber, text, conversation, attachments = null) {
    if (!this._auth.loggedIn) {
      return;
    }
    const validAttachments = getValidAttachments(attachments);
    if (conversation) {
      const normalizedNumber = normalizeNumber({
        phoneNumber,
        countryCode: this._regionSettings.countryCode,
        areaCode: this._regionSettings.areaCode,
      });
      const existedConversation = findExistedConversation(
        this._conversations.allConversations,
        normalizedNumber,
      );
      if (existedConversation) {
        this._sideDrawerUI.gotoConversation(
          existedConversation.conversationId,
          { phoneNumber: normalizedNumber },
        );
        if (text && text.length > 0) {
          this._conversations.loadConversation(existedConversation.conversationId);
          this._conversations.updateMessageText(String(text));
        }
        if (validAttachments.length > 0) {
          validAttachments.forEach((attachment) => {
            this._conversations.addAttachment(attachment);
          })
        }
        return;
      }
    }
    this._composeTextUI.gotoComposeText();
    if (phoneNumber) {
      this._composeText.updateTypingToNumber(phoneNumber);
    }
    if (text && text.length > 0) {
      this._composeText.updateMessageText(String(text));
    }
    if (validAttachments.length > 0) {
      validAttachments.forEach((attachment) => {
        this._composeText.addAttachment(attachment);
      });
    }
  }

  _newCall(phoneNumber, toCall = false) {
    if (!this._auth.loggedIn) {
      return;
    }
    if (!this._call.isIdle) {
      return;
    }
    const isCall = this._isCallOngoing(phoneNumber);
    if (isCall) {
      return;
    }
    this._router.push('/dialer');
    this._dialerUI.setToNumberField(phoneNumber);
    if (toCall) {
      this._dialerUI.call({ phoneNumber });
    }
  }

  _autoPopulateConversationText(text, attachments) {
    if (!this._conversations.currentConversationId) {
      return;
    }
    if (typeof text === 'string') {
      this._conversations.updateMessageText(text);
    }
    const validAttachments = getValidAttachments(attachments);
    if (validAttachments.length > 0) {
      validAttachments.forEach((attachment) => {
        this._conversations.addAttachment(attachment);
      });
    }
  }

  _isCallOngoing(phoneNumber) {
    const countryCode = this._regionSettings.countryCode;
    const areaCode = this._regionSettings.areaCode;
    const normalizedNumber = normalizeNumber({ phoneNumber, countryCode, areaCode });
    return !!this._webphone.sessions.find(
      session => session.to === normalizedNumber
    );
  }

  _updateCallingSettings(data) {
    if (data.callWith && callingOptions[data.callWith]) {
      this._callingSettings.setData({
        callWith: callingOptions[data.callWith],
        myLocation: data.myLocation,
        ringoutPrompt: data.ringoutPrompt,
      });
    }
    if (data.fromNumber) {
      const isAnonymous = data.fromNumber === 'anonymous';
      const isValid = this._callingSettings.fromNumbers.find(p => p.phoneNumber === data.fromNumber);
      if ((isAnonymous || isValid) && data.fromNumber !== this._callingSettings.fromNumber) {
        this._callingSettings.updateFromNumber({
          phoneNumber: data.fromNumber,
        });
      }
    }
  }

  // override
  async _onNavigateToCurrentCall() {
    const ACTIVE_CALL_PATH = '/calls/active';
    const currentSession =
      this._webphone.sessions.find(s => s.callStatus === sessionStatus.connected) ||
      this._webphone.activeSession;
    if (currentSession) {
      if (this._sideDrawerUI.modalOpen) {
        this._sideDrawerUI.clearWidgets();
      }
      const currentCallPath = `${ACTIVE_CALL_PATH}/${currentSession.id}`;
      this._router.push(currentCallPath);
    }
    if (this._userGuide && this._userGuide.started) {
      this._userGuide.dismiss();
    }
    if (this._quickAccess && this._quickAccess.entered) {
      this._quickAccess.exit();
    }
    if (
      this._webphone &&
      this._webphone.ringSession &&
      !this._webphone.ringSession.minimized
    ) {
      this._webphone.toggleMinimized(this._webphone.ringSession.id);
    }
  }

  async _onNavigateToViewCalls() {
    this._router.push('/history');
    if (this._userGuide && this._userGuide.started) {
      this._userGuide.dismiss();
    }
    if (this._quickAccess && this._quickAccess.entered) {
      this._quickAccess.exit();
    }
    if (this._sideDrawerUI.modalOpen) {
      this._sideDrawerUI.clearWidgets();
    }
    if (
      this._webphone &&
      this._webphone.ringSession &&
      !this._webphone.ringSession.minimized
    ) {
      this._webphone.toggleMinimized(this._webphone.ringSession.id);
    }
    this._callLogSection?.closeLogSection();
  }

  async _scheduleMeeting(data) {
    const inputs = formatMeetingForm(data, this._meeting.isRCV);
    const resp = await this._meeting.schedule(inputs);
    if (!resp) {
      return {
        error: 'schedule failed'
      };
    }
    const formatedMeetingInfo = formatMeetingInfo(
      resp, this._brand, this._locale.currentLocale, this._meeting.isRCV
    );
    return {
      meeting: formatedMeetingInfo,
    };
  }

  async _setPresence({ dndStatus, userStatus }) {
    if (!this._presence.ready) {
      return;
    }
    if (dndStatus && !ObjectMap.hasValue(dndStatusEnum, dndStatus)) {
      return;
    }
    if (userStatus && !ObjectMap.hasValue(presenceStatusEnum, userStatus)) {
      return;
    }
    // TODO: add public function in widget presence module
    await this._presence._update({
      dndStatus: dndStatus ? dndStatus : this._presence.dndStatus,
      userStatus: userStatus ? userStatus : this._presence.userStatus,
    });
  }

  async _updateRingtone({ name, uri, volume }) {
    if (typeof volume === 'number' && volume >= 0 && volume <= 1) {
      this._audioSettings.setData({ ringtoneVolume: volume });
    }
    if (typeof name === 'string' && typeof uri === 'string') {
      if (
        uri.indexOf('https://') !== 0 &&
        uri.indexOf('http://') !== 0 &&
        uri.indexOf('data:audio/') !== 0
      ) {
        return;
      }
      this._webphone.setRingtone({
        incomingAudio: uri,
        incomingAudioFile: name,
        outgoingAudio:  this._webphone.defaultOutgoingAudio,
        outgoingAudioFile:  this._webphone.defaultOutgoingAudioFile,
      });
    }
  }

  _onUpdateAutoLogSettings(data) {
    if (typeof data.call === 'boolean') {
      this._callLogger.setAutoLog(data.call);
    }
    if (typeof data.message === 'boolean') {
      this._conversationLogger.setAutoLog(data.message);
    }
  }

  _onUpdateFeatureConfig(data) {
    const config = {};
    if (typeof data.chat === 'boolean') {
      config.Glip = data.chat;
    }
    if (typeof data.text === 'boolean') {
      config.Pages = data.text;
      config.SMS = data.text;
    }
    if (typeof data.fax === 'boolean') {
      config.Fax = data.fax;
    }
    if (typeof data.voicemail === 'boolean') {
      config.Voicemail = data.voicemail;
    }
    if (typeof data.meetings === 'boolean') {
      config.Meetings = data.meetings;
    }
    if (typeof data.contacts === 'boolean') {
      config.Contacts = data.contacts;
    }
    if (typeof data.recordings === 'boolean') {
      config.CallRecording = data.recordings;
    }
    if (Object.keys(config).length > 0) {
      this._appFeatures.setConfigState(config);
    }
  }

  _onUpdateAIAssistantSettings(data) {
    if (typeof data.showAiAssistantWidget === 'boolean') {
      this._smartNotes.setShowSmartNote(
        data.showAiAssistantWidget,
        !!data.showAiAssistantWidgetReadOnly,
        data.showAiAssistantWidgetReadOnlyReason,
      );
    }
    if (typeof data.autoStartAiAssistant === 'boolean') {
      this._smartNotes.setAutoStartSmartNote(
        data.autoStartAiAssistant,
        !!data.autoStartAiAssistantReadOnly,
        data.autoStartAiAssistantReadOnlyReason,
      );
    }
  }

  // eslint-disable-next-line
  _postMessage(data) {
    if (window && window.parent) {
      window.parent.postMessage(data, '*');
    }
  }

  _postRCAdapterMessageResponse({ responseId, response }) {
    this._postMessage({
      type: 'rc-adapter-message-response',
      responseId,
      response,
    });
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get pending() {
    return this.state.status === moduleStatuses.pending;
  }

  _checkIfShowDemoWarning() {
    if (!this._isUsingDefaultClientId) {
      return;
    }
    const dismissedTime = localStorage.getItem('rc-widget-demo-warning-dismissed');
    if (
      !dismissedTime ||
      Date.now() - Number.parseInt(dismissedTime, 10) > 24 * 60 * 60 * 1000
    ) {
      this.store.dispatch({
        type: this.actionTypes.setShowDemoWarning,
        show: true,
      });
    }
  }

  get showDemoWarning() {
    return this.state.showDemoWarning;
  }

  dismissDemoWarning = () => {
    localStorage.setItem('rc-widget-demo-warning-dismissed', `${Date.now()}`);
    this.store.dispatch({
      type: this.actionTypes.setShowDemoWarning,
      show: false,
    });
  }

  _checkSideDrawerOpen() {
    if (!this.ready) {
      return;
    }
    if (this._sideDrawerExtended === this._sideDrawerUI.extended) {
      return;
    }
    this._sideDrawerExtended = this._sideDrawerUI.extended;
    const newSize = {
      width: this._sideDrawerExtended ? 600 : 300,
      height: 500,
    };
    this._syncSize(newSize);
    this._postMessage({
      type: this._messageTypes.syncSize,
      size: newSize,
    });
    this._postMessage({
      type: 'rc-adapter-side-drawer-open-notify',
      open: this._sideDrawerExtended,
    });
  }

  _checkThemeType() {
    if (!this.ready) {
      return;
    }
    if (this._themeType === this._theme.themeType) {
      return;
    }
    this._themeType = this._theme.themeType;
    this._postMessage({
      type: 'rc-adapter-theme-notify',
      theme: this._themeType,
    });
  }

  callLogSyncedNotify() {
    this._postMessage({
      type: 'rc-call-history-synced-notify',
    });
  }

  _checkAiAssistantSettings() {
    if (!this.ready) {
      return;
    }
    if (
      this._smartNotes.showSmartNote === this._aiAssistantEnabled &&
      this._smartNotes.autoStartSmartNote === this._aiAssistantAutoStart
    ) {
      return;
    }
    this._aiAssistantEnabled = this._smartNotes.showSmartNote;
    this._aiAssistantAutoStart = this._smartNotes.autoStartSmartNote;
    this._postMessage({
      type: 'rc-adapter-ai-assistant-settings-notify',
      showAiAssistantWidget: this._smartNotes.showSmartNote,
      autoStartAiAssistant: this._smartNotes.autoStartSmartNote,
    });
  }

  _setCallContactMatched(data) {
    if (!data.telephonySessionId || !data.contactId) {
      return;
    }
    this._contactMatcher.setCallMatched({
      telephonySessionId: data.telephonySessionId,
      toEntityId: data.contactId,
    });
    const session = this._webphone.sessions.find(s => {
      return s.partyData && s.partyData.sessionId === data.telephonySessionId
    });
    if (session) {
      const phoneNumber = session.direction === callDirections.inbound
        ? session.from
        : session.to;
      const nameMatches = this._contactMatcher.dataMapping[phoneNumber] || [];
      const sessionContactMatch = nameMatches.find(m => m.id === data.contactId);
      if (sessionContactMatch) {
        this._webphone.updateSessionMatchedContact(session.id, sessionContactMatch);
      }
    }
  }
}
