import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import suiBtRich from '@ringcentral/spring-theme/themes/btRich';

import { baseBrandConfig } from '../base/baseBrandConfig';

export const brandConfig: BrandConfig = {
  ...baseBrandConfig,
  id: '7710',
  code: 'bt',
  name: 'BT Cloud Work',
  shortName: 'BT Cloud Work',
  appName: 'BT Cloud Work Embeddable',
  application: 'BT Cloud Work Embeddable',
  fullName: 'BT Cloud Work',
  defaultLocale: 'en-GB',
  teleconference: 'https://meetings.btcloudphone.bt.com/teleconference',
  rcvTeleconference: 'https://video.cloudwork.bt.com/teleconference',
  rcmProductName: 'BT Cloud Work Meetings',
  rcvProductName: 'BT Cloud Work Video',
  rcvMeetingTopic: "{extensionName}'s {shortName} Video meeting",
  rcvSettingsTitle: '{shortName} Video meeting settings',
  callWithJupiter: {
    link: 'https://app.cloudwork.bt.com/',
    protocol: 'com.bt.cloudwork.app://',
    name: 'BT Cloud Work App',
  },
  callWithSoftphone: {
    protocol: 'rcbtmobile://',
    name: 'BT Cloud Work Phone',
  },
  eulaLink: 'https://www.bt.com/products/static/terms/terms-of-use.html',
  theme: {
    ...baseBrandConfig.theme,
    force: true,
    suiThemeMap: {
      light: suiBtRich,
    },
    variable: {
      c2dArrowColor: '#5514B4',
      addMeetingBtnColor: '#5514B4',
    },
  },
  styleVariable: {
    ...baseBrandConfig.styleVariable,
    'header-logo-width': '108px',
    'header-logo-height': '18px',
  },
  assets: {
    guides: [],
    logo: '/assets/bt/logo.svg',
    icon: '/assets/bt/icon.svg',
  },
};
