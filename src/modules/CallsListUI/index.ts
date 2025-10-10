import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallsListUI as BaseCallsListUI } from '@ringcentral-integration/widgets/modules/CallsListUI';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import {
  isRingingInboundCall,
  isInbound,
  isMissed,
} from '@ringcentral-integration/commons/lib/callLogHelpers';
import { isOnHold } from '@ringcentral-integration/commons/modules/Webphone/webphoneHelper';
import { computed, action, state } from '@ringcentral-integration/core';
import debounce from '@ringcentral-integration/commons/lib/debounce';
import { getCallContact } from '../../lib/callHelper';

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
    'SideDrawerUI',
    'ComposeTextUI',
    'CallLog',
    'ThirdPartyService',
    'PhoneNumberFormat',
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
      });
  }

  @state
  callType = 'all';

  @action
  setCallType(type) {
    this.callType = type;
  }

  @state
  filterType = 'All';

  @action
  setFilterType(type) {
    this.filterType = type;
  }

  @computed((that: CallsListUI) => [
    that._deps.callHistory.latestCalls,
    that._deps.auth.token,
    that.callType,
    that.filterType,
  ])
  get historyCalls() {
    if (this.callType === 'recordings') {
      return this.recordings;
    }
    if (this.filterType === 'All') {
      return this._deps.callHistory.latestCalls;
    }
    return this._deps.callHistory.latestCalls.filter((call) => {
      if (this.filterType === 'UnLogged') {
        return (
          !call.activityMatches ||
          call.activityMatches.length === 0 ||
          call.activityMatches.filter(m => m.type !== 'status').length === 0
        );
      }
      if (this.filterType === 'Logged') {
        return (
          call.activityMatches &&
          call.activityMatches.length > 0 &&
          call.activityMatches.filter(m => m.type !== 'status').length > 0
        );
      }
      if (this.filterType === 'Missed') {
        return isInbound(call) && isMissed(call);
      }
      if (this.filterType === 'Inbound') {
        return isInbound(call);
      }
      if (this.filterType === 'Outbound') {
        return !isInbound(call);
      }
      return true;
    });
  }

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
      thirdPartyService,
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
      hideEditLogButton: callLogger.hideEditLogButton,
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
      calls: this.historyCalls,
      isWide: true,
      type,
      aiNotedCallMapping: smartNotes.aiNotedCallMapping,
      loadingMoreCalls: callLog.loadingOldCalls,
      hasMoreCalls: (
        callLog.hasMoreOldCalls &&
        appFeatures.allowLoadMoreCalls &&
        callHistory.searchInput === '' &&
        (
          type === 'recordings' || (
            this.filterType !== 'UnLogged' &&
            this.filterType !== 'Missed'
          )
        )
      ),
      searchInput: callHistory.searchInput,
      filterType: this.filterType,
      additionalActions: thirdPartyService.additionalCallActions,
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
      callHistory,
      sideDrawerUI,
      composeTextUI,
      callMonitor,
      phoneNumberFormat,
      accountInfo,
      extensionInfo,
      thirdPartyService,
    } = this._deps;
    return {
      ...super.getUIFunctions({
        callCtrlRoute,
        ...props,
      }),
      onLogCall: (async ({ call, contact, triggerType, redirect }) => {
        if (callLogger.showLogModal && triggerType !== 'viewLog') {
          sideDrawerUI.gotoLogCall(call.sessionId, getCallContact(call));
          // routerInteraction.push(`/log/call/${call.sessionId}`);
          return;
        }
        if (contact && call.toNumberEntity !== contact.id) {
          call.toNumberEntity = contact.id;
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
        contactMatcher.setManualRefreshNumber(phoneNumber);
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
      webphoneHangup: (sessionId: string) => {
        callMonitor.allCallsClickHangupTrack();
        return webphone?.hangup(sessionId);
      },
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
        callMonitor.allCallsClickHoldTrack();
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
        activeCallControl?.clickSwitchTrack?.()
        return session;
      },
      webphoneIgnore: (telephonySessionId) =>
        activeCallControl?.ignore(telephonySessionId),
      ringoutHangup: async (...args) => {
        callMonitor.allCallsClickHangupTrack();
        return activeCallControl?.hangUp(...args);
      },
      ringoutTransfer: (sessionId) => {
        routerInteraction.push(`/transfer/${sessionId}/active`);
      },
      ringoutReject: async (sessionId) => {
        callMonitor.allCallsClickRejectTrack();
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
          callMonitor.callItemClickTrack();
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
            callMonitor.callItemClickTrack();
          }
        }
      },
      updateSessionMatchedContact: ({
        webphoneSessionId,
        telephonySessionId,
        contact,
      }) => {
        if (webphoneSessionId) {
          webphone.updateSessionMatchedContact(webphoneSessionId, contact)
        }
        if (telephonySessionId) {
          contactMatcher.setCallMatched({
            telephonySessionId,
            toEntityId: contact.id
          });
        }
      },
      isOnHold: (webphoneSession) => {
        return isOnHold(webphoneSession);
      },
      onViewSmartNote: ({
        telephonySessionId,
        phoneNumber,
        contact,
        direction,
      }) => {
        smartNotes.viewSmartNote({
          id: telephonySessionId,
          status: 'Disconnected',
          phoneNumber: phoneNumber,
          contact,
          direction,
        });
      },
      onViewCalls: this.onViewCalls,
      loadMoreCalls: async () => {
        const query: {
          isRecording?: boolean;
          direction?: string;
        } = {}
        if (this.callType === 'recordings') {
          query.isRecording = true;
        } else {
          if (this.filterType === 'Inbound') {
            query.direction = 'Inbound';
          } else if (this.filterType === 'Outbound') {
            query.direction = 'Outbound';
          }
        }
        await callLog.fetchOldCalls(query);
      },
      onLoadCalls: (type, filterType) => {
        if (type !== this.callType) {
          this.setCallType(type);
          if (callLog.oldCalls.length > 0) {
            callLog.clearOldCalls();
          }
        }
        if (!callLog.ready || !appFeatures.allowLoadMoreCalls) {
          return;
        }
        if (this.historyCalls.length === 0) {
          const query: {
            isRecording?: boolean;
            direction?: string;
          } = {}
          if (type === 'recordings') {
            query.isRecording = true;
          } else {
            if (filterType === 'Inbound') {
              query.direction = 'Inbound';
            } else if (filterType === 'Outbound') {
              query.direction = 'Outbound';
            }
          }
          callLog.fetchOldCalls(query);
        }
      },
      onSearchInputChange : (value) => {
        callHistory.updateSearchInput(value);
        callHistory.debouncedSearch();
      },
      onFilterTypeChange: (value) => {
        const oldValue = this.filterType;
        if (value !== this.filterType) {
          this.setFilterType(value);
        }
        if (oldValue !== 'All' && callLog.oldCalls.length > 0) {
          callLog.clearOldCalls();
        }
      },
      onViewCallDetails: (telephonySessionId) => {
        const call = callHistory.latestCalls.find((call) => call.telephonySessionId === telephonySessionId);
        if (!call) {
          return;
        };
        sideDrawerUI.gotoCallDetails(telephonySessionId, getCallContact(call));
      },
      onClickToSms: appFeatures.hasComposeTextPermission ? async (contact, isDummyContact = false) => {
        composeTextUI.gotoComposeText(contact, isDummyContact);
        callHistory.onClickToSMS();
      } : undefined,
      onClickAdditionalAction: (buttonId, resource = undefined) => {
        thirdPartyService.onClickAdditionalButton(buttonId, resource);
      },
      formatPhone: (phoneNumber: string) =>
        phoneNumberFormat.format({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        }),
    };
  }

  onViewCalls = debounce((calls) => {
    return this._deps.smartNotes.queryNotedCalls(calls.map(c => c.telephonySessionId));
  }, 300);
}
