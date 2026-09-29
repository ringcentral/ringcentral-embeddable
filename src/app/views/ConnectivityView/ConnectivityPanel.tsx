import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  Announcement,
  CircularProgressIndicator,
} from '@ringcentral/spring-ui';
import React from 'react';

import type { ConnectivityViewProps } from './ConnectivityView.interface';
import i18n from '../../../ringcx/views/CxConnectivityView/i18n';

/**
 * Renders the unified host and RingCX connectivity announcement.
 */
export function ConnectivityPanel({
  mode,
  severity,
  loading,
  onClick,
  retry,
  ...rest
}: ConnectivityViewProps): React.ReactElement | null {
  const { t } = useLocale(i18n);
  if (!mode) {
    return null;
  }
  return (
    <Announcement
      severity={severity}
      className="rounded-none"
      classes={{ body: 'gap-2' }}
      data-sign="ConnectivityBadge"
      action={
        loading ? (
          <CircularProgressIndicator
            title={t('connecting')}
            color={severity === 'info' ? 'primary' : 'danger'}
            size="small"
          />
        ) : retry ? (
          <button
            className="typography-subtitleMini hover:underline active:opacity-80"
            onClick={onClick}
            data-sign="ConnectivityBadgeRefresh"
          >
            {t('refresh')}
          </button>
        ) : null
      }
      {...rest}
    >
      {t(mode as never)}
    </Announcement>
  );
}
