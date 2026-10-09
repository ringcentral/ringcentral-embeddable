import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';

import { baseBrandConfig } from '../base/baseBrandConfig';

/**
 * Spring UI ships no Rainbow theme, so this brand keeps the default Juno light theme.
 */
export const brandConfig: BrandConfig = {
  ...baseBrandConfig,
  id: '2110',
  code: 'rainbow',
  name: 'Rainbow Office',
  shortName: 'Rainbow Office',
  appName: 'Rainbow Office Embeddable',
  application: 'Rainbow Office Embeddable',
  fullName: 'Rainbow Office',
  defaultLocale: 'fr-FR',
  rcvTeleconference: 'https://video.rainbowoffice.com/teleconference',
  rcvProductName: 'Rainbow Office Video',
  rcvInviteMeetingContent:
    '{accountName} vous a invité à une réunion {rcvProductName}.\n\nVeuillez rejoindre la réunion à l’aide de ce lien :\n    {joinUri}{passwordTpl}',
  callWithJupiter: {
    link: 'https://app.rainbowoffice.com/',
    protocol: 'com.rainbowoffice.app://',
    name: 'Rainbow Office App',
  },
  callWithSoftphone: {
    protocol: 'rcmobile://',
    name: 'Rainbow Office Phone',
  },
  eulaLink: 'https://www.ringcentral.fr/legal/privacy-notice.html',
  styleVariable: {
    ...baseBrandConfig.styleVariable,
    'header-logo-width': '84px',
    'header-logo-height': '24px',
  },
  assets: {
    guides: [],
    logo: '/assets/rainbow/logo.svg',
    icon: '/assets/rainbow/icon.png',
  },
};
