import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallsListUI as BaseCallsListUI } from '@ringcentral-integration/widgets/modules/CallsListUI';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { isRingingInboundCall } from '@ringcentral-integration/commons/lib/callLogHelpers';
import { isOnHold } from '@ringcentral-integration/commons/modules/Webphone/webphoneHelper';
import { computed } from '@ringcentral-integration/core';
import debounce from '@ringcentral-integration/commons/lib/debounce';

@Module({
  name: 'CallsListUI',
  deps: [
    'Auth',
    'Locale',
    'RouterInteraction',
    'ActivityMatcher',
    'ContactMatcher',
    'CallingSettings',
    'SmartNotes',
    'CallLog',
    { dep: 'ActiveCallControl', optional: true },
    { dep: 'ConferenceCall', optional: true },
    { dep: 'CallsListUIOptions', optional: true },
  ],
})
export class CallsListUI extends BaseCallsListUI {
  @computed((that: CallsListUI) => [
    that._deps.callHistory.latestCalls,
    that._deps.auth.token
  ])
  get recordings() {
    return this._deps.callHistory.latestCalls
      .filter((call) => !!call.recording)
      .map((call) => {
        return {
          ...call,
          recording: {
            ...call.recording,
            contentUri: `${call.recording.contentUri}?access_token=${this._deps.auth.accessToken}`,
          },
        }
      })
  }

  callType = 'all';

  getUIProps({
    showRingoutCallControl = false,
    showSwitchCall = false,
    showTransferCall = true,
    showHoldOnOtherDevice = false,
    showMergeCall,
    useCallControl,
    type = 'all',
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
      smartNotes,
      callLog,
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
      activeCalls: type !== 'recordings' ? callMonitor.calls : [],
      calls: type !== 'recordings' ? callHistory.latestCalls : this.recordings,
      isWide: true,
      type,
      aiNotedCallMapping: smartNotes.aiNotedCallMapping,
      loadingMoreCalls: callLog.loadingOldCalls,
      hasMoreCalls: callLog.hasMoreOldCalls && appFeatures.allowLoadMoreCalls,
    };
  }

  getUIFunctions({
    getAvatarUrl,
    callCtrlRoute = '/calls/active',
    ...props
  }) {
    const {
      routerInteraction,
      callLogger,
      activeCallControl,
      webphone,
      regionSettings,
      conferenceCall,
      contactMatcher,
      smartNotes,
      callLog,
      appFeatures,
    } = this._deps;
    return {
      ...super.getUIFunctions({
        callCtrlRoute,
        ...props,
      }),
      onLogCall: (async ({ call, contact, triggerType, redirect }) => {
        if (callLogger.showLogModal && triggerType !== 'viewLog') {
          routerInteraction.push(`/log/call/${call.sessionId}`);
          return;
        }
        await callLogger.logCall({
          call,
          contact,
          triggerType,
          redirect,
        });
      }),
      // hide default log & view contact button
      onViewContact: props.onViewContact || (({ contact: { type, id } }) => {
        routerInteraction.push(`/contacts/${type}/${id}?direct=true`);
      }),
      onRefreshContact: ({ phoneNumber }) => {
        contactMatcher.forceMatchNumber({ phoneNumber })
      },
      isLoggedContact(call, activity, contact) {
        return (
          activity &&
          contact &&
          activity.contact &&
          (
            activity.contact === contact.id ||
            activity.contactId === contact.id ||
            activity.contact.id === contact.id
          )
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
      onViewSmartNote: ({
        telephonySessionId,
        phoneNumber,
        contactName,
      }) => {
        smartNotes.setSession({
          id: telephonySessionId,
          status: 'Disconnected',
          phoneNumber: phoneNumber,
          contactName,
        });
      },
      onViewCalls: this.onViewCalls,
      loadMoreCalls: async () => {
        await callLog.fetchOldCalls(this.callType);
      },
      onLoadCalls: (type) => {
        if (type !== this.callType) {
          this.callType = type;
          if (callLog.oldCalls.length > 0) {
            callLog.clearOldCalls();
          }
        }
        if (!callLog.ready || !appFeatures.allowLoadMoreCalls) {
          return;
        }
        const calls = type === 'recordings' ? this.recordings : callLog.list;
        if (calls.length === 0) {
          callLog.fetchOldCalls(type);
        }
      }
    };
  }

  onViewCalls = debounce((calls) => {
    return this._deps.smartNotes.queryNotedCalls(calls.map(c => c.telephonySessionId));
  }, 300);
}
