import { format } from '@ringcentral-integration/phone-number';

import i18n from './i18n';

export interface FormatPhoneNumberProps {
  phoneNumber: string;
  countryCode?: string;
  currentLocale?: string;
}

export const formatPhoneNumber = ({
  phoneNumber,
  countryCode = 'US',
  currentLocale = 'en-US',
}: FormatPhoneNumberProps) => {
  if (phoneNumber && phoneNumber.includes('|')) {
    return phoneNumber;
  }
  return phoneNumber
    ? format({
        phoneNumber,
        countryCode,
      }) || phoneNumber
    : i18n.getString('unknown', currentLocale);
};
