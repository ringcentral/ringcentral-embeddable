import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { LinkLine } from '@ringcentral-integration/next-widgets/components';
import React from 'react';

import i18n from './i18n';

/**
 * The settings link to the phone number format page.
 */
export function PhoneNumberFormatSettingsLink({
  onClick,
}: {
  onClick: () => void;
}): React.ReactElement {
  const { t } = useLocale(i18n);
  return (
    <LinkLine data-sign="phoneNumberFormat" onClick={onClick}>
      {t('phoneNumberFormat')}
    </LinkLine>
  );
}
