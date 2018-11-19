import React from 'react';
import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';

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
    show: callLogSection.show,
    currentCall,
    currentLogCall: callLogSection.callsMapping[callLogSection.currentIdentify],
    currentLocale: locale.currentLocale,
  };
}

function mapToFunctions(_, {
  phone: {
    callLogSection,
  }
}) {
  return {
    onClose() {
      callLogSection.closeLogSection();
    },
    onSaveCallLog({ call, note }) {
      callLogSection.saveCallLog(callLogSection.currentIdentify, call, note);
    }
  };
}

const LogSectionModalPage = withPhone(connect(mapToProps, mapToFunctions)(LogSectionModal));

export default LogSectionModalPage;
