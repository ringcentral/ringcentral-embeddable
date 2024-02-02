import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';
import LogSectionModal from '../../components/LogSectionModal';

function mapToProps(_, {
  phone: {
    callLogSection,
    locale,
    callLogger,
  }
}) {
  let currentCall = null;
  if (callLogSection.ready) {
    currentCall = callLogger.allCallMapping[callLogSection.currentIdentify];
  }
  return {
    open: callLogSection.show,
    currentCall,
    currentLogCall: callLogSection.callsMapping[callLogSection.currentIdentify],
    currentLocale: locale.currentLocale,
  };
}

function mapToFunctions(_, {
  phone: {
    callLogSection,
    activityMatcher,
    regionSettings,
    accountInfo,
    extensionInfo,
    dateTimeFormat,
  }
}) {
  return {
    onClose() {
      callLogSection.closeLogSection();
    },
    onSaveCallLog({ call, note }) {
      callLogSection.saveCallLog(callLogSection.currentIdentify, call, note);
    },
    onLoadData(call) {
      activityMatcher.match({
        queries: [call.sessionId],
        ignoreCache: true
      });
    },
    formatPhone: (phoneNumber) =>
      formatNumber({
        phoneNumber,
        areaCode: regionSettings.areaCode,
        countryCode: regionSettings.countryCode,
        maxExtensionLength: accountInfo.maxExtensionNumberLength,
        isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
        siteCode: extensionInfo.site?.code,
      }),
    dateTimeFormatter: (({ utcTimestamp }) =>
      dateTimeFormat.formatDateTime({
        utcTimestamp,
      })),
  };
}

const LogSectionModalPage = withPhone(connect(mapToProps, mapToFunctions)(LogSectionModal));

export default LogSectionModalPage;
