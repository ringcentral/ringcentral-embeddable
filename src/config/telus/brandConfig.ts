import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import suiTelusRich from '@ringcentral/spring-theme/themes/telusRich';

import { baseBrandConfig } from '../base/baseBrandConfig';

export const brandConfig: BrandConfig = {
  ...baseBrandConfig,
  id: '7310',
  code: 'telus',
  name: 'TELUS Business Connect',
  shortName: 'TELUS Business Connect',
  appName: 'TELUS Business Connect Embeddable',
  application: 'TELUS Business Connect Embeddable',
  fullName: 'TELUS Business Connect',
  allowJupiterUniversalLink: true,
  teleconference: 'https://meetings.businessconnect.telus.com/teleconference',
  rcvTeleconference: 'https://video.businessconnect.telus.com/teleconference',
  rcmProductName: 'TELUS Business Connect Meetings',
  rcvProductName: 'Business Connect Video Meeting',
  rcvMeetingTopic: "{extensionName}'s Business Connect Video meeting",
  rcvSettingsTitle: 'Business Connect Video meeting settings',
  rcvInviteMeetingContent:
    '{accountName} has invited you to a TELUS Business Connect Video meeting.\n\nPlease join using this link:\n    {joinUri}{passwordTpl}',
  callWithJupiter: {
    link: 'https://app.businessconnect.telus.com/',
    protocol: 'rctelus://',
    name: 'TELUS Business Connect App',
  },
  callWithSoftphone: {
    protocol: 'rctelus://',
    name: 'TELUS Business Connect Phone',
  },
  eulaLink: 'http://telus.com/BusinessConnect/ServiceTerms',
  theme: {
    ...baseBrandConfig.theme,
    force: true,
    suiThemeMap: {
      light: suiTelusRich,
    },
    variable: {
      c2dArrowColor: '#66cc00',
      addMeetingBtnColor: '#57a708',
    },
  },
  styleVariable: {
    ...baseBrandConfig.styleVariable,
    'header-logo-width': '84px',
    'header-logo-height': '18px',
  },
  assets: {
    guides: [],
    logo: '/assets/telus/logo.svg',
    icon: '/assets/telus/icon.svg',
  },
};
