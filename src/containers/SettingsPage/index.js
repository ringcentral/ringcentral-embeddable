import React from 'react';
import { connect } from 'react-redux';
import SettingsPanel from 'ringcentral-widgets/components/SettingsPanel';
import withPhone from 'ringcentral-widgets/lib/withPhone';
import {
  mapToFunctions as mapToBaseFunctions,
  mapToProps as mapToBaseProps,
} from 'ringcentral-widgets/containers/SettingsPage';

function mapToProps(_, {
  phone,
  ...props
}) {
  const {
    callLogger,
  } = phone;
  const baseProps = mapToBaseProps(_, {
    phone,
    ...props,
  });
  return {
    ...baseProps,
    showAutoLog: callLogger.ready,
    autoLogEnabled: callLogger.autoLog,
  };
}

function mapToFunctions(_, {
  phone,
  ...props
}) {
  const {
    callLogger,
  } = phone;
  const baseFunctions = mapToBaseFunctions(_, {
    phone,
    ...props,
  });
  return {
    ...baseFunctions,
    onAutoLogChange: (autoLog) => { callLogger.setAutoLog(autoLog); },
  };
}

const SettingsPage = withPhone(connect(
  mapToProps,
  mapToFunctions,
)(SettingsPanel));

export default SettingsPage;
