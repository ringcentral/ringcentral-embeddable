import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';

import { baseBrandConfig } from '../base/baseBrandConfig';

export const brandConfig: BrandConfig = {
  ...baseBrandConfig,
  id: '1210',
  code: 'rc',
  name: 'RingCentral',
  shortName: 'RingCentral',
  appName: 'RingCentral Embeddable',
  application: 'RingCentral Embeddable',
  fullName: 'RingCentral Embeddable',
  teleconference: 'https://meetings.ringcentral.com/teleconference',
  rcvTeleconference: 'https://v.ringcentral.com/teleconference',
  rcmProductName: 'RingCentral Meetings',
  rcvProductName: 'RingCentral Video',
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
  privacyNotice: 'https://www.ringcentral.com/legal/privacy-policy.html',
  signupUrl: 'https://www.ringcentral.com/office/plansandpricing.html',
  eulaLink: 'https://www.ringcentral.com/legal/eulatos.html',
  styleVariable: {
    ...baseBrandConfig.styleVariable,
    'header-logo-width': '92px',
    'header-logo-height': '14px',
  },
  assets: {
    guides: [],
    logo: '/assets/rc/logo.svg',
    icon: '/assets/rc/icon.svg',
  },
};
