# Third Party Service in Widget

After integrating the RingCentral Embeddable to your application, you can also integrate your own service into the widget, such as show contact data from your application or show a button named with your application.

This document show how the widget can interact with your application deeply.

## Table of Contents

* [Register your service](#register-your-service)
* [Add a conference invite button with your service](#add-a-conference-invite-button-with-your-service)
* [Add meeting schedule button with your service](#add-meeting-schedule-feature-with-your-service)
  * [Show upcoming meeting list in RingCentral Video page](#show-upcoming-meeting-list-in-ringcentral-video-page)
  * [Log RingCentral Video meeting into your service](#log-ringcentral-video-meeting-into-your-service)
* [Show contacts from your application](#show-contacts-from-your-application)
  * [Show contacts on Contacts page in widget](#show-contacts-on-contacts-page-in-widget)
  * [Show contacts search result on Dialer receiver input](#show-contacts-search-result-on-dialer-receiver-input)
  * [Show contacts matcher result on calls history and incoming call page](#show-contacts-matcher-result-on-calls-history-and-incoming-call-page)
* [Show contact's activities from your application](#show-contacts-activities-from-your-application)
* [Log call into your service](#log-call-into-your-service)
  * [Add call logger button in calls page](#add-call-logger-button-in-calls-page)
  * [Add call logger modal](#add-call-logger-modal)
  * [Add call log entity matcher](#add-call-log-entity-matcher)
* [Log messages into your service](#log-messages-into-your-service)
  * [Add message logger button in messages page](#add-message-logger-button-in-messages-page)
  * [Add message log entity matcher](#add-message-log-entity-matcher)
* [Add third party authorization button](#add-third-party-authorization-button)
* [Third Party Settings](#third-party-settings)

## Register your service

Find the widget iframe and use `postMessage` to register:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService'
  }
}, '*');
```

## Add a conference invite button with your service

First you need to pass `conferenceInvitePath` and `conferenceInviteTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService', // service name
    conferenceInvitePath: '/conference/invite',
    conferenceInviteTitle: 'Invite with TestService',
  }
}, '*');
```

After registered, you can get a `Invite with TestService` in conference invite page.

![image](https://user-images.githubusercontent.com/7036536/42258529-cb5684e8-7f8e-11e8-88e8-0b251a102e0e.png)

Add a message event to response conference invite button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/conference/invite') {
      // add your codes here to handle conference invite data
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

## Add meeting schedule feature with your service

First we need to add `Meeting` permission into your app in RingCentral Developer website if you are using your own RingCentral client id. This works on RingCentral Video or RingCentral Meetings service.

Then pass `meetingInvitePath` and `meetingInviteTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService', // service name
    meetingInvitePath: '/meeting/invite',
    meetingInviteTitle: 'Invite with TestService',
  }
}, '*');
```

After registered, we can get `Schedule Meeting` page in navigator, and `Invite` button in meeting page:

![meeting page](https://user-images.githubusercontent.com/7036536/54572803-37fb3980-4a24-11e9-9edc-ac81cb0fecac.jpeg)

Add a message event to response meeting invite button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/meeting/invite') {
      // add your codes here to handle meeting invite data
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

## Show upcoming meeting list in RingCentral Video page

**Notice**: only work on RingCentral Video meeting service.

First you need to pass `meetingUpcomingPath` when you register meeting invite service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService', // service name
    meetingInvitePath: '/meeting/invite',
    meetingInviteTitle: 'Invite with TestService',
    meetingUpcomingPath: '/meetingUpcomingList
  }
}, '*');
```

Then add a message event to response upcoming meeting  request:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/meetingUpcomingList') {
      // add your codes here to query upcoming meeting from your service
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: [{
            id: '123456',
            title: 'Test Meeting in TestService',
            editEventUrl: 'https://your_meeting_uri',
            startTime: "2020-03-22T01:00:00Z",
            endTime: "2020-03-22T02:00:00Z",
            meetingIds: ['433214948'],
          }],
        },
      }, '*');
    }
  }
});
```

## Log RingCentral Video meeting into your service

**Notice**: only work on RingCentral Video meeting service.

First you need to pass `meetingLoggerPath` and `meetingLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    meetingLoggerPath: '/meetingLogger',
    meetingLoggerTitle: 'Log to TestService',
  }
}, '*');
```

After registered, you can get a `Log to TestService` in meeting history page.

Then add a message event to response meeting logger button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/meetingLogger') {
      // add your codes here to log meeting to your service
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

## Show contacts from your application

### Show contacts on Contacts page in widget

First you need to pass `contactsPath` when you register service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    contactsPath: '/contacts',
    contactIcon: 'https://set_brand_icon.com/test.png', // optional, show brand icon in the top right of contact avatar 
  }
}, '*');
```

