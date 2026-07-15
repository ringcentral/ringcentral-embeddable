import type {
  SettingsViewOptions,
  SettingsViewPanelProps,
} from '@ringcentral-integration/micro-setting/src/app/views/SettingsView';
import { useConnector } from '@ringcentral-integration/next-core';
import type { FunctionComponent, ReactElement } from 'react';
import React from 'react';

import type { VoicemailDrop } from '../../services/VoicemailDrop';
import { VoicemailDropSettingsLink } from '../VoicemailDropSettingsView/VoicemailDropSettingsLink';

import { SettingsPanel } from './SettingsPanel';

interface CreateSettingsPanelOptions {
  readonly onVoicemailDropSettingsLinkClick: () => void;
  readonly voicemailDrop: VoicemailDrop;
}

/**
 * Creates the app settings panel with permission-aware Phone settings.
 */
export function createSettingsPanel({
  onVoicemailDropSettingsLinkClick,
  voicemailDrop,
}: CreateSettingsPanelOptions): NonNullable<SettingsViewOptions['component']> {
  const EmbeddableSettingsPanel: FunctionComponent<SettingsViewPanelProps> = (
    props,
  ): ReactElement => {
    const hasVoicemailDropSettings: boolean = useConnector(
      () => voicemailDrop.hasVoicemailDropPermission,
    );
    return (
      <SettingsPanel
        {...props}
        hasAdditionalPhoneItems={hasVoicemailDropSettings}
        additionalPhoneItems={
          hasVoicemailDropSettings ? (
            <VoicemailDropSettingsLink
              voicemailDrop={voicemailDrop}
              onClick={onVoicemailDropSettingsLinkClick}
            />
          ) : null
        }
      />
    );
  };
  return EmbeddableSettingsPanel;
}
