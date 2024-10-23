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

### Register button, section and group

<!-- md:version 2.0.0 -->

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    settingsPath: '/settings',
    settings: [
      {
        "id": 'openLoggingPageAfterCall',
        "type": 'boolean',
        "name": 'Open call logging page after call',
        "value": true,
        "groupId": 'logging', // optional, group settings into call and sms logging settings
        // "readOnly": true, // supported from v2.1.0
        // "readOnlyReason": "This setting is managed by admin", // supported from v2.1.0
      },
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
            "variant": "body2", // optional, default is body1
            "value": "Update ThirdPartyService contact settings",
          },
          {
            "id": 'openContactPageAtCall',
            "type": 'boolean',
            "name": 'Open contact for incoming calls',
            "value": true,
          },
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
        ]
      },
      {
        "id": "support",
        "type": "group",
        "name": "Support",
        "items": [{
          "id": "document",
          "type": "externalLink",
          "name": "Document",
          "uri": "https://www.google.com",
        }, {
          "id": "feedback",
          "type": "button",
          "name": "Feedback",
          "buttonLabel": "Open",
          "buttonType": "link",
        }, {
          "id": "devSupport",
          "type": "button",
          "name": "Developer support",
          "buttonLabel": "Open",
        }]
      },
    ],
    buttonEventPath: '/button-click', // required if you have button type in settings
  }
}, '*');
```

!!! info "In settings root items, it only supports `boolean`, `button`, `section` and `group` type. In section's items, it supports `boolean`, `string`, `option`, `text`, `typography` and `admonition` type."

After registering, you can get your setting in settings page:

![customize-settings](https://github.com/user-attachments/assets/561e51b5-83fb-419f-aa01-e80c63f9d081)

![customize-setting-section](https://github.com/user-attachments/assets/7c0d1253-bf0c-4861-a817-d8ca3242e7a9)

![group-setting](https://github.com/user-attachments/assets/9879a084-1507-4b6e-aea4-8fc5a8540b8b)

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
        "id": "settingItem1",
        "type": "button",
        "name": "Setting Item 1",
        "buttonLabel": "Open",
        "order": 250 // the smaller the number, the higher the priority. 
        // Calling setting order value: 100,
        // Audio setting order value: 200,
        // Region setting order value: 300,
        // Status setting order value: 400,
        // Call and SMS logging setting order value: 500,
      },
    ],
    buttonEventPath: '/button-click', // required if you have button type in settings
    // ...
  }
}, '*');
```

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
