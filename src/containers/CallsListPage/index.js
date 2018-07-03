import { connect } from 'react-redux';
import formatNumber from 'ringcentral-integration/lib/formatNumber';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import CallsListPanel from 'ringcentral-widgets/components/CallsListPanel';

function mapToProps(_, {
  phone: {
    brand,
    callLogger,
    callMonitor,
    locale,
    regionSettings,
    rolesAndPermissions,
    callHistory,
    connectivityMonitor,
    rateLimiter,
    dateTimeFormat,
    call,
    composeText,
  },
  showContactDisplayPlaceholder = false,
  enableContactFallback = false,
}) {
  return {
    currentLocale: locale.currentLocale,
    activeRingCalls: callMonitor.activeRingCalls,
    activeOnHoldCalls: callMonitor.activeOnHoldCalls,
    activeCurrentCalls: callMonitor.activeCurrentCalls,
    otherDeviceCalls: callMonitor.otherDeviceCalls,
    areaCode: regionSettings.areaCode,
    countryCode: regionSettings.countryCode,
    outboundSmsPermission: !!(
      rolesAndPermissions.permissions &&
      rolesAndPermissions.permissions.OutboundSMS
    ),
    internalSmsPermission: !!(
      rolesAndPermissions.permissions &&
      rolesAndPermissions.permissions.InternalSMS
    ),
    // showSpinner: false,
    brand: brand.fullName,
    showContactDisplayPlaceholder,
    autoLog: !!(callLogger && callLogger.autoLog),
    enableContactFallback,
    calls: callHistory.calls,
    disableLinks: !connectivityMonitor.connectivity ||
    rateLimiter.throttling,
    disableClickToDial: !(call && call.isIdle),
    loggingMap: (callLogger && callLogger.loggingMap),
    showSpinner: !(
      callHistory.ready &&
      locale.ready &&
      regionSettings.ready &&
      dateTimeFormat.ready &&
      connectivityMonitor.ready &&
      (!rolesAndPermissions || rolesAndPermissions.ready) &&
      (!call || call.ready) &&
      (!composeText || composeText.ready) &&
      (!callLogger || callLogger.ready)
    ),
  };
}

function mapToFunctions(_, {
  phone: {
    callLogger,
    composeText,
    contactMatcher,
    contactSearch,
    regionSettings,
    routerInteraction,
    webphone,
    dateTimeFormat,
    call,
    dialerUI,
    callHistory,
  },
  composeTextRoute = '/composeText',
  callCtrlRoute = '/calls/active',
  isLoggedContact,
  onViewContact,
  dateTimeFormatter = ({ utcTimestamp }) => dateTimeFormat.formatDateTime({
    utcTimestamp,
  }),
  dialerRoute = '/dialer',
}) {
  return {
    formatPhone: phoneNumber => formatNumber({
      phoneNumber,
      areaCode: regionSettings.areaCode,
      countryCode: regionSettings.countryCode,
    }),
    webphoneAnswer: (...args) => (webphone && webphone.answer(...args)),
    webphoneToVoicemail: (...args) => (webphone && webphone.toVoiceMail(...args)),
    webphoneReject: (...args) => (webphone && webphone.reject(...args)),
    webphoneHangup: (...args) => (webphone && webphone.hangup(...args)),
    webphoneResume: async (...args) => {
      if (!webphone) {
        return;
      }
      await webphone.resume(...args);
      if (routerInteraction.currentPath !== callCtrlRoute) {
        routerInteraction.push(callCtrlRoute);
      }
    },
    isLoggedContact,
    dateTimeFormatter,
    onViewContact: onViewContact || (({ contact: { type, id } }) => {
      routerInteraction.push(`/contacts/${type}/${id}?direct=true`);
    }),
    onClickToDial: dialerUI ?
      (recipient) => {
        if (call.isIdle) {
          routerInteraction.push(dialerRoute);
          dialerUI.call({ recipient });
          callHistory.onClickToCall();
        }
      } :
      undefined,
    onClickToSms: composeText ?
      async (contact, isDummyContact = false) => {
        if (routerInteraction) {
          routerInteraction.push(composeTextRoute);
        }
        // if contact autocomplete, if no match fill the number only
        if (contact.name && contact.phoneNumber && isDummyContact) {
          composeText.updateTypingToNumber(contact.name);
          contactSearch.search({ searchString: contact.name });
        } else {
          composeText.addToNumber(contact);
          if (composeText.typingToNumber === contact.phoneNumber) {
            composeText.cleanTypingToNumber();
          }
        }
        callHistory.onClickToSMS();
      } :
      undefined,
  };
}

const CallsListPage = withPhone(connect(mapToProps, mapToFunctions)(CallsListPanel));

export default CallsListPage;
