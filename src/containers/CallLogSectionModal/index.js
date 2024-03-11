import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';
import LogSectionModal from '../../components/LogSectionModal';

function mapToProps(_, {
  phone: {
    callLogSection,
    locale,
    callLogger,
    thirdPartyService,
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
    customizedPageData: thirdPartyService.customizedLogCallPageData,
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
    thirdPartyService,
  }
}) {
  return {
    onClose() {
      callLogSection.closeLogSection();
    },
    onSaveCallLog({ call, note, input }) {
      callLogSection.saveCallLog(callLogSection.currentIdentify, call, note, input);
    },
    onLoadData(call) {
      activityMatcher.match({
        queries: [call.sessionId],
        ignoreCache: true
      });
      thirdPartyService.fetchCustomizedLogCallPageData({
        call,
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
    onCustomizedFieldChange: (call, input, key) => {
      thirdPartyService.onCustomizedLogCallPageInputChanged({
        call,
        input,
        key,
      });
    },
  };
}

const LogSectionModalPage = withPhone(connect(mapToProps, mapToFunctions)(LogSectionModal));

export default LogSectionModalPage;
