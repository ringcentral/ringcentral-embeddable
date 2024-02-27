# Custom third-party settings and preferences

!!! info "This feature requires you to [register your app as a service](index.md) first."

For some features that support user to customize, widget supports to add settings into widget's setting page.

## Register settings

First, register service with `settings` and `settingsPath`:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    settingsPath: '/settings',
    settings: [
      {
        "id": "openContactPageAtCall",
        "type": "boolean",
        "name": "Open Contact Page at Call",
        "value": true
      },
    ],
  }
}, '*');
```

### Register button and section

<!-- md:version 2.0.0 -->

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    settingsPath: '/settings',
    settings: [
      {
        "id": "goToAppSettings",
        "type": "button",
        "name": "Go to App settings",
        "buttonLabel": "Open",
      },
      {
        "id": "crmSetting",
        "type": "section",
        "name": "CRM settings",
        "items": [
          {
            "id": "defaultRecordType",
            "type": "option",
            "name": "Default record type",
            "options": [{
              "id": "Lead",
              "name": "Lead"
            }, {
              "id": "Contact",
              "name": "Contact"
            }],
            "value": "",
            "required": true,
            "placeholder": "Select default record type"
          },
          {
            "id": "defaultContactName",
            "type": "string",
            "name": "Default contact name",
            "value": "John Doe",
            "required": true,
            "placeholder": "Input default contact name"
          },
          {
            "id": "defaultNote",
            "type": "text",
            "name": "Default note",
            "value": "",
            "placeholder": "Input default note"
          },
          {
            "id": "noLogWhenCallIsMissed",
            "type": "boolean",
            "name": "Don't log when call is missed",
            "value": true
          },
        ]
      }
    ],
    buttonEventPath: '/button-click', // required if you have button type in settings
  }
}, '*');
```

!!! info "In settings root items, it only supports `boolean`, `button` and `section` type. In section's items, it supports `boolean`, `string`, `option` and `text` type."

After registering, you can get your setting in settings page:

![customize-settings](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/af76ff7a-7d3a-4e6a-a26b-41c8f79ad241)

![customize-setting-section](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/a7a1f33b-efc3-494d-a2ca-483b48dbbfe2)

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

### Listen for setting button click

<!-- md:version 2.0.0 -->

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/button-click') {
      // add your codes here to handle button click event
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

## Set settings item order

<!-- md:version 2.0.0 -->

You can set settings item order by adding `order` field in settings item:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    settingsPath: '/settings',
    settings: [
      {
        "id": "goToAppSettings",
        "type": "button",
        "name": "Before noise reduction",
        "buttonLabel": "Open",
        "order": 999, // before noise reduction setting (order: 1000)
      },
      {
        "id": "beforeAutoLog",
        "type": "button",
        "name": "Before auto log",
        "buttonLabel": "Open",
        "order": 2999 // before auto log setting (order: 3000)
      },
      {
        "id": "afterAuth",
        "type": "boolean",
        "name": "After auth setting",
        "value": true,
        "order": 10000 // after auth setting (order: 9000)
      },
    ],
    buttonEventPath: '/button-click', // required if you have button type in settings
    // ...
  }
}, '*');
```

Order value is a number, the smaller the number, the higher the priority.

![order-value](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/91e7d9ed-3949-4bfe-9f21-56089de09ffb)

## Update settings

<!-- md:version 2.0.0 -->

You can update settings by sending `rc-adapter-update-third-party-settings` message:

```js
  document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
    type: 'rc-adapter-update-third-party-settings',
    settings: [
      {
        "id": "openContactPageAtCall",
        "type": "boolean",
        "name": "Open Contact Page at Call",
        "value": true,
      },
      {
        "id": "openCRMPage",
        "type": "button",
        "name": "Go to app settings",
        "buttonLabel": "Open",
        "order": 10000,
      },
    ],
  }, '*');
```
