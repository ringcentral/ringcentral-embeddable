import type { FunctionComponent } from 'react';
import React from 'react';

import { BasePanel } from '@ringcentral-integration/widgets/components/SettingsPanel/BasePanel';

import { PresenceSettingSection } from './PresenceSettingSection';
import type { SettingsPanelProps } from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import { LinkLineItem, SwitchLineItem, ButtonLineItem } from './SettingItem';
import { AuthSettingsSection } from './AuthSettingsSection';

const Empty = (): null => null;

type ThirdPartySettings = {
  id?: string;
  name: string;
  type: string;
  buttonLabel?: string;
  value?: boolean;
  order?: number;
}

type SettingItem = {
  type: string;
  id: string;
  name?: string;
  dataSign?: string;
  show: boolean;
  onClick?: (...args: any[]) => any;
  customTitle?: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (...args: any[]) => any;
  buttonLabel?: string;
  order: number;
}

interface NewSettingsPanelProps extends SettingsPanelProps {
  thirdPartyAuth?: {
    serviceName: string;
    serviceInfo?: string;
    authorized: boolean;
    authorizedTitle?: string;
    unauthorizedTitle?: string;
    contactSyncing?: boolean;
    authorizationLogo?: string;
    authorizedAccount?: string;
    showAuthRedDot?: boolean;
  } | null;
  onThirdPartyAuthorize?: () => void;
  disableAutoLogSMSEnabled?: boolean;
  thirdPartySettings?: ThirdPartySettings[];
  gotoThirdPartySection: (id: string) => void;
  onThirdPartyButtonClick: (id: string) => void;
  onSettingToggle: (setting: any) => void;
}

