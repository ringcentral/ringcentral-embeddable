import React from 'react';

import { SettingsPanel } from './SettingsPanel';

import { AdditionalSettings } from './AdditionalSettings';
import { AuthSettingsSection } from './AuthSettingsSection';

function NewSettingsPanel({
  authorizationRegistered,
  thirdPartyAuthorized,
  onThirdPartyAuthorize,
  thirdPartyServiceName,
  thirdPartyServiceInfo,
  thirdPartyContactSyncing,
  authorizationLogo,
  authorizedAccount,
  showAuthRedDot,
  authorizedTitle,
  unauthorizedTitle,
  ...props
}) {
  let thirdPartyAuthorization = null;
  if (authorizationRegistered) {
    thirdPartyAuthorization = (
      <AuthSettingsSection
        serviceName={thirdPartyServiceName}
        serviceInfo={thirdPartyServiceInfo}
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
  return (
    <SettingsPanel
      {
        ...props
      }
      showAutoLog={false}
      showAutoLogSMS={false}
      thirdPartyAuthorizationSetting={thirdPartyAuthorization}
      additional={
        <AdditionalSettings
          {...props}
        />
      }
    />
  );
}

export default NewSettingsPanel;
