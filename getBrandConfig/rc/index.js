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
        name: 'RingCentral',
      },
    },
    spartanProtocol: 'rcmobile://',
    rcmProductName: 'RingCentral Meetings',
    rcvProductName: 'RingCentral Video',
    teleconference: 'https://meetings.ringcentral.com/teleconference',
    rcvTeleconference: 'https://v.ringcentral.com/teleconference/',
  },
  brandFolder: __dirname,
};