Add a message event to response contacts list event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/contacts') {
      console.log(data);
      // you can get page and syncTimestamp params from data.body
      // query contacts data from third party service with page and syncTimestamp
      // if syncTimestamp existed, please only return updated contacts after syncTimestamp
      // response to widget:
      const contacts = [{
        id: '123456', // id to identify third party contact
        name: 'TestService Name', // contact name
        type: 'TestService', // need to same as service name
        phoneNumbers: [{
          phoneNumber: '+1234567890',
          phoneType: 'direct', // support: business, extension, home, mobile, phone, unknown, company, direct, fax, other
        }],
        company: 'CompanyName',
        jobTitle: 'Engineer',
        emails: ['test@email.com'],
        deleted: false, // set deleted to true if you need to delete it in updated contacts
      }];
      // pass nextPage number when there are more than one page data, widget will repeat same request with nextPage increased
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: contacts,
          nextPage: null,
          syncTimestamp: Date.now()
        },
      }, '*');
    }
  }
});
```

Data from `contactsPath` will be showed in contacts page in widget. 

The widget will request contacts data when widget is loaded and when user visit contacts page. In first request `syncTimestamp` is blank, so you need to provide full contacts data to widget. Please provide `syncTimestamp` when reponse to widget. In next contacts request widget will send you `syncTimestamp`, so you just need to provide updated contact since `syncTimestamp`.

If you provide `nextPage` for `contactsPath` response, widget will repeat request with `page="${nextPage}"` to get next page contacts data.

![contacts image](https://user-images.githubusercontent.com/7036536/55848243-d9d2f980-5b7e-11e9-8051-7a48cee50222.jpeg)

To trigger contact sync request in widget by api:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-sync-third-party-contacts',
}, '*');
```

### Show contacts search result on Dialer receiver input

You must want to show related contacts result when user typing in callee input area. First you need to pass `contactSearchPath` when you register service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    contactSearchPath: '/contacts/search'
  }
}, '*');
```

Add a message event to response contacts search event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/contacts/search') {
      console.log(data);
      const searchedContacts = [{
        id: '123456', // id to identify third party contact
        name: 'TestService Name',
        type: 'TestService', // need to same as service name
        phoneNumbers: [{
          phoneNumber: '+1234567890',
          phoneType: 'direct', // support: business, extension, home, mobile, phone, unknown, company, direct, fax, other
        }]
      }];
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: searchedContacts
        },
      }, '*');
    }
  }
});
```

![image](https://user-images.githubusercontent.com/7036536/48828521-ec54be00-edaa-11e8-8b49-d76412e173bd.jpeg)

### Show contacts matcher result on calls history and incoming call page:

In widget, we use contact matcher to match phone number to contact in calls page or incoming page. First you need to pass `contactMatchPath` when you register service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    contactMatchPath: '/contacts/match'
  }
}, '*');
```

Add a message event to response contacts matcher event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/contacts/match') {
      console.log(data); // include phone number array that need to match
      const matchedContacts = {
        '+12165325078': [
          {
            id: '123456', // id to identify third party contact
            type: 'TestService', // need to same as service name
            name: 'TestService 1',
            phoneNumbers: [{
              phoneNumber: '+12165325078',
              phoneType: 'direct', // support: business, extension, home, mobile, phone, unknown, company, direct, fax, other
            }]
          }
        ]
      };
      // return matched contact object with phone number as key
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: matchedContacts
        },
      }, '*');
    }
  }
});
```

