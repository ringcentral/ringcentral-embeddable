import React from 'react';

import PropTypes from 'prop-types';

import {
  SettingsPanel,
} from '@ringcentral-integration/widgets/components/SettingsPanel';
import {
  LinkLineItem,
} from '@ringcentral-integration/widgets/components/SettingsPanel/LinkLineItem';
import {
  SwitchLineItem,
} from '@ringcentral-integration/widgets/components/SettingsPanel/SwitchLineItem';

import AuthorizeSettingsSection
  from '../../components/AuthorizeSettingsSection';
import { ThirdPartySettings } from '../../components/ThirdPartySettings';

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
    showAuthRedDot,
    thirdPartySettings,
    onSettingToggle,
    gotoRingtoneSettings,
    showRingtoneSettings,
    disableNoiseReductionSetting,
    noiseReductionEnabled,
    showNoiseReductionSetting,
    onNoiseReductionChange,
    gotoThirdPartySection,
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
        showAuthRedDot={showAuthRedDot}
      />
    );
  }
  const noiseReduction = (
    <SwitchLineItem
      customTitle="Enable noise reduction (Beta)"
      checked={noiseReductionEnabled}
      show={showNoiseReductionSetting}
      onChange={onNoiseReductionChange}
      disabled={disableNoiseReductionSetting}
    />
  );
  const additional = (
    <section>
      {ringtone}
      {noiseReduction}
      <ThirdPartySettings
        settings={thirdPartySettings}
        onToggle={onSettingToggle}
        goToSettingSection={(sectionId) => {
          gotoThirdPartySection(sectionId);
        }}
      />
      {authorization}
    </section>
  );
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
  gotoThirdPartySection: PropTypes.func.isRequired,
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
