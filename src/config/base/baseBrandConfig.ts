import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import rcBlue from '@ringcentral-integration/next-core/themes/juno/rcBlue';

const supportedLocales = [
  'en-US',
  'en-GB',
  'en-AU',
  'fr-FR',
  'fr-CA',
  'de-DE',
  'it-IT',
  'es-419',
  'es-ES',
  'ja-JP',
  'pt-PT',
  'pt-BR',
  'zh-CN',
  'zh-TW',
  'zh-HK',
  'nl-NL',
  'ko-KR',
  'fi-FI',
];

/**
 * Brand-neutral defaults shared by every brand config.
 * Each brand spreads this object and overrides its own identity, links and theme.
 */
export const baseBrandConfig: Partial<BrandConfig> = {
  defaultLocale: 'en-US',
  supportedLocales,
  allowJupiterUniversalLink: false,
  allowRegionSettings: true,
  rcvInviteMeetingContent:
    '{accountName} has invited you to a {rcvProductName} meeting.\n\nPlease join using this link:\n    {joinUri}{passwordTpl}',
  addRcvMeetingButtonText: 'Add {rcvProductName} meeting',
  editRcvMeetingButtonText: '{rcvProductName} meeting added',
  rcvMeetingTopic: "{extensionName}'s {brandName} Video meeting",
  rcvSettingsTitle: '{brandName} Video meeting settings',
  meetingUriReg: {
    rcm: '((((green-meetings\\.gw|meetings|rcm.*|meetings-officeathand)\\.(ringcentral|btcloudphone\\.bt|businessconnect\\.telus|att)))\\.com',
    rcv: '(((.+\\.ringcentral)|(meetings\\.officeathand\\.att)|(video\\..+)',
  },
  conference: {
    dialInNumbersLink: 'https://ringcentr.al/2L14jqL',
    inviteText:
      'Please join the {brandName} conference.\n\nDial-In Number: {formattedDialInNumber} \n{additionalNumbersSection} \nParticipant Access: {participantCode} \n\nNeed an international dial-in phone number? Please visit {dialInNumbersLink} \n\nThis conference call is brought to you by {brandName} Conferencing.',
  },
  theme: {
    defaultTheme: 'light',
    themeMap: {
      light: rcBlue,
    },
    variable: {
      c2dArrowColor: '#ff8800',
      addMeetingBtnColor: '#ff8800',
    },
  },
  isDisableSpartan: true,
  enableEDP: true,
  showFeedback: false,
  subBrands: [],
  styleVariable: {
    'logo-aspect-ratio': 1,
  },
};
