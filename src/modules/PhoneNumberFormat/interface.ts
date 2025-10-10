export type PhonNumberFormatter = (param: {
  phoneNumber: string,
  areaCode: string,
  countryCode: string,
  maxExtensionLength: number,
  isMultipleSiteEnabled: boolean,
  siteCode: string,
  type: string,
  isEDPEnabled: boolean,
  removeExtension: boolean,
}) => string;
