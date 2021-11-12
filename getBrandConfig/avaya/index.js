const path = require('path');

module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '6010',
    code: 'avaya',
    name: 'Avaya Cloud Office',
    shortName: 'Avaya Cloud Office',
    appName: 'Avaya Cloud Office Embeddable',
    fullName: 'Avaya Cloud Office',
    allowJupiterUniversalLink: true,
    callWithJupiter: {
      default: {
        link: 'https://app.cloudoffice.avaya.com/',
        protocol: 'rcapp://',
        name: 'Avaya Cloud App',
      },
    },
    spartanProtocol: 'rcmobile://',
    rcvTeleconference: 'https://video.cloudoffice.avaya.com/teleconference',
    rcvProductName: 'Avaya Cloud Office Video',
    assets: {
      logo: '/assets/avaya/logo.svg',
      icon: '/assets/avaya/icon.svg',
    },
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/avaya'),
};
