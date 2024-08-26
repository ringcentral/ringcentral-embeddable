const {
  setBrowserPermission,
  visitIndexPage,
  getAuthorizedWidget,
} = require('./steps/common');

const hasUserLoginInfo = global.__JWT_TOKEN__;
if (!hasUserLoginInfo) {
  console.log('THOSE TESTS ARE SKIPED BECAUSE NO USER LOGIN INFO PROVIDED');
}
const conditionalDescribe = !hasUserLoginInfo ? describe.skip : describe;

conditionalDescribe('widget page test', () => {
  let widgetIframe;

  beforeAll(async () => {
    await setBrowserPermission();
    await visitIndexPage();
    widgetIframe = await getAuthorizedWidget(__JWT_TOKEN__);
  });

  it('should login successfully', async () => {
    await widgetIframe.waitForDialButton();
    const dialButton = await widgetIframe.getDialButton();
    expect(!!dialButton).toEqual(true);
  });

  it('should have dial button enabled', async () => {
    await widgetIframe.waitDialButtonEnabled();
    const noTimeout = true;
    expect(noTimeout).toEqual(true);
  });

  it('should goto calls page successfully', async () => {
    await widgetIframe.clickSubTab('Calls', '/history');
    const callItems = await widgetIframe.getCallItemList();
    const noCallsText = await widgetIframe.getNoCallsText();
    const isNoCalls = noCallsText === 'No results found.';
    expect(callItems.length > 0 || isNoCalls).toEqual(true);
    const tabHeaderText = await widgetIframe.getTabHeader();
    expect(tabHeaderText).toEqual('Phone');
  });

  it('should goto voicemail page successfully', async () => {
    await widgetIframe.clickSubTab('Voicemail', '/messages/voicemail');
    const voicemailItems = await widgetIframe.getMessageList('VoiceMailMessageItem');
    const noVoicemailText = await widgetIframe.getNoMessageText();
    const isNoVoicemail = noVoicemailText === 'No Messages';
    expect(voicemailItems.length > 0 || isNoVoicemail).toEqual(true);
    const tabHeaderText = await widgetIframe.getTabHeader();
    expect(tabHeaderText).toEqual('Phone');
  });

  it('should goto recordings page successfully', async () => {
    await widgetIframe.clickSubTab('Recordings', '/history/recordings');
    const callItems = await widgetIframe.getCallItemList();
    const noCallsText = await widgetIframe.getNoCallsText();
    const isNoCalls = noCallsText === 'No results found.';
    expect(callItems.length > 0 || isNoCalls).toEqual(true);
  });

  it('should goto fax page successfully', async () => {
    await widgetIframe.clickNavigationButton('Fax');
    const tabHeaderText = await widgetIframe.getTabHeader();
    expect(tabHeaderText).toEqual('Fax');
  });

  it('should goto text page successfully', async () => {
    await widgetIframe.clickNavigationButton('Text');
    const tabHeaderText = await widgetIframe.getTabHeader();
    expect(tabHeaderText).toEqual('Text');
  });

  it('should goto Compose Text page successfully', async () => {
    await widgetIframe.clickComposeTextIcon();
    const recipientPlaceholder = await widgetIframe.getSMSRecipientInputPlaceholder();
    expect(recipientPlaceholder).toEqual('Enter name or number');
    const text = `text ${Date.now()}`;
    await widgetIframe.typeSMSRecipientAndText({ recipientNumber: __TEST_SMS_RECEIVER_NUMBER__, text });
    await widgetIframe.clickSMSSendButton();
    const lastTextInConversation = await widgetIframe.getLastTextAtConversation();
    expect(lastTextInConversation).toEqual(text);
    await widgetIframe.clickBackButton();
  });

  it('should goto contacts page successfully', async () => {
    await widgetIframe.clickNavigationButton('Contacts');
    await widgetIframe.waitForTimeout(1000);
    const tabHeaderText = await widgetIframe.getTabHeader();
    expect(tabHeaderText).toEqual('Contacts');
    const contactSearchInput = await widgetIframe.getContactSearchInput();
    expect(!!contactSearchInput).toEqual(true);
  });

  it('should goto settings page successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    const title = await widgetIframe.getTabHeader();
    expect(title).toEqual('Settings');
  });

  it('should goto region setting page successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    await widgetIframe.waitForTimeout(1000);
    await widgetIframe.clickSettingSection('region');
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Region');
    await widgetIframe.clickBackButton();
  });

  it('should goto audio setting page successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    await widgetIframe.waitForTimeout(1000);
    await widgetIframe.clickSettingSection('audio');
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Audio');
    await widgetIframe.clickBackButton();
  });

  it('should goto calling setting page successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    await widgetIframe.clickSettingSection('calling');
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Calling');
    await widgetIframe.clickBackButton();
  });

  it('should goto Compose Text page when click SMS link', async () => {
    await widgetIframe.waitForNavigation();
    const smsLink = await page.$('a[href="sms:+12345678901"]');
    await smsLink.evaluate(l => l.click());
    const recipientNumber = await widgetIframe.getSMSRecipientNumber();
    expect(recipientNumber).toEqual('+12345678901');
    await widgetIframe.clickBackButton();
  });

  it('should goto Compose Text page when click SMS link with body', async () => {
    await widgetIframe.waitForNavigation();
    const smsLink = await page.$('a[href="sms:+12345678902?body=test_sms"]');
    await smsLink.evaluate(l => l.click());
    const recipientNumber = await widgetIframe.getSMSRecipientNumber();
    const text = await widgetIframe.getSMSText();
    expect(recipientNumber).toEqual('+12345678902');
    expect(text).toEqual('test_sms');
    await widgetIframe.clickBackButton();
  });

  it('should register service successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    await page.evaluate(() => {
      const iframe = document.querySelector("#rc-widget-adapter-frame").contentWindow;
      window.addEventListener('message', function (e) {
        var data = e.data;
        if (data && data.type === 'rc-post-message-request') {
          if (data.path === '/contacts') {
            const contacts = [{
              id: '123456',
              name: 'TestService Name',
              type: 'TestService',
              phoneNumbers: [{
                phoneNumber: '+1234567890',
                phoneType: 'direct',
              }],
              company: 'CompanyName',
              jobTitle: 'Engineer',
              emails: ['test@email.com'],
              deleted: false,
            }];
            iframe.postMessage({
              type: 'rc-post-message-response',
              responseId: data.requestId,
              response: {
                data: contacts,
                nextPage: null,
                syncTimestamp: Date.now()
              },
            }, '*');
            return;
          }
          iframe.postMessage({
            type: 'rc-post-message-response',
            responseId: data.requestId,
            response: 'ok',
          }, '*');
        }
      });
      iframe.postMessage({
        type: 'rc-adapter-register-third-party-service',
        service: {
          name: 'TestService',
          authorized: true,
          authorizedAccount: 'TestAccount',
          authorizationPath: '/authorize',
          authorizedTitle: 'Unauthorize',
          unauthorizedTitle: 'Authorize',
          contactsPath: '/contacts',
          callLoggerPath: '/callLogger',
          callLoggerTitle: 'Log to TestService',
          messageLoggerPath: '/messageLogger',
          messageLoggerTitle: 'Log to TestService',
          settingsPath: '/settings',
          settings: [{
            "id": 'openLoggingPageAfterCall',
            "type": 'boolean',
            "name": 'Open call logging page after call',
            "value": true,
            "groupId": 'logging',
          }, {
            "id": 'contacts',
            "type": 'section',
            "name": 'Contacts',
            "items": [
              {
                "id": "info",
                "name": "info",
                "type": "admonition",
                "severity": "info",
                "value": "Please authorize ThirdPartyService firstly",
              },
              {
                "id": "introduction",
                "name": "Introduction",
                "type": "typography",
                "variant": "body2",
                "value": "Update ThirdPartyService contact settings",
              },
              {
                "id": 'openPlaceholderContact',
                "type": 'boolean',
                "name": 'Open placeholder contact upon creation',
                "value": false,
              },
              {
                "name": "Phone number format alternatives",
                "id": "phoneFormat",
                "value": "(***) ***-****)",
                "type": "string",
              },
            ],
          }, {
            "id": "support",
            "type": "group",
            "name": "Support",
            "items": [{
              "id": "document",
              "type": "externalLink",
              "name": "Document",
              "uri": "https://ringcentral.github.io/ringcentral-embbeddable/docs/",
            }, {
              "id": "feedback",
              "type": "button",
              "name": "Feedback",
              "buttonLabel": "Open",
              "buttonType": "link",
            }],
          }],
        },
      }, '*');
    });
    const serviceName = await widgetIframe.getServiceNameInAuthorizationSettings();
    expect(serviceName).toEqual('TestService');
    await widgetIframe.clickSettingSection('logging');
    const openLoggingPageAfterCall = await widgetIframe.getSettingSection('thirdPartySettings-openLoggingPageAfterCall');
    expect(!!openLoggingPageAfterCall).toEqual(true);
    const contactsSection = await widgetIframe.getSettingSection('contacts');
    expect(!!contactsSection).toEqual(true);
    const supportSection = await widgetIframe.getSettingSection('support');
    expect(!!supportSection).toEqual(true);
    await widgetIframe.clickNavigationButton('Contacts');
    const contactsFilters = await widgetIframe.getContactFilters();
    expect(contactsFilters).toContain('TestService');
    await widgetIframe.waitForTimeout(1500);
    const contacts = await widgetIframe.getContactNames();
    expect(contacts).toEqual(expect.arrayContaining(['TestService Name']));
  });

  it('should register customized page and tab successfully', async () => {
    await page.evaluate(() => {
      const iframe = document.querySelector("#rc-widget-adapter-frame").contentWindow;
      iframe.postMessage({
        type: 'rc-adapter-register-customized-page',
        page: {
          id: 'crmTab',
          title: 'CRM',
          type: 'tab',
          hidden: false,
          priority: 31,
          unreadCount: 1,
          iconUri: 'https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/d23f7dbf-fcf7-4011-a538-16adfba06a66',
          activeIconUri: 'https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/10a1edf9-9837-4dec-8950-7ec81b14be4d',
          schema: {
            type: 'object',
            properties: {
              "search": {
                "type": "string",
              },
              "opportunity": {
                "type": "string",
                "oneOf": [{
                  "const": "opportunity1",
                  "title": "Opportunity 1",
                  "description": "This is a description message",
                  "meta": "4/18",
                  "icon": "https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/f3cdcd56-372f-4c45-8972-fe85ce177903",
                }, {
                  "const": "opportunity2",
                  "title": "Opportunity 2",
                  "description": "This is a description message 2",
                  "meta": "4/15",
                  "icon": "https://ringcentral.github.io/juno/static/media/avatar.fe411800.jpg"
                }]
              }
            },
          },
          uiSchema: {
            search: {
              "ui:placeholder": 'Search',
              "ui:label": false,
            },
            opportunity: {
              "ui:field": "list",
              "ui:showIconAsAvatar": false, // show icon as avatar (round) in list
            },
          },
          formData: {
            search: '',
            opportunity: '',
          },
        },
      }, '*');
      iframe.postMessage({
        type: 'rc-adapter-register-customized-page',
        page: {
          id: 'page1',
          title: 'Customized page 1',
          type: 'page',
          schema: {
            type: 'object',
            required: ['contactType', 'defaultContactName'],
            properties: {
              "warning": {
                "type": "string",
                "description": "Please authorize the CRM to use this feature."
              },
              "someTitle": {
                "type": "string",
                "description": "Note title",
              },
              "someMessage": {
                "type": "string",
                "description": "This is a description message"
              },
              "someMessage1": {
                "type": "string",
                "description": "This is a description message 2"
              },
              "someLink": {
                "type": "string",
                "description": "This is a link"
              },
              "openSettingsButton": {
                "type": "string",
                "title": "Open CRM settings",
              },
              "contactType": {
                "type": "string",
                "title": "Default link type",
                "oneOf": [
                  {
                    "const": "candidate",
                    "title": "Candidate"
                  },
                  {
                    "const": "contact",
                    "title": "Contact"
                  }
                ],
              },
              "defaultContactName": {
                "type": "string",
                "title": "Default contact name",
              },
              "defaultNote": {
                "type": "string",
                "title": "Default note",
              },
            },
          },
          uiSchema: {
            submitButtonOptions: {
              submitText: 'Save',
            },
            openSettingsButton: {
              "ui:field": "button",
              "ui:variant": "contained", // "text", "outlined", "contained", "plain"
              "ui:fullWidth": true
            },
            warning: {
              "ui:field": "admonition",
              "ui:severity": "warning",
            },
            someTitle: {
              "ui:field": "typography",
              "ui:variant": "body2"
            },
            someMessage: {
              "ui:field": "typography",
              "ui:bulletedList": true,
            },
            someMessage1: {
              "ui:field": "typography",
              "ui:bulletedList": true,
            },
            someLink: {
              "ui:field": "link",
              "ui:variant": "body1",
              "ui:color": "avatar.brass",
              "ui:underline": true,
              "ui:href": "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/",
            },
            defaultContactName: {
              "ui:placeholder": 'Enter default contact name',
            },
            defaultNote: {
              "ui:placeholder": 'Enter default note',
              "ui:widget": "textarea", // show note input as textarea
              "ui:readonly": true, // make note input as readonly
            },
          },
          formData: {
            contactType: 'candidate',
            defaultContactName: 'John Doe',
            defaultNote: 'Hello',
            search: '',
            opportunity: '',
          },
        }
      });
    });
    await widgetIframe.clickNavigationButton('CRM');
    const tabHeaderText = await widgetIframe.getTabHeader();
    expect(tabHeaderText).toEqual('CRM');
    await page.evaluate(() => {
      const iframe = document.querySelector("#rc-widget-adapter-frame").contentWindow;
      iframe.postMessage({
        type: 'rc-adapter-navigate-to',
        path: '/customized/page1',
      }, '*');
    });
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Customized page 1');
  });
});
