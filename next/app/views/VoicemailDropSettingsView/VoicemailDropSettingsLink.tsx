import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { useConnector } from '@ringcentral-integration/next-core';
import { LinkLine } from '@ringcentral-integration/next-widgets/components';
import React from 'react';

import type { VoicemailDrop } from '../../services/VoicemailDrop';
import i18n from '../VoicemailDropView/i18n';

export function VoicemailDropSettingsLink({
  voicemailDrop,
  onClick,
}: {
  voicemailDrop: VoicemailDrop;
  onClick: () => void;
}) {
  const { t } = useLocale(i18n);
  const enabled = useConnector(() => voicemailDrop.hasVoicemailDropPermission);

  if (!enabled) {
    return null;
  }

  return (
    <LinkLine data-sign="voicemailDropSettings" onClick={onClick}>
      {t('voicemailDrop')}
    </LinkLine>
  );
}
