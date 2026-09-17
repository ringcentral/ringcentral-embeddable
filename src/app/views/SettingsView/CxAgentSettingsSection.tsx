import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  Line,
  LinkLine,
} from '@ringcentral-integration/next-widgets/components';
import { useConnector } from '@ringcentral-integration/next-core';
import { Button } from '@ringcentral/spring-ui';
import React from 'react';

import type { RingCX } from '../../services/RingCX';
import i18n from './i18n';

export interface CxAgentSettingsSectionProps {
  readonly onSessionInfoClick: () => void;
  readonly ringCX: RingCX;
}

export function CxAgentSettingsSection({
  onSessionInfoClick,
  ringCX,
}: CxAgentSettingsSectionProps): React.ReactElement | null {
  const { t } = useLocale(i18n);
  const { enabled, hasDynamicSessionModules, stage } = useConnector(() => ({
    enabled: ringCX.enabled,
    hasDynamicSessionModules: Boolean(
      ringCX.loaded && ringCX.cxAuth && ringCX.cxAgentSession,
    ),
    stage: ringCX.stage,
  }));
  if (!enabled) {
    return null;
  }
  if (stage === 'idle') {
    return (
      <LinkLine
        data-sign="startAgentSession"
        onClick={() => {
          void ringCX.startAgentSession();
        }}
      >
        {t('startAgentSession')}
      </LinkLine>
    );
  }
  if (stage !== 'ready' || !hasDynamicSessionModules) {
    return null;
  }
  return (
    <>
      <LinkLine data-sign="sessionInfo" onClick={onSessionInfoClick}>
        {t('sessionInfo')}
      </LinkLine>
      <Line
        data-sign="endAgentSession"
        endAdornment={
          <Button
            color="danger"
            size="small"
            variant="text"
            onClick={() => {
              void ringCX.endAgentSession();
            }}
          >
            {t('endAgentSession')}
          </Button>
        }
      >
        {t('agentSession')}
      </Line>
    </>
  );
}
