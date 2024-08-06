import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

import { BasePanel } from '@ringcentral-integration/widgets/components/SettingsPanel/BasePanel';
// import { ClickToDial } from '@ringcentral-integration/widgets/components/SettingsPanel/ClickToDial';

import { PresenceSettingSection } from './PresenceSettingSection';
import type { SettingsPanelProps } from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import { LinkLineItem, SwitchLineItem } from './SettingItem';

const Empty = (): null => null;

interface NewSettingsPanelProps extends SettingsPanelProps {
  thirdPartyAuthorizationSetting?: ReactNode | null;
}

export const SettingsPanel: FunctionComponent<NewSettingsPanelProps> = ({
  additional,
  autoLogEnabled = false,
  autoLogNotesEnabled = false,
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
  disableAutoLogNotesEnabled = false,
  disableAutoLogSMSEnabled = false,
  dndStatus,
  eulaLabel,
  eulaLink,
  onEulaLinkClick,
  privacyNoticeLabel,
  privacyNoticeLink,
  isCallQueueMember,
  loginNumber,
  // logSMSContentEnabled = true,
  // logSMSContentTitle,
  onAudioSettingsLinkClick,
  onAutoLogChange = Empty,
  onAutoLogNotesChange = Empty,
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
  showAutoLogNotes = false,
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
  thirdPartyAuthorizationSetting = null,
}) => {
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
        privacyNoticeLabel,
        privacyNoticeLink,
        loginNumber,
        onLogoutButtonClick,
        version,
        versionContainer,
      }}
    >
      {thirdPartyAuthorizationSetting}
      <LinkLineItem
        name="calling"
        dataSign="calling"
        show={showCalling}
        currentLocale={currentLocale}
        onClick={onCallingSettingsLinkClick}
      />
      <LinkLineItem
        name="region"
        dataSign="region"
        show={showRegion}
        currentLocale={currentLocale}
        onClick={onRegionSettingsLinkClick}
      />
      <LinkLineItem
        name="audio"
        show={showAudio}
        currentLocale={currentLocale}
        onClick={onAudioSettingsLinkClick}
      />
      {
        showPresenceSettings && dndStatus && userStatus ? (
          <PresenceSettingSection
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
        ) : null
      }
      
      {children}
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
      <SwitchLineItem
        name="autoLogNotes"
        dataSign="AutoLogNotes"
        show={showAutoLogNotes}
        currentLocale={currentLocale}
        disabled={disableAutoLogNotesEnabled}
        checked={autoLogNotesEnabled}
        onChange={onAutoLogNotesChange}
      />
      <SwitchLineItem
        name="autoLogSMS"
        dataSign="AutoLogSMS"
        customTitle={autoLogSMSTitle}
        show={showAutoLogSMS}
        currentLocale={currentLocale}
        disabled={disableAutoLogSMSEnabled}
        checked={autoLogSMSEnabled}
        onChange={onAutoLogSMSChange}
      />
      {/* <SwitchLineItem
        name="logSMSContent"
        dataSign="LogSMSContent"
        customTitle={logSMSContentTitle}
        show={showLogSMSContent}
        currentLocale={currentLocale}
        checked={logSMSContentEnabled}
        onChange={onLogSMSContentChange}
      /> */}
      {/* <ClickToDial
        currentLocale={currentLocale}
        showClickToDial={showClickToDial}
        outboundSMS={outboundSMS}
        clickToCallPermission={clickToCallPermission}
        clickToDialEnabled={clickToDialEnabled}
        onClickToDialChange={onClickToDialChange}
        clickToDialTitle={clickToDialTitle}
      /> */}
      {additional}
    </BasePanel>
  );
};