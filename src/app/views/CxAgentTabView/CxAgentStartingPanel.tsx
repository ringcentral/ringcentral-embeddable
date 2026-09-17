import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { CircularProgressIndicator, Text } from '@ringcentral/spring-ui';
import React from 'react';

import i18n from './i18n';

export interface CxAgentStartingPanelProps {
  readonly onCancel: () => void;
  /**
   * The blocking spinner overlay owns the progress indicator while it is up,
   * so the page only shows its own spinner when the overlay is down.
   */
  readonly showSpinner: boolean;
}

/**
 * Setup page shown while the agent session is starting, so the user can leave
 * the flow before the session config form is available.
 */
export function CxAgentStartingPanel({
  onCancel,
  showSpinner,
}: CxAgentStartingPanelProps): React.ReactElement {
  const { t } = useLocale(i18n);
  return (
    <div
      className="flex h-full flex-col bg-neutral-base"
      data-sign="agentSessionStarting"
    >
      <AppHeaderNav override>
        <PageHeader onBackClick={onCancel}>{t('startSession')}</PageHeader>
      </AppHeaderNav>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {showSpinner ? <CircularProgressIndicator size="medium" /> : null}
        <Text className="typography-body1 text-neutral-b1">
          {t('loadingAgentSession')}
        </Text>
      </div>
      <AppFooterNav />
    </div>
  );
}
