const path = require('path');

module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '7710',
    code: 'bt',
    name: 'BT Cloud Work',
    appName: 'BT Cloud Work Embeddable',
    fullName: 'BT Cloud Work',
    application: 'BT Cloud Work Embeddable',
    allowRegionSetting: true,
    allowJupiterUniversalLink: true,
    callWithJupiter: {
      default: {
        link: 'http://app.cloudwork.bt.com/',
        protocol: 'com.bt.cloudwork.app://',
        name: 'BT Cloud Work App',
      },
    },
    spartanProtocol: 'rcbtmobile://',
    rcmProductName: 'BT Cloud Work Meetings',
    rcvProductName: '',
    rcvTeleconference: 'https://video.cloudwork.bt.com/teleconference',
    teleconference: 'https://meetings.btcloudphone.bt.com/teleconference',
    assets: {
      logo: '/assets/bt/logo.svg',
      icon: '/assets/bt/icon.svg',
    },
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/bt'),
};
