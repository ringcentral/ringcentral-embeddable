const path = require('path');

module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '1210',
    code: 'rc',
    name: 'RingCentral',
    appName: 'RingCentral Embeddable',
    fullName: 'RingCentral',
    application: 'RingCentral Embeddable',
    allowRegionSetting: true,
    signupUrl: 'https://www.ringcentral.com/office/plansandpricing.html',
    allowJupiterUniversalLink: true,
    callWithJupiter: {
      default: {
        link: 'https://app.ringcentral.com/',
        protocol: 'rcapp://',
        name: 'RingCentral App',
      },
    },
    spartanProtocol: 'rcmobile://',
    rcmProductName: 'RingCentral Meetings',
    rcvProductName: 'RingCentral Video',
    teleconference: 'https://meetings.ringcentral.com/teleconference',
    rcvTeleconference: 'https://v.ringcentral.com/teleconference/',
    assets: {
      logo: '/assets/rc/logo.svg',
      icon: '/assets/rc/icon.svg',
    }
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/rc'),
};
