import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import suiAvayaCustomized from '@ringcentral/spring-theme/themes/avayaCustomized';

import { baseBrandConfig } from '../base/baseBrandConfig';

export const brandConfig: BrandConfig = {
  ...baseBrandConfig,
  id: '6010',
  code: 'avaya',
  name: 'Avaya Cloud Office',
  shortName: 'Avaya Cloud Office',
  appName: 'Avaya Cloud Office Embeddable',
  application: 'Avaya Cloud Office Embeddable',
  fullName: 'Avaya Cloud Office',
  allowJupiterUniversalLink: true,
  teleconference: 'https://meetings.ringcentral.com/teleconference',
  rcvTeleconference: 'https://video.cloudoffice.avaya.com/teleconference',
  rcvProductName: 'Avaya Cloud Office Video',
  callWithJupiter: {
    link: 'https://app.cloudoffice.avaya.com/',
    protocol: 'rcapp://',
    name: 'Avaya Cloud App',
  },
  callWithSoftphone: {
    protocol: 'rcmobile://',
    name: 'Avaya Cloud Office Phone',
  },
  signupUrl: 'https://www.avaya.com/en/products/ucaas/cloud-office-pricing/',
  theme: {
    ...baseBrandConfig.theme,
    force: true,
    suiThemeMap: {
      light: suiAvayaCustomized,
    },
  },
  styleVariable: {
    ...baseBrandConfig.styleVariable,
    'header-logo-width': '108px',
    'header-logo-height': '18px',
  },
  assets: {
    guides: [],
    logo: '/assets/avaya/logo.svg',
    icon: '/assets/avaya/icon.svg',
  },
};
