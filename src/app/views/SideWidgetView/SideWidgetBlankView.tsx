import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { AppsMd } from '@ringcentral/spring-icon';
import { EmptyState } from '@ringcentral/spring-ui';
import React from 'react';

import type { SideWidgetBlankInfo } from './getSideWidgetBlankInfo';
import { SideWidgetPageHeader } from './SideWidgetPageHeader';
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
      <SideWidgetPageHeader
        onClose={onClose}
        closeLabel={t('close')}
        closeDataSign="sideWidgetBlankClose"
        bordered={false}
      />
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
