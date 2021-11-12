const path = require('path');

module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '2020',
    code: 'atos',
    name: 'Unify Office',
    shortName: 'Unify Office',
    appName: 'Unify Office Embeddable',
    fullName: 'Unify Office',
    allowJupiterUniversalLink: true,
    callWithJupiter: {
      default: {
        link: 'https://app.unifyoffice.com/',
        protocol: 'unifyoffice://',
        name: 'Unify Office (Jupiter) App',
      },
    },
    spartanProtocol: 'rcmobile://',
    rcvTeleconference: 'https://video.unifyoffice.com/teleconference',
    rcvProductName: 'Unify Office Video',
    assets: {
      logo: '/assets/atos/logo.svg',
      icon: '/assets/atos/icon.png',
    },
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/atos'),
};
