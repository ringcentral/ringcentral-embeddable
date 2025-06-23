# Creating a customize call log page

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
            // schema and uiSchema are used to customize call log page, api is the same as [jsonschema-page](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page/?path=/docs/readme--docs)
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

!!! note "JSON Schema reference"
    Learn how to define custom page components with JSON schema in the [JSON schema page document](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page/?path=/docs/readme--docs).

![customized call log page](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/94cd0f4a-fdca-455b-a6e4-08305276637a)

