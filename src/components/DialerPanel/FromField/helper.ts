import i18n from './i18n';

export function getPhoneNumberLabel(number: {
  phoneNumber: string;
  usageType: string;
  primary: boolean;
  label: string;
}, currentLocale?: string) {
  if (number.phoneNumber === 'anonymous') {
    return i18n.getString('Blocked', currentLocale);
  }
  if (number.label) {
    return number.label;
  }
  if (number.primary) {
    return i18n.getString('primary', currentLocale);
  }
  if (number.usageType) {
    return i18n.getString(number.usageType, currentLocale);
  }
  return '';
}
