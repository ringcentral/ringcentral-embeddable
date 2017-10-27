import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Alert from 'ringcentral-integration/modules/Alert';
import Locale from 'ringcentral-integration/modules/Locale';

import AlertDisplay from 'ringcentral-widget/components/AlertDisplay';

import AuthAlert from 'ringcentral-widget/components/AuthAlert';
import CallAlert from 'ringcentral-widget/components/CallAlert';
import CallingSettingsAlert from 'ringcentral-widget/components/CallingSettingsAlert';
import RegionSettingsAlert from 'ringcentral-widget/components/RegionSettingsAlert';
import MessageSenderAlert from 'ringcentral-widget/components/MessageSenderAlert';
import RateExceededAlert from 'ringcentral-widget/components/RateExceededAlert';
import ConnectivityAlert from 'ringcentral-widget/components/ConnectivityAlert';
import WebphoneAlert from 'ringcentral-widget/components/WebphoneAlert';
import RolesAndPermissionsAlert from 'ringcentral-widget/components/RolesAndPermissionsAlert';

import ErrorAlert from '../../components/ErrorAlert';

function mapToProps(_, {
  locale,
  alert,
}) {
  return {
    currentLocale: locale.currentLocale,
    messages: alert.messages,
  };
}

function getDefaultRenderer({
  rateLimiter,
  brand,
  router,
  regionSettingsUrl,
  callingSettingsUrl,
}) {
  const onRegionSettingsLinkClick = () => {
    router.push(regionSettingsUrl);
  };
  const onCallingSettingsLinkClick = () => {
    router.push(callingSettingsUrl);
  };
  return (message) => {
    if (AuthAlert.handleMessage(message)) {
      return AuthAlert;
    }
    if (CallAlert.handleMessage(message)) {
      return props => (
        <CallAlert
          {...props}
          brand={brand}
          onAreaCodeLinkClick={onRegionSettingsLinkClick}
        />
      );
    }
    if (CallingSettingsAlert.handleMessage(message)) {
      return props => (
        <CallingSettingsAlert
          {...props}
          brand={brand.fullName}
          onCallingSettingsLinkClick={onCallingSettingsLinkClick}
        />
      );
    }

    if (RegionSettingsAlert.handleMessage(message)) {
      return props => (
        <RegionSettingsAlert
          {...props}
          onRegionSettingsLinkClick={onRegionSettingsLinkClick}
        />
      );
    }

    if (MessageSenderAlert.handleMessage(message)) {
      return props => (
        <MessageSenderAlert
          {...props}
          onAreaCodeLink={onRegionSettingsLinkClick}
        />
      );
    }

    if (RateExceededAlert.handleMessage(message)) {
      return props => (
        <RateExceededAlert
          {...props}
          timestamp={rateLimiter.timestamp}
          duration={rateLimiter._throttleDuration} />
      );
    }

    if (ConnectivityAlert.handleMessage(message)) {
      return ConnectivityAlert;
    }

    if (WebphoneAlert.handleMessage(message)) {
      return WebphoneAlert;
    }
    if (RolesAndPermissionsAlert.handleMessage(message)) {
      return props => (
        <RolesAndPermissionsAlert
          {...props}
          brand={brand.fullName}
          application={brand.application} />
      );
    }

    if (ErrorAlert.handleMessage(message)) {
      return ErrorAlert;
    }

    return undefined;
  };
}

function mapToFunctions(_, {
  rateLimiter,
  brand,
  alert,
  router,
  regionSettingsUrl,
  callingSettingsUrl,
  getRenderer = getDefaultRenderer({
    rateLimiter,
    brand,
    router,
    regionSettingsUrl,
    callingSettingsUrl,
  }),
}) {
  return {
    getRenderer,
    dismiss: (id) => {
      alert.dismiss(id);
    },
  };
}

const AlertContainer = connect(
  mapToProps,
  mapToFunctions
)(AlertDisplay);

AlertContainer.propTypes = {
  alert: PropTypes.instanceOf(Alert).isRequired,
  getRenderer: PropTypes.func,
  locale: PropTypes.instanceOf(Locale).isRequired,
};
AlertContainer.defaultProps = {
  getRenderer: undefined,
};

export default AlertContainer;
