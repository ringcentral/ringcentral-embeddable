import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { HeadphonesFilledMd } from '@ringcentral/spring-icon';
import { Button, Icon, Text } from '@ringcentral/spring-ui';
import React from 'react';

import type { CxStage } from '../../services/RingCX/cxStage';
import i18n from './i18n';

export interface CxAgentTabPanelProps {
  readonly errorMessage: string | null;
  readonly onStart: () => void;
  readonly stage: CxStage;
}

export function CxAgentTabPanel({
  errorMessage,
  onStart,
  stage,
}: CxAgentTabPanelProps): React.ReactElement {
  const { t } = useLocale(i18n);
  const isError = stage === 'error';
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-6 text-center"
      data-sign="agentSessionShell"
    >
      <Icon
        className="mb-4 text-neutral-b2"
        size="xlarge"
        symbol={HeadphonesFilledMd}
      />
      <Text className="typography-title2 text-neutral-b0" component="h1">
        {t('agentTitle')}
      </Text>
      <Text className="mt-2 typography-body1 text-neutral-b2" component="p">
        {isError && errorMessage ? errorMessage : t('agentSessionDescription')}
      </Text>
      <Button className="mt-6" data-sign="startAgentSession" onClick={onStart}>
        {isError ? t('retryAgentSession') : t('startAgentSession')}
      </Button>
    </div>
  );
}
