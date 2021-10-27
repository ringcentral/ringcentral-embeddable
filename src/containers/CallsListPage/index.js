import React from 'react';
import { connect } from 'react-redux';
import formatNumber from '@ringcentral-integration/commons/lib/formatNumber';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import CallsListPanel from '@ringcentral-integration/widgets/components/CallsListPanel';
import LogIcon from '../../components/LogIcon';

const EMPTY_CALLS = [];

function mapToProps(_, {
  phone: {
    brand,
    callLogger,
    locale,
    regionSettings,
    appFeatures,
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
    useNewList: true,
    onlyHistory: true,
    currentLocale: locale.currentLocale,
    activeRingCalls: EMPTY_CALLS,
    activeOnHoldCalls: EMPTY_CALLS,
    activeCurrentCalls: EMPTY_CALLS,
    otherDeviceCalls: EMPTY_CALLS,
    areaCode: regionSettings.areaCode,
    countryCode: regionSettings.countryCode,
    outboundSmsPermission: appFeatures.hasOutboundSMSPermission,
    internalSmsPermission: appFeatures.hasInternalSMSPermission,
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
      appFeatures.ready &&
      (!call || call.ready) &&
      (!composeText || composeText.ready)
    ),
    readTextPermission: appFeatures.hasReadTextPermissions,
    width: window.innerWidth || 300,
    height: window.innerHeight ? (window.innerHeight - 53) : 454,
  };
}

function mapToFunctions(_, {
  phone: {
    callLogger,
    callLogSection,
    composeText,
    contactSearch,
    regionSettings,
    routerInteraction,
    dateTimeFormat,
    call,
    dialerUI,
    callHistory,
    locale,
  },
  composeTextRoute = '/composeText',
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
    renderExtraButton: (call) => {
      const sessionId = call.sessionId;
      if (!callLogger.ready) {
        return null;
      }
      const isSaving = callLogger.loggingMap[sessionId];
      const disabled = call.type === messageTypes.fax;
      const isFax = call.type === messageTypes.fax;
      const matcher = call.activityMatches && call.activityMatches[0];
      return (
        <LogIcon
          id={matcher ? matcher.id.toString() : null}
          sessionId={sessionId}
          isSaving={isSaving}
          disabled={disabled}
          isFax={isFax}
          onClick={() => {
            if (callLogger.showLogModal) {
              callLogSection.handleLogSection(call);
            } else {
              callLogger.logCall({
                call,
              });
            }
          }}
          currentLocale={locale.currentLocale}
          logTitle={callLogger.logButtonTitle}
        />
      );
    },
  };
}

const CallsListPage = withPhone(connect(mapToProps, mapToFunctions)(CallsListPanel));

export default CallsListPage;
