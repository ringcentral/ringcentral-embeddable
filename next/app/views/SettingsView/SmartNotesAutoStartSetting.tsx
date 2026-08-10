import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { SwitchLine } from '@ringcentral-integration/next-widgets/components';
import type { FunctionComponent } from 'react';
import React from 'react';

import i18n from './i18n';

interface SmartNotesAutoStartSettingProps {
  checked: boolean;
  disabled: boolean;
  readOnlyReason: string;
  onChange: () => void;
}

export const SmartNotesAutoStartSetting: FunctionComponent<
  SmartNotesAutoStartSettingProps
> = ({ checked, disabled, readOnlyReason, onChange }) => {
  const { t } = useLocale(i18n);
  return (
    <SwitchLine
      checked={checked}
      data-sign="AIAssistantAutoStart"
      disabled={disabled}
      onChange={onChange}
      title={readOnlyReason || undefined}
    >
      <div>
        <div>{t('autoStartAiAssistant')}</div>
        <div className="typography-descriptor text-neutral-b2">
          {t('autoStartAiAssistantDescription')}
        </div>
      </div>
    </SwitchLine>
  );
};
