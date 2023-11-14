
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
        id: '123456', // id to identify third party contact, need to be string
        name: 'TestService Name', // contact name
        type: 'TestService', // need to same as service name
        phoneNumbers: [{
          phoneNumber: '+1234567890',
          phoneType: 'direct', // support: business, extension, home, mobile, phone, unknown, company, direct, fax, other
        }],
        company: 'CompanyName',
        jobTitle: 'Engineer',
        emails: ['test@email.com'],
        profileImageUrl: 'https://avatar_uri', // optional, show avatar in Contacts page
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
