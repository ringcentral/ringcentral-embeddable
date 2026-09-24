import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { AppsMd, Xmd } from '@ringcentral/spring-icon';
import {
  EmptyState,
  IconButton,
  PageHeader,
  PageHeaderCenter,
  PageHeaderLeft,
  PageHeaderRight,
} from '@ringcentral/spring-ui';
import React from 'react';

import type { SideWidgetBlankInfo } from './getSideWidgetBlankInfo';
import i18n from './i18n';

/**
 * The side widget with no tab: explains what the drawer will show and lets
 * the user fold it.
 */
export function SideWidgetBlankView({
  info,
  onClose,
}: {
  info: SideWidgetBlankInfo;
  onClose: () => void;
}): React.ReactElement {
  const { t } = useLocale(i18n);
  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      data-sign="sideWidgetBlank"
    >
      <PageHeader variant="detached" className="flex-none">
        <PageHeaderLeft />
        <PageHeaderCenter />
        <PageHeaderRight>
          <IconButton
            variant="icon"
            color="secondary"
            size="medium"
            symbol={Xmd}
            data-sign="sideWidgetBlankClose"
            TooltipProps={{ title: t('close') }}
            onClick={onClose}
          />
        </PageHeaderRight>
      </PageHeader>
      <div className="flex flex-auto items-center justify-center px-4">
        <EmptyState
          icon={AppsMd}
          title={info.titleKey ? t(info.titleKey) : undefined}
          description={t(info.descriptionKey)}
          data-sign="sideWidgetBlankDescription"
        />
      </div>
    </div>
  );
}
