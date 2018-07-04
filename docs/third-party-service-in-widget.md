# Third Party Service in Widget

After integrate the RingCentral Embeddable Voice to your application, you can also integrate your own service into the widget, such as show contact data from your application or show a button named with your application.

This document show how the widget can interact with your application deeply.

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
    name: 'TestService',
    conferenceInvitePath: '/conference/invite',
    conferenceInviteTitle: 'Invite with TestService',
  }
}, '*');
```

After registered, you can get a `Invite with TestService` in conference invite page.

Add a message event to response conference invite button event:

```
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

## Show contacts from your application

First you need to pass `contactsPath`, `contactMatchPath` and `contactSearchPath` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    contactsPath: '/contacts',
    contactSearchPath: '/contacts/search',
    contactMatchPath: '/contacts/match',
  }
}, '*');
```

Add a message event to response contacts query event:

```
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/contacts') {
      console.log(data);
      // response to widget
      const contacts = [{
        id: '123456',
        name: 'TestService Name',
        type: 'TestService',
        phoneNumbers: [{
          phoneNumber: '+1234567890',
          phoneType: 'directPhone',
        }]
      }];
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: contacts
        },
      }, '*');
    }
    if (data.path === '/contacts/search') {
      console.log(data);
      const searchedContacts = [{
        id: '123456',
        name: 'TestService Name',
        type: 'TestService',
        phoneNumbers: [{
          phoneNumber: '+1234567890',
          phoneType: 'directPhone',
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
    if (data.path === '/contacts/match') {
      console.log(data);
      const matchedContacts = {
        '+12165325078': [
          {
            entityType: 'TestService',
            name: 'TestService 1',
            phoneNumbers: [{
              phoneNumber: '+12165325078',
              phoneType: 'directPhone',
            }]
          }
        ]
      };
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

Data from `contactsPath` will be showed in contacts page in widget. Data from `contactSearchPath` will be showed in contacts search dropdown in dial page. Data from `contactMatchPath` will be showed on messages and call history page in the widget.

## Show contact's activities from your application

First you need to pass `activitiesPath` and `activityPath` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    activitiesPath: '/activities',
    activityPath: '/activity'
  }
}, '*');
```
Add a message event to response activities query event:

```
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

## Add call logger button in calls page

First you need to pass `callLoggerPath` and `callLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService'
  }
}, '*');
```

After registered, you can get a `Log to TestService` in calls page, and `Auto Log` setting in setting page

Add a message event to response call logger button event:

```
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
