import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import withPhone from 'ringcentral-widgets/lib/withPhone';
import AlertDisplay from 'ringcentral-widgets/components/AlertDisplay';
import AuthAlert from 'ringcentral-widgets/components/AuthAlert';
import CallAlert from 'ringcentral-widgets/components/CallAlert';
import CallingSettingsAlert from 'ringcentral-widgets/components/CallingSettingsAlert';
import RegionSettingsAlert from 'ringcentral-widgets/components/RegionSettingsAlert';
import MessageSenderAlert from 'ringcentral-widgets/components/MessageSenderAlert';
import RateExceededAlert from 'ringcentral-widgets/components/RateExceededAlert';
import ConnectivityAlert from 'ringcentral-widgets/components/ConnectivityAlert';
import WebphoneAlert from 'ringcentral-widgets/components/WebphoneAlert';
import RolesAndPermissionsAlert from 'ringcentral-widgets/components/RolesAndPermissionsAlert';

import ErrorAlert from '../../components/ErrorAlert';

function mapToProps(_, {
  phone: {
    locale,
    alert,
  },
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
  phone: {
    rateLimiter,
    brand,
    alert,
    routerInteraction,
  },
  regionSettingsUrl,
  callingSettingsUrl,
  getRenderer = getDefaultRenderer({
    rateLimiter,
    brand,
    routerInteraction,
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

const AlertContainer = withPhone(connect(
  mapToProps,
  mapToFunctions
)(AlertDisplay));

AlertContainer.propTypes = {
  getRenderer: PropTypes.func,
};
AlertContainer.defaultProps = {
  getRenderer: undefined,
};

export default AlertContainer;
