import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallsListUI as BaseCallsListUI } from '@ringcentral-integration/widgets/modules/CallsListUI';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { isRingingInboundCall } from '@ringcentral-integration/commons/lib/callLogHelpers';
import { isOnHold } from '@ringcentral-integration/commons/modules/Webphone/webphoneHelper';

@Module({
  name: 'CallsListUI',
  deps: [
    'Locale',
    'CallLogSection',
    'RouterInteraction',
    'ActivityMatcher',
    'CallingSettings',
    { dep: 'ActiveCallControl', optional: true },
    { dep: 'ConferenceCall', optional: true },
    { dep: 'CallsListUIOptions', optional: true },
  ],
})
export class CallsListUI extends BaseCallsListUI {
  getUIProps({
    showRingoutCallControl = false,
    showSwitchCall = false,
    showTransferCall = true,
    showHoldOnOtherDevice = false,
    showMergeCall,
    useCallControl,
    ...props
  }) {
    const {
      callHistory,
      locale,
      callLogger,
      call,
      appFeatures,
      regionSettings,
      connectivityMonitor,
      dateTimeFormat,
      composeText,
      callingSettings,
      activeCallControl,
      webphone,
      conferenceCall,
      rateLimiter,
      callMonitor,
    } = this._deps;
    const isWebRTC = callingSettings.callingMode === callingModes.webphone;
    const controlBusy = activeCallControl?.busy || false;
    return {
      ...super.getUIProps({ ...props }),
      width: window.innerWidth || 300,
      height: window.innerHeight ? (window.innerHeight - 53) : 454,
      adaptive: true,
      onlyHistory: false,
      useNewList: true,
      disableClickToDial:
        !(call && call.isIdle) || !appFeatures.isCallingEnabled,
      showSpinner: !(
        callHistory.ready &&
        locale.ready &&
        regionSettings.ready &&
        dateTimeFormat.ready &&
        connectivityMonitor.ready &&
        appFeatures.ready &&
        (!call || call.ready) &&
        (!composeText || composeText.ready)
      ),
      showLogButton: callLogger.ready,
      logButtonTitle: callLogger.logButtonTitle,
      showRingoutCallControl,
      showTransferCall,
      showHoldOnOtherDevice,
      showSwitchCall: !!(
        showSwitchCall &&
        isWebRTC &&
        webphone?.connected
      ),
      isWebRTC,
      conferenceCallParties: conferenceCall
        ? conferenceCall.partyProfiles
        : null,
      showMergeCall,
      disableLinks:
        !connectivityMonitor.connectivity ||
        rateLimiter.throttling ||
        controlBusy,
      useCallControl,
      activeCalls: callMonitor.calls,
      isWide: true,
    };
  }

  getUIFunctions({
    getAvatarUrl,
    callCtrlRoute = '/calls/active',
    ...props
  }) {
    const {
      callLogSection,
      routerInteraction,
      callLogger,
      activeCallControl,
      webphone,
      regionSettings,
      conferenceCall,
    } = this._deps;
    return {
      ...super.getUIFunctions({
        callCtrlRoute,
        ...props,
      }),
      onLogCall: (async ({ call, contact, type, redirect }) => {
        if (callLogger.showLogModal && type !== 'viewLog') {
          callLogSection.handleLogSection(call);
          return;
        }
        await callLogger.logCall({
          call,
          contact,
          type,
          redirect,
        });
      }),
      // hide default log & view contact button
      onViewContact: props.onViewContact || (({ contact: { type, id } }) => {
        routerInteraction.push(`/contacts/${type}/${id}?direct=true`);
      }),
      isLoggedContact(call, activity, contact) {
        return (
          activity &&
          contact &&
          activity.contact &&
          activity.contact.id === contact.id
        );
      },
      onMergeCall: undefined,
      webphoneAnswer: (sessionId: string) => {
        if (!webphone) {
          return;
        }
        const session = webphone.sessions.find(
          (session) => session.id === sessionId,
        );
        if (
          conferenceCall &&
          session &&
          session.direction === callDirections.inbound
        ) {
          conferenceCall.closeMergingPair();
        }

        webphone.answer(sessionId);
      },
      webphoneResume: async (sessionId: string) => {
        if (!webphone) {
          return;
        }
        await webphone.resume(sessionId);
        // if (this._deps.routerInteraction.currentPath !== callCtrlRoute) {
        //   this._deps.routerInteraction.push(callCtrlRoute);
        // }
      },
      webphoneHold: (sessionId) => {
        return webphone?.hold(sessionId);
      },
      webphoneSwitchCall: async (activeCall) => {
        if (!webphone) {
          return;
        }
        const session = await webphone.switchCall(
          activeCall,
          regionSettings.homeCountryId,
        );
        return session;
      },
      webphoneIgnore: (telephonySessionId) =>
        activeCallControl?.ignore(telephonySessionId),
      ringoutHangup: async (...args) => {
        return activeCallControl?.hangUp(...args);
      },
      ringoutTransfer: (sessionId) => {
        routerInteraction.push(`/transfer/${sessionId}/active`);
      },
      ringoutReject: async (sessionId) => {
        return activeCallControl?.reject(sessionId);
      },
      isSessionAConferenceCall: (sessionId) =>
        !!conferenceCall?.isConferenceSession(sessionId),
      onActiveCallItemClick: (call) => {
        if (!call.webphoneSession) {
          // For ringout call
          if (isRingingInboundCall(call)) {
            return;
          }

          const { telephonySessionId } = call;
          routerInteraction.push(
            `/simplifycallctrl/${telephonySessionId}`,
          );
        } else {
          // For webphone call
          // show the ring call modal when click a ringing call.
          if (isRingingInboundCall(call)) {
            webphone.toggleMinimized(call.webphoneSession.id);
            return;
          }
          if (call.webphoneSession && call.webphoneSession.id) {
            routerInteraction.push(
              `${callCtrlRoute}/${call.webphoneSession.id}`,
            );
          }
        }
      },
      updateSessionMatchedContact: (sessionId, contact) =>
        webphone.updateSessionMatchedContact(sessionId, contact),
      isOnHold: (webphoneSession) => {
        return isOnHold(webphoneSession);
      },
    };
  }
}
