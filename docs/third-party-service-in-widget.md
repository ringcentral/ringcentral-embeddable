# Third Party Service in Widget

After integrating the RingCentral Embeddable to your application, you can also integrate your own service into the widget, such as show contact data from your application or show a button named with your application.

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

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/contacts') {
      console.log(data);
      // response to widget
      // contacts data from third party service
      const contacts = [{
        id: '123456', // id to identify third party contact
        name: 'TestService Name', // contact name
        type: 'TestService', // need to same as service name
        phoneNumbers: [{
          phoneNumber: '+1234567890',
          phoneType: 'directPhone',
        }],
        emails: ['test@email.com']
      }];
      // pass nextPage number when there are more than one page data, widget will repeat same request with nextPage increased
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: contacts,
          nextPage: null
        },
      }, '*');
    }
    if (data.path === '/contacts/search') {
      console.log(data);
      const searchedContacts = [{
        id: '123456', // id to identify third party contact
        name: 'TestService Name',
        type: 'TestService', // need to same as service name
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
      console.log(data); // include phone number array that need to match
      const matchedContacts = {
        '+12165325078': [
          {
            id: '123456', // id to identify third party contact
            type: 'TestService', // need to same as service name
            name: 'TestService 1',
            phoneNumbers: [{
              phoneNumber: '+12165325078',
              phoneType: 'directPhone',
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

Data from `contactsPath` will be showed in contacts page in widget. Data from `contactSearchPath` will be showed in contacts search dropdown in dial page. Data from `contactMatchPath` will be showed on messages and call history page in the widget.
If you provide `nextPage` for `contactsPath` response, widget will repeat request with `page="${nextPage}"`.

![image](https://user-images.githubusercontent.com/7036536/42258572-f6a8050e-7f8e-11e8-8950-bb9efa8e0918.png)

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

![image](https://user-images.githubusercontent.com/7036536/48825466-6af92d80-eda2-11e8-850c-257d8044218d.png)

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

![image](https://user-images.githubusercontent.com/7036536/48825649-fd99cc80-eda2-11e8-85b7-26ec2d01f450.png)


### Add call log entity matcher

In call logger button, widget need to know if call is logged. To provide `callLogEntityMatcherPath` when register, widget will send match request to get match result of calls history.

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

Then add a message event to response call logger button event:

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
    authorized: false
  }
}, '*');
```

After registered, you can get a `TestService authorization button` in setting page:

![image](https://user-images.githubusercontent.com/7036536/45734172-13a9d600-bc16-11e8-890f-63d850e017ce.jpg)

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
