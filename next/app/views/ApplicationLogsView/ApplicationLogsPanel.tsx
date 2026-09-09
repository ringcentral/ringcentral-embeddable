import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { DownloadMd } from '@ringcentral/spring-icon';
import { Alert, Button, Icon, Text } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

import i18n from './i18n';

interface ApplicationLogsPanelProps {
  readonly isDownloading: boolean;
  readonly onBack: () => void;
  readonly onDownload: () => void;
}

/** Explains and downloads local application logs for manual support sharing. */
export const ApplicationLogsPanel: FunctionComponent<
  ApplicationLogsPanelProps
> = ({ isDownloading, onBack, onDownload }) => {
  const { t } = useLocale(i18n);
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <AppHeaderNav override>
        <PageHeader onBackClick={onBack}>{t('title')}</PageHeader>
      </AppHeaderNav>
      <main className="flex flex-auto flex-col gap-4 overflow-y-auto px-4 pb-4">
        <Text className="typography-mainText text-neutral-b1" component="p">
          {t('description')}
        </Text>
        <Alert severity="info">{t('localOnly')}</Alert>
        <Button
          data-sign="downloadApplicationLogs"
          disabled={isDownloading}
          fullWidth
          loading={isDownloading}
          startIcon={isDownloading ? undefined : <Icon symbol={DownloadMd} />}
          onClick={onDownload}
        >
          {t('download')}
        </Button>
        <Text className="typography-descriptor text-neutral-b2" component="p">
          {t('shareInstructions')}
        </Text>
      </main>
      <AppFooterNav />
    </div>
  );
};
