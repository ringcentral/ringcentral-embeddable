import React from 'react'; // TODO: fix react import issue in widgets lib
import { Module } from 'ringcentral-integration/lib/di';
import formatNumber from 'ringcentral-integration/lib/formatNumber';
import callDirections from 'ringcentral-integration/enums/callDirections';
import { isRingingInboundCall } from 'ringcentral-integration/lib/callLogHelpers';
import callingModes from 'ringcentral-integration/modules/CallingSettings/callingModes';
import { isOnHold } from 'ringcentral-integration/modules/Webphone/webphoneHelper';
import { isHolding } from 'ringcentral-integration/modules/ActiveCallControlV2/helpers';
import RcUIModule from 'ringcentral-widgets/lib/RcUIModule';
import { ModalContent } from 'ringcentral-widgets/components/ActiveCallItemV2';

const ModalContentRendererID = 'ActiveCallsUI.ModalContentRenderer';
@Module({
  name: 'ActiveCallsUI',
  deps: [
    'Brand',
    'Locale',
    'CallMonitor',
    'RateLimiter',
    'ContactSearch',
    'RegionSettings',
    'ContactMatcher',
    'CallingSettings',
    'RouterInteraction',
    'RolesAndPermissions',
    'ConnectivityMonitor',
    { dep: 'ModalUI', optional: true },
    { dep: 'Webphone', optional: true },
    { dep: 'CallLogger', optional: true },
    { dep: 'ComposeText', optional: true },
    { dep: 'ConferenceCall', optional: true },
    { dep: 'ContactDetailsUI', optional: true },
    { dep: 'ActiveCallControl', optional: true },
  ],
})
export default class ActiveCallsUI extends RcUIModule {
  constructor({
    brand,
    locale,
    webphone,
    callLogger,
    callMonitor,
    rateLimiter,
    composeText,
    contactSearch,
    regionSettings,
    conferenceCall,
    contactMatcher,
    callingSettings,
    contactDetailsUI,
    activeCallControl,
    routerInteraction,
    rolesAndPermissions,
    connectivityMonitor,
    modalUI,
    ...options
  }) {
    super({
      ...options,
    });
    this._brand = brand;
    this._locale = locale;
    this._webphone = webphone;
    this._callLogger = callLogger;
    this._callMonitor = callMonitor;
    this._rateLimiter = rateLimiter;
    this._composeText = composeText;
    this._contactSearch = contactSearch;
    this._regionSettings = regionSettings;
    this._conferenceCall = conferenceCall;
    this._contactMatcher = contactMatcher;
    this._callingSettings = callingSettings;
    this._contactDetailsUI = contactDetailsUI;
    this._activeCallControl = activeCallControl;
    this._routerInteraction = routerInteraction;
    this._rolesAndPermissions = rolesAndPermissions;
    this._connectivityMonitor = connectivityMonitor;
    this._modalUI = modalUI;
    this._modalUI?.registerRenderer(
      ModalContentRendererID,
      ({ currentLocale, contactName }) => (
        <ModalContent currentLocale={currentLocale} contactName={contactName} />
      ),
    );
  }

  getUIProps({
    showContactDisplayPlaceholder = false,
    showRingoutCallControl = false,
    showSwitchCall = false,
    showTransferCall = true,
    showHoldOnOtherDevice = false,
    useV2,
    useCallControl,
  }) {
    const isWebRTC =
      this._callingSettings.callingMode === callingModes.webphone;
    const controlBusy =
      (this._activeCallControl && this._activeCallControl.busy) || false;
    return {
      currentLocale: this._locale.currentLocale,
      activeRingCalls: this._callMonitor.activeRingCalls,
      activeOnHoldCalls: this._callMonitor.activeOnHoldCalls,
      activeCurrentCalls: this._callMonitor.activeCurrentCalls,
      otherDeviceCalls: this._callMonitor.otherDeviceCalls,
      areaCode: this._regionSettings.areaCode,
      countryCode: this._regionSettings.countryCode,
      outboundSmsPermission: !!(
        this._rolesAndPermissions.permissions &&
        this._rolesAndPermissions.permissions.OutboundSMS
      ),
      internalSmsPermission: !!(
        this._rolesAndPermissions.permissions &&
        this._rolesAndPermissions.permissions.InternalSMS
      ),
      showSpinner: !!(this._conferenceCall && this._conferenceCall.isMerging),
      brand: this._brand.fullName,
      showContactDisplayPlaceholder,
      showRingoutCallControl,
      showTransferCall,
      showHoldOnOtherDevice,
      showSwitchCall:
        showSwitchCall &&
        isWebRTC &&
        this._webphone &&
        this._webphone.connected,
      autoLog: !!(this._callLogger && this._callLogger.autoLog),
      isWebRTC,
      conferenceCallParties: this._conferenceCall
        ? this._conferenceCall.partyProfiles
        : null,
      useV2,
      disableLinks:
        !this._connectivityMonitor.connectivity ||
        this._rateLimiter.throttling ||
        controlBusy,
      useCallControl,
    };
  }

