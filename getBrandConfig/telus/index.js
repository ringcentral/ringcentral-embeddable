const path = require('path');

module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '7310',
    code: 'telus',
    name: 'TELUS Business Connect',
    appName: 'TELUS Business Connect Embeddable',
    fullName: 'TELUS Business Connect',
    application: 'TELUS Business Connect Embeddable',
    allowJupiterUniversalLink: true,
    callWithJupiter: {
      default: {
        link: 'https://app.businessconnect.telus.com/',
        protocol: 'rctelus://',
        name: 'TELUS Business Connect App',
      },
    },
    spartanProtocol: 'rctelus://',
    rcmProductName: 'TELUS Business Connect Meetings',
    rcvProductName: 'Business Connect Video Meeting',
    rcvTeleconference: 'https://video.businessconnect.telus.com/teleconference',
    teleconference: 'https://meetings.businessconnect.telus.com/teleconference',
    eulaLink: 'http://telus.com/BusinessConnect/ServiceTerms',
    assets: {
      logo: '/assets/telus/logo.svg',
      icon: '/assets/telus/icon.svg',
    }
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/telus'),
};
