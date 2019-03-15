import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import SettingsPanel from 'ringcentral-widgets/components/SettingsPanel';
import withPhone from 'ringcentral-widgets/lib/withPhone';
import {
  mapToFunctions as mapToBaseFunctions,
  mapToProps as mapToBaseProps,
} from 'ringcentral-widgets/containers/SettingsPage';

import AuthorizeSettingsSection from '../../components/AuthorizeSettingsSection';

function NewSettingsPanel(props) {
  const {
    authorizationRegistered,
    thirdPartyAuthorized,
    onThirdPartyAuthorize,
    authorizedTitle,
    unauthorizedTitle,
    thirdPartyServiceName,
    thirdPartyContactSyncing,
  } = props;
  let additional = null;
  if (authorizationRegistered) {
    additional = (
      <AuthorizeSettingsSection
        serviceName={thirdPartyServiceName}
        authorized={thirdPartyAuthorized}
        contactSyncing={thirdPartyContactSyncing}
        onAuthorize={onThirdPartyAuthorize}
        authorizedTitle={authorizedTitle}
        unauthorizedTitle={unauthorizedTitle}
      />
    );
  }
  return (
    <SettingsPanel
      {...props}
      additional={additional}
    />
  );
}

NewSettingsPanel.propTypes = {
  authorizationRegistered: PropTypes.bool.isRequired,
  onThirdPartyAuthorize: PropTypes.func,
  thirdPartyAuthorized: PropTypes.bool,
  authorizedTitle: PropTypes.string,
  unauthorizedTitle: PropTypes.string,
  thirdPartyServiceName: PropTypes.string,
  thirdPartyContactSyncing: PropTypes.bool,
};

NewSettingsPanel.defaultProps = {
  onThirdPartyAuthorize: undefined,
  thirdPartyAuthorized: undefined,
  authorizedTitle: undefined,
  unauthorizedTitle: undefined,
  thirdPartyServiceName: undefined,
  thirdPartyContactSyncing: false,
};

function mapToProps(_, {
  phone,
  ...props
}) {
  const {
    callLogger,
    rolesAndPermissions,
    thirdPartyService,
    audioSettings,
  } = phone;
  const baseProps = mapToBaseProps(_, {
    phone,
    ...props,
  });
  return {
    ...baseProps,
    showAudio: audioSettings.availableDevices.length > 0 && rolesAndPermissions.callingEnabled,
    showAutoLog: callLogger.ready,
    autoLogEnabled: callLogger.autoLog,
    authorizationRegistered: thirdPartyService.authorizationRegistered,
    thirdPartyAuthorized: thirdPartyService.authorized,
    thirdPartyContactSyncing: thirdPartyService.contactSyncing,
    authorizedTitle: thirdPartyService.authorizedTitle,
    unauthorizedTitle: thirdPartyService.unauthorizedTitle,
    thirdPartyServiceName: thirdPartyService.serviceName,
  };
}

function mapToFunctions(_, {
  phone,
  ...props
}) {
  const {
    callLogger,
    thirdPartyService,
  } = phone;
  const baseFunctions = mapToBaseFunctions(_, {
    phone,
    ...props,
  });
  return {
    ...baseFunctions,
    onAutoLogChange: (autoLog) => { callLogger.setAutoLog(autoLog); },
    onThirdPartyAuthorize: () => thirdPartyService.authorizeService(),
  };
}

const SettingsPage = withPhone(connect(
  mapToProps,
  mapToFunctions,
)(NewSettingsPanel));

export default SettingsPage;
