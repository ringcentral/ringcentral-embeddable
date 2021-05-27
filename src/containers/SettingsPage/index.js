import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import SettingsPanel from 'ringcentral-widgets/components/SettingsPanel';
import withPhone from 'ringcentral-widgets/lib/withPhone';
import { LinkLineItem } from 'ringcentral-widgets/components/SettingsPanel/SettingItems/LinkLineItem';
import AuthorizeSettingsSection from '../../components/AuthorizeSettingsSection';
import ToggleSettings from '../../components/ToggleSettings';

function NewSettingsPanel(props) {
  const {
    authorizationRegistered,
    thirdPartyAuthorized,
    onThirdPartyAuthorize,
    authorizedTitle,
    unauthorizedTitle,
    thirdPartyServiceName,
    thirdPartyContactSyncing,
    authorizationLogo,
    authorizedAccount,
    thirdPartySettings,
    onSettingToggle,
    gotoRingtoneSettings,
  } = props;
  let authorization = null;
  let ringtone = (
    <LinkLineItem
      show
      customTitle="Ringtone"
      currentLocale={props.currentLocale}
      onClick={gotoRingtoneSettings}
    />
  );
  let additional = ringtone;
  if (authorizationRegistered) {
    authorization = (
      <AuthorizeSettingsSection
        serviceName={thirdPartyServiceName}
        authorized={thirdPartyAuthorized}
        contactSyncing={thirdPartyContactSyncing}
        onAuthorize={onThirdPartyAuthorize}
        authorizedTitle={authorizedTitle}
        unauthorizedTitle={unauthorizedTitle}
        authorizationLogo={authorizationLogo}
        authorizedAccount={authorizedAccount}
      />
    );
  }
  if (authorization || thirdPartySettings.length > 0) {
    additional = (
      <section>
        ringtone
        <ToggleSettings
          settings={thirdPartySettings}
          onToggle={onSettingToggle}
        />
        {authorization}
      </section>
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
  authorizationLogo: PropTypes.string,
  authorizedAccount: PropTypes.string,
  thirdPartySettings: PropTypes.array,
  onSettingToggle: PropTypes.func,
};

NewSettingsPanel.defaultProps = {
  onThirdPartyAuthorize: undefined,
  thirdPartyAuthorized: undefined,
  authorizedTitle: undefined,
  unauthorizedTitle: undefined,
  thirdPartyServiceName: undefined,
  thirdPartyContactSyncing: false,
  authorizationLogo: undefined,
  authorizedAccount: undefined,
  thirdPartySettings: [],
  onSettingToggle: undefined
};

function mapToProps(_, {
  phone,
  ...props
}) {
  const {
    callLogger,
    conversationLogger,
    rolesAndPermissions,
    thirdPartyService,
    audioSettings,
    settingsUI,
  } = phone;
  const baseProps = settingsUI.getUIProps({
    phone,
    ...props,
  });
  return {
    ...baseProps,
    version: props.appVersion,
    showAudio: audioSettings.availableDevices.length > 0 && rolesAndPermissions.callingEnabled,
    showAutoLog: callLogger.ready,
    autoLogEnabled: callLogger.autoLog,
    showAutoLogSMS: conversationLogger.loggerSourceReady,
    autoLogSMSEnabled: conversationLogger.autoLog,
    authorizationRegistered: thirdPartyService.authorizationRegistered,
    thirdPartyAuthorized: thirdPartyService.authorized,
    thirdPartyContactSyncing: thirdPartyService.contactSyncing,
    authorizedTitle: thirdPartyService.authorizedTitle,
    unauthorizedTitle: thirdPartyService.unauthorizedTitle,
    thirdPartyServiceName: thirdPartyService.serviceName,
    authorizationLogo: thirdPartyService.authorizationLogo,
    authorizedAccount: thirdPartyService.authorizedAccount,
    showFeedback: thirdPartyService.showFeedback,
    thirdPartySettings: thirdPartyService.settings,
    autoLogSMSTitle: 'Auto log messages',
  };
}

function mapToFunctions(_, {
  phone,
  ...props
}) {
  const {
    callLogger,
    conversationLogger,
    thirdPartyService,
    settingsUI,
    routerInteraction,
  } = phone;
  return {
    ...settingsUI.getUIFunctions({ phone, ...props }),
    onAutoLogChange(autoLog) { callLogger.setAutoLog(autoLog); },
    onAutoLogSMSChange(autoLog) { conversationLogger.setAutoLog(autoLog); },
    onThirdPartyAuthorize: () => thirdPartyService.authorizeService(),
    onFeedbackSettingsLinkClick() {
      thirdPartyService.onShowFeedback();
    },
    onSettingToggle: setting => thirdPartyService.onSettingToggle(setting),
    gotoRingtoneSettings: () => routerInteraction.push('/settings/ringtone'),
  };
}

const SettingsPage = withPhone(connect(
  mapToProps,
  mapToFunctions,
)(NewSettingsPanel));

export default SettingsPage;
