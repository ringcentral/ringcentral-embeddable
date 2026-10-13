import type {
  SettingsViewOptions,
  SettingsViewPanelProps,
} from '@ringcentral-integration/micro-setting/src/app/views/SettingsView';
import { useConnector } from '@ringcentral-integration/next-core';
import type { FunctionComponent, ReactElement } from 'react';
import React from 'react';

import { ThirdPartyAuthSettings } from '../../components/ThirdPartyAuthSettings';
import type { RingCX } from '../../services/RingCX';
import type { ThirdParty } from '../../services/ThirdParty';
import type { SmartNotes } from '../../services/SmartNotes';
import type { VoicemailDrop } from '../../services/VoicemailDrop';
import { PhoneNumberFormatSettingsLink } from '../PhoneNumberFormatSettingView/PhoneNumberFormatSettingsLink';
import { VoicemailDropSettingsLink } from '../VoicemailDropSettingsView/VoicemailDropSettingsLink';

import { SettingsPanel } from './SettingsPanel';
import { CxAgentSettingsSection } from './CxAgentSettingsSection';
import { SmartNotesAutoStartSetting } from './SmartNotesAutoStartSetting';

interface CreateSettingsPanelOptions {
  readonly onAgentSessionInfoClick: () => void;
  readonly onManualDialSettingsClick: () => void;
  readonly onPhoneNumberFormatSettingsClick: () => void;
  readonly onThirdPartySectionClick: (sectionId: string) => void;
  readonly onVoicemailDropSettingsLinkClick: () => void;
  readonly smartNotes: SmartNotes;
  readonly ringCX?: RingCX;
  readonly thirdParty: ThirdParty;
  readonly voicemailDrop: VoicemailDrop;
}

/**
 * Creates the app settings panel with permission-aware Phone settings.
 */
export function createSettingsPanel({
  onAgentSessionInfoClick,
  onManualDialSettingsClick,
  onPhoneNumberFormatSettingsClick,
  onThirdPartySectionClick,
  onVoicemailDropSettingsLinkClick,
  smartNotes,
  ringCX,
  thirdParty,
  voicemailDrop,
}: CreateSettingsPanelOptions): NonNullable<SettingsViewOptions['component']> {
  const EmbeddableSettingsPanel: FunctionComponent<SettingsViewPanelProps> = (
    props,
  ): ReactElement => {
    const hasVoicemailDropSettings: boolean = useConnector(
      () => voicemailDrop.hasVoicemailDropPermission,
    );
    const isRingCXEnabled: boolean = useConnector(
      () => ringCX?.enabled ?? false,
    );
    const smartNotesSettings = useConnector(() => ({
      checked: smartNotes.autoStartSmartNote,
      disabled: smartNotes.autoStartSmartNoteReadOnly,
      readOnlyReason: smartNotes.autoStartSmartNoteReadOnlyReason,
      visible:
        smartNotes.hasPermission &&
        smartNotes.clientInitialized &&
        smartNotes.showSmartNote,
    }));
    const thirdPartyAuth = useConnector(() => ({
      authorizationLogo: thirdParty.authorizationLogo,
      authorizationLinks: thirdParty.authorizationLinks,
      authorizationRegistered: thirdParty.authorizationRegistered,
      authorized: thirdParty.authorized,
      authorizedAccount: thirdParty.authorizedAccount,
      authorizedTitle: thirdParty.authorizedTitle,
      contactSyncing: thirdParty.contactSyncing,
      licenseDescription: thirdParty.licenseDescription,
      licenseStatus: thirdParty.licenseStatus,
      licenseStatusColor: thirdParty.licenseStatusColor,
      serviceInfo: thirdParty.serviceInfo,
      serviceName: thirdParty.displayName || thirdParty.serviceName,
      showAuthButton: thirdParty.showAuthButton,
      showAuthRedDot: thirdParty.showAuthRedDot,
      unauthorizedTitle: thirdParty.unauthorizedTitle,
    }));
    const thirdPartySettings = useConnector(() => thirdParty.settings);
    return (
      <SettingsPanel
        {...props}
        // 3.x listed the phone number format after the theme.
        appearanceItemCount={1}
        appearanceItems={
          <PhoneNumberFormatSettingsLink
            onClick={onPhoneNumberFormatSettingsClick}
          />
        }
        agentSettings={
          isRingCXEnabled && ringCX ? (
            <CxAgentSettingsSection
              ringCX={ringCX}
              onManualDialClick={onManualDialSettingsClick}
              onSessionInfoClick={onAgentSessionInfoClick}
            />
          ) : null
        }
        thirdPartySettings={thirdPartySettings}
        onThirdPartyButtonClick={(buttonId) => {
          void thirdParty.onClickSettingButton(buttonId);
        }}
        onThirdPartySectionClick={onThirdPartySectionClick}
        onThirdPartySettingChange={(setting, value) => {
          void thirdParty.onUpdateSetting({ ...setting, value });
        }}
        thirdPartyAuthSettings={
          thirdPartyAuth.authorizationRegistered &&
          thirdPartyAuth.serviceName ? (
            <ThirdPartyAuthSettings
              authorizationLogo={thirdPartyAuth.authorizationLogo}
              authorizationLinks={thirdPartyAuth.authorizationLinks}
              authorized={Boolean(thirdPartyAuth.authorized)}
              authorizedAccount={thirdPartyAuth.authorizedAccount}
              authorizedTitle={thirdPartyAuth.authorizedTitle}
              contactSyncing={thirdPartyAuth.contactSyncing}
              licenseDescription={thirdPartyAuth.licenseDescription}
              licenseStatus={thirdPartyAuth.licenseStatus}
              licenseStatusColor={thirdPartyAuth.licenseStatusColor}
              serviceInfo={thirdPartyAuth.serviceInfo}
              serviceName={thirdPartyAuth.serviceName}
              showAuthButton={thirdPartyAuth.showAuthButton}
              showAuthRedDot={thirdPartyAuth.showAuthRedDot}
              unauthorizedTitle={thirdPartyAuth.unauthorizedTitle}
              onAuthorize={() => thirdParty.authorizeService()}
              onLicenseRefresh={() => thirdParty.onClickLicenseRefreshButton()}
            />
          ) : null
        }
        hasAdditionalPhoneItems={
          hasVoicemailDropSettings || smartNotesSettings.visible
        }
        additionalPhoneItems={
          <>
            {hasVoicemailDropSettings ? (
              <VoicemailDropSettingsLink
                voicemailDrop={voicemailDrop}
                onClick={onVoicemailDropSettingsLinkClick}
              />
            ) : null}
            {smartNotesSettings.visible ? (
              <SmartNotesAutoStartSetting
                checked={smartNotesSettings.checked}
                disabled={smartNotesSettings.disabled}
                readOnlyReason={smartNotesSettings.readOnlyReason}
                onChange={() => smartNotes.toggleAutoStartSmartNote()}
              />
            ) : null}
          </>
        }
      />
    );
  };
  return EmbeddableSettingsPanel;
}
