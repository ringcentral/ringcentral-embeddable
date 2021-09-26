module.exports = {
  prefix: 'rc-widget',
  brandConfig: {
    id: '7310',
    code: 'telus',
    name: 'TELUS Business Connect',
    appName: 'TELUS Business Connect Embeddable',
    fullName: 'TELUS Business Connect',
    application: 'TELUS Business Connect Embeddable',
    allowRegionSetting: true,
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
    rcvProductName: '',
    rcvTeleconference: 'https://video.businessconnect.telus.com/teleconference',
    teleconference: 'https://meetings.businessconnect.telus.com/teleconference',
  },
  brandFolder: __dirname,
};