  getUIFunctions({
    composeTextRoute = '/composeText',
    callCtrlRoute = '/calls/active',
    onCreateContact,
    onLogCall,
    isLoggedContact,
    onCallsEmpty,
    onViewContact,
    showViewContact = true,
    getAvatarUrl,
    useV2,
    useCallControl,
  }) {
    // Toggle to control if use new call control API, should using the ActiveCallControlV2 module same time,
    // when you set this toggle to true (https://developers.ringcentral.com/api-reference/Call-Control/createCallOutCallSession)
    this._useCallControlSDK = useCallControl && this._activeCallControl;
    return {
      modalConfirm: (props) =>
        this._modalUI &&
        this._modalUI.confirm({ ...props, content: ModalContentRendererID }),
      modalClose: (id) => {
        try {
          this._modalUI && this._modalUI.close(id)
        } catch (e) {
          console.log('close modal error', e);
        }
      },
      formatPhone: (phoneNumber) =>
        formatNumber({
          phoneNumber,
          areaCode: this._regionSettings.areaCode,
          countryCode: this._regionSettings.countryCode,
        }),
      webphoneAnswer: async (
        sessionId,
        telephonySessionId,
        isHoldAndAnswer = false,
      ) => {
        if (this._useCallControlSDK) {
          isHoldAndAnswer && this._activeCallControl.answerAndHold
            ? this._activeCallControl.answerAndHold(telephonySessionId)
            : this._activeCallControl.answer(telephonySessionId);
        } else {
          if (!this._webphone) {
            return;
          }

          const session = this._webphone.sessions.find(
            (session) => session.id === sessionId,
          );
          if (
            this._conferenceCall &&
            session &&
            session.direction === callDirections.inbound
          ) {
            this._conferenceCall.closeMergingPair();
          }

          this._webphone.answer(sessionId);
        }
      },
      webphoneToVoicemail: async (sessionId, telephonySessionId) => {
        if (this._useCallControlSDK) {
          return (
            this._activeCallControl &&
            this._activeCallControl.reject(telephonySessionId)
          );
        }
        return this._webphone && this._webphone.toVoiceMail(sessionId);
      },
      webphoneReject: async (sessionId) => {
        return this._webphone && this._webphone.reject(sessionId);
      },

      webphoneHangup: async (sessionId, telephonySessionId) => {
        // user action track
        this._callMonitor.allCallsClickHangupTrack();
        if (this._useCallControlSDK) {
          return (
            this._activeCallControl &&
            this._activeCallControl.hangUp(telephonySessionId)
          );
        }
        return this._webphone && this._webphone.hangup(sessionId);
      },
      webphoneResume: async (sessionId, telephonySessionId) => {
        if (this._useCallControlSDK) {
          return (
            this._activeCallControl &&
            this._activeCallControl.unhold(telephonySessionId)
          );
        }
        if (!this._webphone) {
          return;
        }
        await this._webphone.resume(sessionId);
        if (this._routerInteraction.currentPath !== callCtrlRoute && !useV2) {
          this._routerInteraction.push(callCtrlRoute);
        }
      },
      webphoneHold: async (sessionId, telephonySessionId) => {
        // user action track
        this._callMonitor.allCallsClickHoldTrack();
        if (this._useCallControlSDK) {
          return (
            this._activeCallControl &&
            this._activeCallControl.hold(telephonySessionId)
          );
        }
        return this._webphone && this._webphone.hold(sessionId);
      },
      webphoneSwitchCall: async (activeCall) => {
        if (this._useCallControlSDK) {
          return (
            this._activeCallControl &&
            this._activeCallControl.switch(activeCall.telephonySessionId)
          );
        }
        if (!this._webphone) {
          return;
        }
        const session = await this._webphone.switchCall(
          activeCall,
          this._regionSettings.homeCountryId,
        );
        return session;
      },
      webphoneIgnore: async (telephonySessionId) => {
        return this._activeCallControl?.ignore(telephonySessionId);
      },
      ringoutHangup: async (...args) => {
        // user action track
        this._callMonitor.allCallsClickHangupTrack();
        return (
          this._activeCallControl && this._activeCallControl.hangUp(...args)
        );
      },
      ringoutTransfer: async (sessionId) => {
        this._routerInteraction.push(`/transfer/${sessionId}/active`);
      },
      ringoutReject: async (sessionId) => {
        // user action track
        this._callMonitor.allCallsClickRejectTrack();
        return (
          this._activeCallControl && this._activeCallControl.reject(sessionId)
        );
      },
      onViewContact: showViewContact
        ? onViewContact ||
          (({ contact }) => {
            const { id, type } = contact;
            if (this._contactDetailsUI) {
              this._contactDetailsUI.showContactDetails({
                type,
                id,
                direct: true,
              });
            }
          })
        : null,
      onClickToSms: this._composeText
        ? async (contact, isDummyContact = false) => {
            if (this._routerInteraction) {
              this._routerInteraction.push(composeTextRoute);
            }
            this._composeText.clean();
            if (contact.name && contact.phoneNumber && isDummyContact) {
              this._composeText.updateTypingToNumber(contact.name);
              this._contactSearch.search({ searchString: contact.name });
            } else {
              this._composeText.addToRecipients(contact);
            }
          }
        : undefined,
      onCreateContact: onCreateContact
        ? async ({ phoneNumber, name, entityType }) => {
            const hasMatchNumber = await this._contactMatcher.hasMatchNumber({
              phoneNumber,
              ignoreCache: true,
            });
            if (!hasMatchNumber) {
              await onCreateContact({ phoneNumber, name, entityType });
              await this._contactMatcher.forceMatchNumber({ phoneNumber });
            }
          }
        : undefined,
      isLoggedContact,
      onLogCall:
        onLogCall ||
        (this._callLogger &&
          (async ({ call, contact, redirect = true }) => {
            await this._callLogger.logCall({
              call,
              contact,
              redirect,
            });
          })),
      onCallsEmpty:
        onCallsEmpty ||
        (() => {
          const isWebRTC =
            this._callingSettings.callingMode === callingModes.webphone;

          if (isWebRTC && !this._webphone.sessions.length) {
            this._routerInteraction.push('/dialer');
          }
        }),
      isSessionAConferenceCall: (sessionId) =>
        !!(
          this._conferenceCall &&
          this._conferenceCall.isConferenceSession(sessionId)
        ),
      onCallItemClick: (call) => {
        if (!call.webphoneSession) {
          // For ringout call
          if (isRingingInboundCall(call)) {
            return;
          }

          const { telephonySessionId } = call;
          // to track the call item be clicked.
          this._callMonitor.callItemClickTrack();
          this._routerInteraction.push(
            `/simplifycallctrl/${telephonySessionId}`,
          );
        } else {
          // For webphone call
          // show the ring call modal when click a ringing call.
          if (isRingingInboundCall(call)) {
            this._webphone.toggleMinimized(call.webphoneSession.id);
            return;
          }
          if (call.webphoneSession && call.webphoneSession.id) {
            // to track the call item be clicked.
            this._callMonitor.callItemClickTrack();
            this._routerInteraction.push(
              `${callCtrlRoute}/${call.webphoneSession.id}`,
            );
          }
        }
      },
      getAvatarUrl,
      updateSessionMatchedContact: (sessionId, contact) =>
        this._webphone.updateSessionMatchedContact(sessionId, contact),
      // function to check if a call is on hold status
      isOnHold: (webphoneSession) => {
        if (this._useCallControlSDK) {
          const call =
            this._callMonitor.calls.find(
              (x) => x.webphoneSession === webphoneSession,
            ) || {};
          const { telephonySession } = call;
          return isHolding(telephonySession);
        }
        return isOnHold(webphoneSession);
      },
      clickSwitchTrack: () => {
        this._activeCallControl?.clickSwitchTrack?.();
      },
    };
  }
}
