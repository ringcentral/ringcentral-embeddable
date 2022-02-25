const path = require('path');

module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '2110',
    code: 'rainbow',
    name: 'Rainbow Office',
    shortName: 'Rainbow Office',
    appName: 'Rainbow Office Embeddable',
    fullName: 'Rainbow Office',
    callWithJupiter: {
      default: {
        link: 'https://app.rainbowoffice.com/',
        protocol: 'com.rainbowoffice.app://',
        name: 'Rainbow Office App',
      },
    },
    spartanProtocol: 'rcmobile://',
    rcvTeleconference: 'https://video.rainbowoffice.com/teleconference',
    rcvProductName: 'Rainbow Office Video',
    assets: {
      logo: '/assets/rainbow/logo.svg',
      icon: '/assets/rainbow/icon.png',
    },
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/rainbow'),
};
