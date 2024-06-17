import React from 'react';
import { RcButton } from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';

import Line from '@ringcentral-integration/widgets/components/Line';
import {
  LinkLineItem,
} from '@ringcentral-integration/widgets/components/SettingsPanel/LinkLineItem';
import {
  SwitchLineItem,
} from '@ringcentral-integration/widgets/components/SettingsPanel/SwitchLineItem';

import AuthorizeSettingsSection from '../../components/AuthorizeSettingsSection';

const LineWrapper = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

function ButtonLineItem({
  name,
  buttonLabel,
  onClick,
}) {
  return (
    <Line>
      <LineWrapper>
        {name}
        <RcButton
          size="small"
          color="action.primary"
          onClick={onClick}
        >
          {buttonLabel}
        </RcButton>
      </LineWrapper>
    </Line>
  );
}

const Empty = () => null;

export function AdditionalSettings({
  currentLocale,
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
  gotoThirdPartySection,
  onThirdPartyButtonClick,
  showAutoLog = false,
  autoLogTitle,
  autoLogEnabled = false,
  disableAutoLogEnabled = false,
  onAutoLogChange = Empty,
  autoLogSMSEnabled = false,
  showAutoLogSMS = false,
  autoLogSMSTitle,
  onAutoLogSMSChange,
}) {
  const additionalItems = [];
  if (showRingtoneSettings) {
    additionalItems.push({
      order: 2000,
      id: 'ringtone',
      component: (
        <LinkLineItem
          show={showRingtoneSettings}
          customTitle="Ringtone"
          currentLocale={currentLocale}
          onClick={gotoRingtoneSettings}
        />
      ),
    });
  }
  if (showAutoLog) {
    additionalItems.push({
      order: 3000,
      id: 'autoLogCalls',
      component: (
        <SwitchLineItem
          name="autoLogCalls"
          dataSign="AutoLogCall"
          show={showAutoLog}
          customTitle={autoLogTitle}
          currentLocale={currentLocale}
          disabled={disableAutoLogEnabled}
          checked={autoLogEnabled}
          onChange={onAutoLogChange}
        />
      ),
    });
  }
  if (showAutoLogSMS) {
    additionalItems.push({
      order: 4000,
      id: 'autoLogSMS',
      component: (
        <SwitchLineItem
          name="autoLogSMS"
          dataSign="AutoLogSMS"
          customTitle={autoLogSMSTitle}
          show={showAutoLogSMS}
          currentLocale={currentLocale}
          checked={autoLogSMSEnabled}
          onChange={onAutoLogSMSChange}
        />
      ),
    });
  }
  thirdPartySettings.forEach((setting, index) => {
    let item;
    if (setting.type === 'section') {
      item = (
        <LinkLineItem
          key={setting.id || setting.name}
          customTitle={setting.name}
          currentLocale={setting.currentLocale}
          onClick={() => {
            gotoThirdPartySection(setting.id);
          }}
          show
        />
      );
    } else if (setting.type === 'button') {
      item = (
        <ButtonLineItem
          key={setting.id || setting.name}
          name={setting.name}
          buttonLabel={setting.buttonLabel}
          onClick={() => {
            onThirdPartyButtonClick(setting.id);
          }}
        />
      );
    } else {
      item = (
        <SwitchLineItem
          key={setting.id || setting.name}
          customTitle={setting.name}
          show
          dataSign={`thirdPartySettings-${setting.name}`}
          checked={setting.value}
          onChange={() => {
            onSettingToggle(setting);
          }}
        />
      );
    }
    additionalItems.push({
      order: setting.order || (8000 + index),
      id: setting.id || setting.name,
      component: item,
    });
  });
  if (authorizationRegistered) {
    const authorization = (
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
    additionalItems.push({
      order: 9000,
      id: 'authorization',
      component: authorization,
    });
  }
  return (
    <>
      {
        additionalItems
          .sort((a, b) => a.order - b.order)
          .map(item => (
            <div key={item.id}>
              {item.component}
            </div>
          ))
      }
    </>
  );
}
