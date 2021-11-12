const path = require('path');

module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '3420',
    code: 'att',
    name: 'Office@Hand',
    appName: 'Office@Hand Embeddable',
    fullName: 'Office@Hand',
    application: 'Office@Hand Embeddable',
    allowJupiterUniversalLink: true,
    callWithJupiter: {
      default: {
        link: 'https://app.officeathand.att.com/',
        protocol: 'officeathand://',
        name: 'AT&T Office@Hand App',
      },
    },
    spartanProtocol: 'attvr20://',
    rcmProductName: 'AT&T Office@Hand Meeting',
    rcvProductName: 'AT&T Office@Hand Meetings',
    rcvTeleconference: 'https://meetings.officeathand.att.com/teleconference',
    teleconference: 'https://meetings-officeathand.att.com/teleconference',
    eulaLink: 'http://www.att.com/officeathandpolicy',
    assets: {
      logo: '/assets/att/logo.svg',
      icon: '/assets/att/icon.svg',
    }
  },
  brandFolder: __dirname,
  assetsFolder: path.resolve(__dirname, '../../src/assets/att'),
};
