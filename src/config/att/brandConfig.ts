import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import suiAttRich from '../themes/attRich';

import { baseBrandConfig } from '../base/baseBrandConfig';

export const brandConfig: BrandConfig = {
  ...baseBrandConfig,
  id: '3460',
  code: 'att',
  name: 'Office@Hand',
  shortName: 'Office@Hand',
  appName: 'Office@Hand Embeddable',
  application: 'Office@Hand Embeddable',
  fullName: 'Office@Hand',
  allowJupiterUniversalLink: true,
  teleconference: 'https://meetings-officeathand.att.com/teleconference',
  rcvTeleconference: 'https://meetings.officeathand.att.com/teleconference',
  rcmProductName: 'AT&T Office@Hand Meeting',
  rcvProductName: 'AT&T Office@Hand Meetings',
  rcvMeetingTopic: "{extensionName}'s {brandName} Meetings",
  rcvSettingsTitle: '{brandName} Meetings settings',
  callWithJupiter: {
    link: 'https://app.officeathand.att.com/',
    protocol: 'officeathand://',
    name: 'Office@Hand App',
  },
  callWithSoftphone: {
    protocol: 'attvr20://',
    name: 'Office@Hand Phone',
    appDownloadUrl: {
      mac: 'https://www.ringcentral.com/apps/officeathand-mac',
      windows: 'https://www.ringcentral.com/apps/officeathand-windows',
    },
  },
  eulaLink: 'http://www.att.com/officeathandpolicy',
  subBrands: [{ id: '3420', code: 'attub' }],
  theme: {
    ...baseBrandConfig.theme,
    force: true,
    suiThemeMap: {
      light: suiAttRich,
    },
    variable: {
      c2dArrowColor: '#ffffff',
      addMeetingBtnColor: '#067ab4',
    },
  },
  styleVariable: {
    ...baseBrandConfig.styleVariable,
    'header-logo-width': '84px',
    'header-logo-height': '18px',
  },
  assets: {
    guides: [],
    logo: '/assets/att/logo.svg',
    icon: '/assets/att/icon.svg',
  },
};