![incoming](https://user-images.githubusercontent.com/7036536/48829168-9bde6000-edac-11e8-9cd0-01b0dd65942b.jpeg)


## Show contact's activities from your application

First you need to pass `activitiesPath` and `activityPath` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    activityName: 'TestService', // optional, will use service.name as default
    activitiesPath: '/activities',
    activityPath: '/activity'
  }
}, '*');
```

Add a message event to response activities query event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/activities') {
      const contact = data;
      console.log(contact);
      const activities = [{
        id: '123',
        subject: 'Title',
        time: 1528854702472
      }];
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: activities },
      }, '*');
    }
    if (data.path === '/activity') {
      const activity = data;
      // handle activity here
      console.log(activity);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

Data from `activitiesPath` will be showed in contact details page in the widget. Event from `activityPath` is triggered when user click activity item in the widget.

![image](https://user-images.githubusercontent.com/7036536/42258605-2ba93d40-7f8f-11e8-8f4c-c14a397d343e.png)

## Log call into your service

### Add call logger button in calls page

First you need to pass `callLoggerPath` and `callLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    // recordingWithToken: 1
  }
}, '*');
```

After registered, you can get a `Log to TestService` in calls page, and `Auto log calls` setting in setting page

![calllogbutton](https://user-images.githubusercontent.com/7036536/48827686-d1814a00-eda8-11e8-81e4-2b48b1df2bcc.png)

Then add a message event to response call logger button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/callLogger') {
      // add your codes here to log call to your service
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

This message event is fired when user clicks `Log` button. Or if user enables `Auto log calls` in settings, this event will be also fired when a call is started and updated.

Listen to `Auto log calls` setting changed:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-callLogger-auto-log-notify') {
    console.log('rc-callLogger-auto-log-notify:', data.autoLog);
  }
});
```

In this message event, you can get call information in `data.body.call`. When call is recorded and recording file is generated, you can get `recording` data in `data.body.call`:

```js
{
  contentUri: "https://media.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004/content"
  id: "6469338004"
  link: "http://apps.ringcentral.com/integrations/recording/sandbox/?id=Ab7937-59r6EzUA&recordingId=6469338004"
  type: "OnDemand"
  uri: "https://platform.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004"
}
```

The `link` property in `recording` is a link to get and play recording file from RingCentral server. The `contentUri` is a URI which can be used to get `recording` file  with RingCentral access token. If you pass `recordingWithToken` when register service, you can get contentUri with `access_token`. The `access_token` will be expired in minutes, so need to download immediately when get it.

```js
{
  contentUri: "https://media.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004/content?access_token=ringcentral_access_token"
  id: "6469338004"
  link: "http://apps.ringcentral.com/integrations/recording/sandbox/?id=Ab7937-59r6EzUA&recordingId=6469338004"
  type: "OnDemand"
  uri: "https://platform.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004"
}
```

### Add call logger modal

For some developers who want to add note when log a call to their platform, we provide a log modal to support it.

Add `showLogModal` when register service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    showLogModal: true,
  }
}, '*');
```

![image](https://user-images.githubusercontent.com/7036536/48827685-d1814a00-eda8-11e8-8160-0fb92cbb88f5.png)


### Add call log entity matcher

In call logger button, widget needs to know if call is logged. To provide `callLogEntityMatcherPath` when register, widget will send match request to get match result of calls history.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    callLogEntityMatcherPath: '/callLogger/match'
  }
}, '*');
```

