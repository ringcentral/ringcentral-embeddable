# Custom third-party settings and preferences

!!! info "This feature requires you to [register your app as a service](index.md) first."

For some features that support user to customize, widget supports to add settings into widget's setting page.

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
          }
        ]
      }
    ],
  }
}, '*');
```

!!! info "In settings root items, it only supports `boolean` and `section` type. In section's items, it supports `boolean`, `string`, `option` and `text` type."

After registering, you can get your setting in settings page:

![settings](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/9401e3c5-0143-4efb-9d4e-bba88caf2098)
![setting-section](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/29bc2481-05ec-4e29-bd77-9a63f9cdf1d0)

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
