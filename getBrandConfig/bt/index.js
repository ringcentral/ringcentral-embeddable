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
    callWithJupiter: {
      default: {
        link: 'http://app.cloudwork.bt.com/',
        protocol: 'com.bt.cloudwork.app://',
        name: 'BT Cloud Work App',
      },
    },
    spartanProtocol: 'rcbtmobile://',
    rcmProductName: 'BT Cloud Work Meetings',
    rcvProductName: 'BT Cloud Work Video',
    rcvTeleconference: 'https://video.cloudwork.bt.com/teleconference',
    teleconference: 'https://meetings.btcloudphone.bt.com/teleconference',
    eulaLink: 'https://www.bt.com/products/static/terms/terms-of-use.html',
    assets: {
      logo: '/assets/bt/logo.svg',
      icon: '/assets/bt/icon.svg',
    },
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/bt'),
};