export const SettingsPanel: FunctionComponent<NewSettingsPanelProps> = ({
  additional,
  autoLogEnabled = false,
  // autoLogNotesEnabled = false,
  autoLogSMSEnabled = false,
  autoLogSMSTitle,
  autoLogTitle,
  children,
  className,
  // clickToDialEnabled = false,
  // clickToCallPermission = false,
  // clickToDialTitle,
  currentLocale,
  disableAutoLogEnabled = false,
  // disableAutoLogNotesEnabled = false,
  disableAutoLogSMSEnabled = false,
  dndStatus,
  eulaLabel,
  eulaLink,
  onEulaLinkClick,
  isCallQueueMember,
  loginNumber,
  // logSMSContentEnabled = true,
  // logSMSContentTitle,
  onAudioSettingsLinkClick,
  onAutoLogChange = Empty,
  // onAutoLogNotesChange = Empty,
  onAutoLogSMSChange,
  onCallingSettingsLinkClick,
  // onClickToDialChange,
  onLogoutButtonClick,
  // onLogSMSContentChange = Empty,
  onRegionSettingsLinkClick,
  openPresenceSettings = false,
  // outboundSMS = false,
  setAvailable = Empty,
  setBusy = Empty,
  setDoNotDisturb = Empty,
  setInvisible = Empty,
  showAudio = false,
  showAutoLog = false,
  // showAutoLogNotes = false,
  showAutoLogSMS = false,
  showCalling = false,
  // showClickToDial = false,
  showHeader = false,
  // showLogSMSContent = false,
  showPresenceSettings = true,
  showRegion = false,
  showSpinner = false,
  toggleAcceptCallQueueCalls = Empty,
  userStatus,
  version,
  versionContainer,
  thirdPartyAuth = null,
  onThirdPartyAuthorize,
  thirdPartySettings = [],
  gotoThirdPartySection,
  onThirdPartyButtonClick,
  onSettingToggle,
}) => {
  let settingsItems: SettingItem[] = [{
    type: 'link',
    id: 'calling',
    name: 'calling',
    dataSign: 'calling',
    show: showCalling,
    onClick: onCallingSettingsLinkClick,
    order: 100,
  }, {
    type: 'link',
    id: 'audio',
    name: 'audio',
    dataSign: 'audio',
    show: showAudio,
    onClick: onAudioSettingsLinkClick,
    order: 200,
  }, {
    type: 'link',
    id: 'region',
    name: 'region',
    dataSign: 'region',
    show: showRegion,
    onClick: onRegionSettingsLinkClick,
    order: 300,
  }, {
    type: 'presence',
    id: 'presence',
    order: 400,
    show: !!(showPresenceSettings && dndStatus && userStatus),
  }, {
    id: 'autoLogCalls',
    type: 'switch',
    name: 'autoLogCalls',
    dataSign: 'AutoLogCall',
    show: showAutoLog,
    customTitle: autoLogTitle,
    disabled: disableAutoLogEnabled,
    checked: autoLogEnabled,
    onChange: onAutoLogChange,
    order: 3000,
  }, {
    id: 'autoLogSMS',
    type: 'switch',
    name: 'autoLogSMS',
    dataSign: 'AutoLogSMS',
    customTitle: autoLogSMSTitle,
    show: showAutoLogSMS,
    disabled: disableAutoLogSMSEnabled,
    checked: autoLogSMSEnabled,
    onChange: onAutoLogSMSChange,
    order: 4000,
  }];
  thirdPartySettings.forEach((item, index) => {
    if (item.type === 'section') {
      settingsItems.push({
        type: 'link',
        id: item.id || item.name,
        name: item.name,
        dataSign: item.name,
        show: true,
        onClick: () => gotoThirdPartySection(item.id),
        order: item.order || (8000 + index),
      });
      return;
    }
    if (item.type === 'button') {
      settingsItems.push({
        type: 'button',
        id: item.id || item.name,
        name: item.name,
        dataSign: item.name,
        buttonLabel: item.buttonLabel || 'Open',
        show: true,
        onClick: () => onThirdPartyButtonClick(item.id),
        order: item.order || (8000 + index),
      });
      return;
    }
    settingsItems.push({
      type: 'switch',
      id: item.id || item.name,
      name: item.name,
      customTitle: item.name,
      dataSign: `thirdPartySettings-${item.name}`,
      checked: item.value,
      show: true,
      onChange: () => onSettingToggle(item),
      order: item.order || (8000 + index),
    });
  });
  settingsItems = settingsItems.sort((a, b) => a.order - b.order);
  return (
    <BasePanel
      {...{
        currentLocale,
        className,
        showSpinner,
        showHeader,
        eulaLabel,
        eulaLink,
        onEulaLinkClick,
        loginNumber,
        onLogoutButtonClick,
        version,
        versionContainer,
      }}
    >
      {
        thirdPartyAuth ? (
          <AuthSettingsSection
            serviceName={thirdPartyAuth.serviceName}
            serviceInfo={thirdPartyAuth.serviceInfo}
            authorized={thirdPartyAuth.authorized}
            authorizedTitle={thirdPartyAuth.authorizedTitle}
            unauthorizedTitle={thirdPartyAuth.unauthorizedTitle}
            contactSyncing={thirdPartyAuth.contactSyncing}
            authorizationLogo={thirdPartyAuth.authorizationLogo}
            authorizedAccount={thirdPartyAuth.authorizedAccount}
            showAuthRedDot={thirdPartyAuth.showAuthRedDot}
            onAuthorize={onThirdPartyAuthorize}
          />
        ) : null
      }
      {
        settingsItems.map((item) => {
          if (item.type === 'link') {
            return (
              <LinkLineItem
                key={item.id}
                name={item.name}
                dataSign={item.dataSign}
                show={item.show}
                currentLocale={currentLocale}
                onClick={item.onClick}
              />
            );
          }
          if (item.type === 'switch') {
            return (
              <SwitchLineItem
                key={item.id}
                name={item.name}
                customTitle={item.customTitle}
                dataSign={item.dataSign}
                show={item.show}
                currentLocale={currentLocale}
                disabled={item.disabled}
                checked={item.checked}
                onChange={item.onChange}
              />
            );
          }
          if (item.type === 'presence' && item.show) {
            return (
              <PresenceSettingSection
                key={item.id}
                dndStatus={dndStatus}
                userStatus={userStatus}
                currentLocale={currentLocale}
                isCallQueueMember={isCallQueueMember}
                setAvailable={setAvailable}
                setBusy={setBusy}
                setDoNotDisturb={setDoNotDisturb}
                setInvisible={setInvisible}
                toggleAcceptCallQueueCalls={toggleAcceptCallQueueCalls}
                showPresenceSettings={openPresenceSettings}
              />
            );
          }
          if (item.type === 'button') {
            return (
              <ButtonLineItem
                key={item.id}
                name={item.name}
                buttonLabel={item.buttonLabel}
                onClick={item.onClick}
              />
            );
          }
        })
      }
      {children}
      {additional}
    </BasePanel>
  );
};
