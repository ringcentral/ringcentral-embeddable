import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import rcBlue from '@ringcentral-integration/next-core/themes/juno/rcBlue';

const defaultLocale = 'en-US';
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

export const brandConfig: BrandConfig = {
  id: '1210',
  code: 'rc',
  name: 'RingCentral',
  shortName: 'RingCentral',
  defaultLocale,
  supportedLocales,
  appName: 'RingCentral Embeddable',
  application: 'RingCentral Embeddable',
  fullName: 'RingCentral Embeddable',
  allowJupiterUniversalLink: false,
  teleconference: 'https://meetings.ringcentral.com/teleconference',
  rcvTeleconference: 'https://v.ringcentral.com/teleconference',
  rcmProductName: 'RingCentral Meetings',
  allowRegionSettings: true,
  rcvInviteMeetingContent:
    '{accountName} has invited you to a {rcvProductName} meeting.\n\nPlease join using this link:\n    {joinUri}{passwordTpl}',
  addRcvMeetingButtonText: 'Add {rcvProductName} meeting',
  editRcvMeetingButtonText: '{rcvProductName} meeting added',
  rcvProductName: 'RingCentral Video',
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
  callWithJupiter: {
    link: 'https://app.ringcentral.com/',
    protocol: 'rcapp://',
    name: 'RingCentral App',
    appDownloadUrl: {
      default:
        'https://www.ringcentral.com/apps/rc-app?utm_source=app-gallery&utm_campaign=featured',
    },
  },
  callWithSoftphone: {
    protocol: 'rcmobile://',
    name: 'RingCentral Phone',
  },
  isDisableSpartan: false,
  enableEDP: true,
  showFeedback: false,
  privacyNotice: 'https://www.ringcentral.com/legal/privacy-policy.html',
  // signupUrl: 'https://www.ringcentral.com/office/plansandpricing.html',
  eulaLink: 'https://www.ringcentral.com/legal/eulatos.html',
  subBrands: [],
  styleVariable: {
    'logo-aspect-ratio': 1,
  },
  assets: {
    guides: [],
    logo: '/assets/rc/logo.svg',
    icon: '/assets/rc/icon.svg',
  },
};
