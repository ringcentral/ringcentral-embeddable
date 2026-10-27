import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import suiAtosRich from '../themes/atosRich';

import { baseBrandConfig } from '../base/baseBrandConfig';

export const brandConfig: BrandConfig = {
  ...baseBrandConfig,
  id: '2020',
  code: 'atos',
  name: 'Unify Office',
  shortName: 'Unify Office',
  appName: 'Unify Office Embeddable',
  application: 'Unify Office Embeddable',
  fullName: 'Unify Office',
  rcvTeleconference: 'https://video.unifyoffice.com/teleconference',
  rcvProductName: 'Unify Office Video',
  callWithJupiter: {
    link: 'https://app.unifyoffice.com/',
    protocol: 'unifyoffice://',
    name: 'Unify Office App',
  },
  callWithSoftphone: {
    protocol: 'rcmobile://',
    name: 'Unify Office Phone',
  },
  eulaLink: 'https://www.ringcentral.com/de/de/legal/privacy-notice',
  theme: {
    ...baseBrandConfig.theme,
    force: true,
    suiThemeMap: {
      light: suiAtosRich,
    },
  },
  styleVariable: {
    ...baseBrandConfig.styleVariable,
    'header-logo-width': '84px',
    'header-logo-height': '24px',
  },
  assets: {
    guides: [],
    logo: '/assets/atos/logo.svg',
    icon: '/assets/atos/icon.png',
  },
};
