import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { RefreshMd } from '@ringcentral/spring-icon';
import { CircularProgressIndicator, IconButton } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

import type { LeadHistoryRefreshProps } from './LeadInfoPanel.interface';
import i18n from './i18n';

/**
 * Refreshes a lead's history once it loaded, with a spinner while it loads.
 * Before the first load there is nothing to refresh.
 */
export const LeadHistoryRefresh: FunctionComponent<LeadHistoryRefreshProps> = ({
  history,
}) => {
  const { t } = useLocale(i18n);
  if (history.status === 'loading') {
    return <CircularProgressIndicator size="small" />;
  }
  if (history.status === 'idle') {
    return null;
  }
  return (
    <IconButton
      symbol={RefreshMd}
      variant="icon"
      color="neutral"
      size="small"
      onClick={history.load}
      data-sign="leadHistoryRefresh"
      aria-label={t('refresh')}
      TooltipProps={{ title: t('refresh') }}
    />
  );
};
