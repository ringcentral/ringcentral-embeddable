import React from 'react';

import PropTypes from 'prop-types';

import {
  SettingsPanel,
} from '@ringcentral-integration/widgets/components/SettingsPanel';
import {
  LinkLineItem,
} from '@ringcentral-integration/widgets/components/SettingsPanel/LinkLineItem';

import AuthorizeSettingsSection
  from '../../components/AuthorizeSettingsSection';
import {
  ToggleSetting,
  ToggleSettings,
} from '../../components/ToggleSettings';

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
    showRingtoneSettings,
    disableNoiseReductionSetting,
    noiseReductionEnabled,
    showNoiseReductionSetting,
    onNoiseReductionChange,
  } = props;
  let authorization = null;
  const ringtone = (
    <LinkLineItem
      show={showRingtoneSettings}
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
  let noiseReduction = null;
  if (showNoiseReductionSetting) {
    noiseReduction = (
      <ToggleSetting
        name="Remove my background noise (Beta)"
        value={noiseReductionEnabled}
        onChange={onNoiseReductionChange}
        disabled={disableNoiseReductionSetting}
      />
    );
  }
  if (authorization || noiseReduction || thirdPartySettings.length > 0) {
    additional = (
      <section>
        {ringtone}
        {noiseReduction}
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

export default NewSettingsPanel;
