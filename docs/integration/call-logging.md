# Log call into your service

!!! info "This feature requires you to [register your app as a service](index.md) first."

## Add call log button/icon in call history tab

First you need to pass `callLoggerPath` and `callLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    // callLoggerAutoSettingLabel: 'Auto log calls', // optional, customized the auto log setting label
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

## Auto log calls setting

<!-- md:version 1.10.0 -->

User can enable/disable auto log in settings page. To set default `Auto log calls` enabled:

Add `defaultAutoLogCallEnabled` into the `adapter.js` URI:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?defaultAutoLogCallEnabled=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

Listen to `Auto log calls` setting changed:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-callLogger-auto-log-notify') {
    console.log('rc-callLogger-auto-log-notify:', data.autoLog);
  }
});
```

## Add call logger modal

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

## Customize call log page

<!-- md:version 2.0.0 -->

From `v2.0.0`, call logger modal is refactored into call log page:

![image](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/c4f7e129-32b9-4a2d-a296-9c6ad8ddd029)

You can customize call log page by adding `callLogPageDataPath` and `callLogPageInputChangedEventPath` when register service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    // showLogModal: false, // disable showLogModal if you want to use call log page
    callLogPageInputChangedEventPath: '/callLogger/inputChanged',
  }
}, '*');
```

Then add message event listener to show call log page and input changed request:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/callLogger') {
      // Get trigger type: data.body.triggerType
      // When user click log button in call item, triggerType is 'createLog' or 'editLog'
      // When it is triggered from auto log, triggerType is 'presenceUpdate'
      // When save button clicked, triggerType is 'logForm'
      if (data.body.triggerType === 'createLog' || data.body.triggerType === 'editLog') {
        // customize call log page
        document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
          type: 'rc-adapter-update-call-log-page',
          page: {
            title: 'Log to TestService',
            // schema and uiSchema are used to customize call log page, api is the same as [react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form)
            schema: {
              type: 'object',
              required: ['contact', 'activityTitle'],
              properties: {
                "warning": {
                  "type": "string",
                  "description": "No contact found. Enter a name to have a placeholder contact made for you.",
                },
                "contact": {
                  "title": "Contact",
                  "type": "string",
                  "oneOf": [
                    {
                      "const": "xxx",
                      "title": "John Doe",
                      "description": "Candidate - 347",
                    },
                    {
                      "const": "newEntity",
                      "title": "Create placeholder contact"
                    }
                  ],
                },
                "contactName": {
                  "type": 'string',
                  "title": "Contact name",
                },
                "contactType": {
                  "title": "Contact type",
                  "type": "string",
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
                "activityTitle": {
                  "type": "string",
                  "title": "Activity title"
                },
                "note": {
                  "type": "string",
                  "title": "Note"
                },
              },
            },
            uiSchema: {
              warning: {
                "ui:field": "admonition", // or typography to show raw text
                "ui:severity": "warning", // "warning", "info", "error", "success"
              },
              contactName: {
                "ui:placeholder": 'Enter name',
                "ui:widget": "hidden", // remove this line to show contactName input
              },
              contactType: {
                "ui:placeholder": 'Select contact type',
                "ui:widget": "hidden", // remove this line to show contactType input
              },
              note: {
                "ui:placeholder": 'Enter note',
                "ui:widget": "textarea", // show note input as textarea
              },
              submitButtonOptions: {
                submitText: 'Save',
              },
            },
            formData: {
              contact: 'xxx',
              contactName: '',
              contactType: '',
              activityTitle: 'Outbound call to ...',
              note: '',
            },
          },
        }, '*');
        // navigate to call log page
        document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
          type: 'rc-adapter-navigate-to',
          path: `/log/call/${data.body.call.sessionId}`,
        }, '*');
      }
      if (data.body.triggerType === 'logForm' || data.body.triggerType === 'presenceUpdate') {
        // Save call log to your platform
        console.log(data.body); // data.body.call, data.body.formData
      }
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
          type: 'rc-post-message-response',
          responseId: data.requestId,
          response: { data: 'ok' },
        }, '*');
      return;
    }
    if (data.path === '/callLogger/inputChanged') {
      console.log(data); // get input changed data in here: data.body.formData
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
      // you can update call log page data here to make the form dynamic
      return;
    }
  }
});
```

![customized call log page](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/94cd0f4a-fdca-455b-a6e4-08305276637a)

## Add call log entity matcher

In call logger button, widget needs to know if call is logged. To provide `callLogEntityMatcherPath` when register, widget will send match request to get match result of calls history.

Note: If you have [third party auth](#add-third-party-authorization-button) configured, call log entity matcher only works when `authorized` is `true`.

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

### Trigger call logger entity match manually

The widget will trigger call logger entity match after call logged automatically. But you can still trigger it to match manually

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-trigger-call-logger-match',
  sessionIds: [`call_session_id`],
}, '*');
```
