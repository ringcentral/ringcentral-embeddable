# Log messages into your service

!!! info "This feature requires you to [register your app as a service](index.md) first."

## Add message logger button in messages page

First you need to pass `messageLoggerPath` and `messageLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    messageLoggerPath: '/messageLogger',
    messageLoggerTitle: 'Log to TestService',
    // messageLoggerAutoSettingLabel: 'Auto log messages', // optional, customize the auto log setting label
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

This message event is fired when user clicks `Log` button. Or if user enables `Auto log messages` in settings, this event will be also fired when a message is created and updated.

In this message event, you can get call information in `data.body.conversation`. Messages are grouped by `conversationId` and `date`. So for a conversation that have messages in different date, you will receive multiple log message event.

For Voicemail and Fax, you can get `attachment` data in message. The `attachment.link` is a link used to get voicemail file from RingCentral server with Browser. The `attachment.uri` is a URI which can be used to get attachment file  with RingCentral access token. If you pass `attachmentWithToken` when register service, you can get `attachment.uri` with `access_token`. The `access_token` will be expired in minutes, so need to download immediately when get it. 

## Auto log messages settings

<!-- md:version 1.10.0 -->

User can enable/disable auto log in settings page. To set default `Auto log messages` enabled:

Add `defaultAutoLogMessageEnabled` into the `adapter.js` URI:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?defaultAutoLogMessageEnabled=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

Listen to `Auto log messages` setting changed:

<!-- md:version 2.0.0 -->

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-messageLogger-auto-log-notify') {
    console.log('rc-messageLogger-auto-log-notify:', data.autoLog);
  }
});
```

## Add message log entity matcher

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

## Message log page

<!-- md:version 2.0.0 -->

You can also add a message log page to have an related form when user logs messages to your service. 

![customized message log page](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/350c4f8b-63bd-4963-ab14-cd7ebefb6913)

Register message log service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    messageLoggerPath: '/messageLogger',
    messageLoggerTitle: 'Log to TestService',
    messagesLogPageInputChangedEventPath: '/messageLogger/inputChanged',
  }
}, '*');
```

Then add message event listener to show message log page and input changed request:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/messageLogger') {
      // Get trigger type: data.body.triggerType
      // When user click log button in message item, triggerType is 'manual'
      // When user enable auto log, triggerType is 'auto' for new message
      if (data.body.triggerType === 'manual') {
        // customize message log page
        document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
          type: 'rc-adapter-update-messages-log-page',
          page: {
            title: 'Log to TestService',
            // schema and uiSchema are used to customize call log page, api is the same as [JSON schema page document](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page/?path=/docs/readme--docs)
            schema: {
              type: 'object',
              required: ['contact', 'noteActions'],
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
                "noteActions": {
                  "type": "string",
                  "title": "Note actions",
                  "oneOf": [
                    {
                      "const": "prescreen",
                      "title": "Prescreen"
                    },
                    {
                      "const": "interview",
                      "title": "Interview"
                    }
                  ],
                },
                "note": {
                  "type": "string",
                  "title": "Note"
                },
              }
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
                "ui:widget": "hidden", // remove this line to show contactName input
              },
              note: {
                "ui:placeholder": 'Enter note',
                "ui:widget": "textarea",  // show note input as textarea
              },
              submitButtonOptions: {
                submitText: 'Save',
              },
            },
            formData: {
              contact: 'xxx',
              contactName: '',
              contactType: '',
              noteActions: 'prescreen',
              note: '',
            },
          }，
        }, '*');
        // navigate to message log page
        document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
          type: 'rc-adapter-navigate-to',
          path: `/log/messages/${data.body.conversation.conversationId}`, // conversation id that you received from message logger event
        }, '*');
      }
      if (data.body.triggerType === 'logForm' || data.body.triggerType === 'auto') {
        // Save message log to your platform
        console.log(data.body); // data.body.conversation, data.body.formData
      }
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
    if (data.path === '/messageLogger/inputChanged') {
      console.log(data); // get input changed data in here: data.body.formData
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
      // you can update message log page data here to make the form dynamic
      return;
    }
  }
});
```

!!! note "JSON Schema reference"
    Learn how to define custom page with JSON schema in the [JSON schema page document](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page/?path=/docs/readme--docs).

## Granular per-message SMS logging

By default SMS messages are logged as a daily digest (grouped by `conversationId` and `date`). For manual-logging workflows that need to attribute individual messages to different CRM records (e.g. legal/consulting matters), you can enable granular per-message selection.

When enabled, the SMS conversation view shows a checkbox next to every unlogged message (checked by default) and a logged icon on messages that are already logged. The header `Log` button then logs only the checked messages.

!!! info "Requirements"
    Granular selection only renders when the user/account uses **manual** SMS logging (auto log disabled). When auto log is enabled, the standard daily-digest behavior is used.

Enable it in your service manifest:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    messageLoggerPath: '/messageLogger',
    messageLoggerTitle: 'Log to TestService',
    messageLogEntityMatcherPath: '/messageLogger/match',
    messageLogOpenPath: '/messageLogger/openLog', // optional; navigate to a logged entry
    messageLoggerGranularSelectionEnabled: true,  // turn on per-message selection
  }
}, '*');
```

### Log selected messages

When the user clicks `Log`, the widget posts a request to `messageLoggerPath` with `triggerType: 'selectedLog'` and a snapshot of the checked message ids in `body.selectedMessageIds`. Only these messages are included in `body.conversation.messages`.

Respond with a `logId` that identifies the created CRM entry. The widget stores it per selected message so it can render the logged icon and navigate back to the entry.

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request' && data.path === '/messageLogger') {
    if (data.body.triggerType === 'selectedLog') {
      var selectedIds = data.body.selectedMessageIds; // e.g. ['123', '456']
      var conversation = data.body.conversation;      // conversation.messages contains only selected messages
      // ...create a single CRM entry from the selected messages...
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: { logId: 'crm-log-entry-id' } },
      }, '*');
    }
  }
});
```

### Per-message logged state

On conversation load the widget requests logged state for the visible messages by posting `{ conversationId, messageIds }` to `messageLogEntityMatcherPath`. Return, per message id, an object containing the `logId` it was logged into (omit unlogged messages):

```js
if (data.path === '/messageLogger/match') {
  // data.body.messageIds: ['123', '456', '789']
  document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
    type: 'rc-post-message-response',
    responseId: data.requestId,
    response: {
      data: {
        '123': { logId: 'crm-log-entry-id' }, // logged
        '456': { logId: 'crm-log-entry-id' },
        // '789' omitted => unlogged, shows a checkbox
      }
    },
  }, '*');
}
```

### Open a logged entry

Clicking the logged icon posts `{ logId, triggerType: 'openLog' }` to `messageLogOpenPath` (falls back to `messageLoggerPath` if not provided). Use it to navigate the user to the CRM record (for example via `rc-adapter-navigate-to`).