Then add a message event to response call logger matcher event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/callLogger/match') {
      // add your codes here to reponse match result
      console.log(data); // get call session id list in here
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: {
            '214705503020': [{ // call session id from request
              id: '88888', // call log entity id from your platform
              note: 'Note', // Note of this call log entity
            }]
          }
        },
      }, '*');
    }
  }
});
```

## Log messages into your service

### Add message logger button in messages page

First you need to pass `messageLoggerPath` and `messageLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    messageLoggerPath: '/messageLogger',
    messageLoggerTitle: 'Log to TestService',
    // attachmentWithToken: true,
  }
}, '*');
```

After registered, you can get a `Log to TestService` in messages page, and `Auto log messages` setting in setting page:

![message log button](https://user-images.githubusercontent.com/7036536/60498444-2c890100-9ce9-11e9-980b-c57d5ed50c2d.jpeg)

Then add a message event to response message logger button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/messageLogger') {
      // add your codes here to log messages to your service
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

This message event is fired when user clicks `Log` button. Or if user enables `Auto log message` in settings, this event will be also fired when a message is created and updated.

In this message event, you can get call information in `data.body.conversation`. Messages are grouped by `conversationId` and `date`. So for a conversation that have messages in different date, you will receive multiple log message event.

For Voicemail and Fax, you can get `attachment` data in message. The `attachment.link` is a link used to get voicemail file from RingCentral server with Browser. The `attachment.uri` is a URI which can be used to get attachment file  with RingCentral access token. If you pass `attachmentWithToken` when register service, you can get `attachment.uri` with `access_token`. The `access_token` will be expired in minutes, so need to download immediately when get it. 

### Add message log entity matcher

In message logger, widget needs to know if messages are logged. To provide `messageLogEntityMatcherPath` when register, widget will send match request to get match result of messages history.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    messageLoggerPath: '/callLogger',
    messageLoggerTitle: 'Log to TestService',
    messageLogEntityMatcherPath: '/messageLogger/match'
  }
}, '*');
```

Then add a message event to response message logger match event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/messageLogger/match') {
      // add your codes here to reponse match result
      console.log(data); // get message conversation log id list in here
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: {
            '674035477569017905/7/2/2019': [{ // conversation log id from request
              id: '88888', // log entity id from your platform
            }]
          }
        },
      }, '*');
    }
  }
});
```

## Add third party authorization button

For some CRM API, they requires user to authorize firstly. This feature allows developer to add a third party authorization button and sync status into widget.

First you need to pass `authorizationPath`, `authorizedTitle`, `unauthorizedTitle` and `authorized` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    authorizationPath: '/authorize',
    authorizedTitle: 'Unauthorize',
    unauthorizedTitle: 'Authorize',
    authorized: false,
    authorizedAccount: 'test@email.com', // optional, authorized account email or id
    authorizationLogo: 'https://your_brand_picture/logo.png', // optional, show your brand logo in authorization section, recommeneded: height 20px, width < 85px.
  }
}, '*');
```

After registered, you can get a `TestService authorization button` in setting page:

![authorization image](https://user-images.githubusercontent.com/7036536/55848678-55817600-5b80-11e9-8eb3-a784a56997a8.jpeg)

Add a message event to response authorization button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/authorize') {
      // add your codes here to handle third party authorization
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

Update authorization status in widget:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-update-authorization-status',
  authorized: true,
}, '*');
```

**Notice:** If you register authorization service into widget, upper contacts related service will works only after status changed to authorized.


## Third Party Settings

For some features that support user to enable or disable, widget supports to add settings into widget's setting page. Now this only supports toggles.

First, register service with `settings` and `settingsPath`:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    settingsPath: '/settings',
    settings: [{ name: 'Open contact page when call coming', value: true }],
  }
}, '*');
```

After registering, you can get your setting in settings page:

![settings](https://user-images.githubusercontent.com/7036536/59655815-2b76b080-91ce-11e9-90e2-4a03a10c84bf.jpeg)

Add a message event to listen settings updated event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/settings') {
      // add your codes here to save settings into your service
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

