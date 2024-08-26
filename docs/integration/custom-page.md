# Custom page

<!-- md:version 2.0.0 -->

RingCentral Embeddable is a powerful tool that allows you to customize the user experience for your users. You can create customized pages or tabs to display your own content in the widget.

## Register a page

Register a customized page:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-customized-page',
  page: {
    id: 'page1', // page id, required
    title: 'Customized page 1',
    type: 'page',
    // schema and uiSchema are used to customize page, api is the same as [react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form)
    schema: {
      type: 'object',
      required: ['contactType', 'defaultContactName'],
      properties: {
        "warning": {
          "type": "string",
          "description": "Please authorize the CRM to use this feature."
        },
        "someMessage": {
          "type": "string",
          "description": "This is a description message"
        },
        "openSettingsButton": {
          "type": "string",
          "title": "Open CRM settings",
        },
        "contactType": {
          "type": "string",
          "title": "Default link type",
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
        "defaultContactName": {
          "type": "string",
          "title": "Default contact name",
        },
        "defaultNote": {
          "type": "string",
          "title": "Default note",
        },
      },
    },
    uiSchema: {
      submitButtonOptions: { // optional if you don't want to show submit button
        submitText: 'Save',
      },
      warning: {
        "ui:field": "admonition",
        "ui:severity": "warning",  // "warning", "info", "error", "success"
      },
      someMessage: {
        "ui:field": "typography",
        "ui:variant": "body1", // "caption1", "caption2", "body1", "body2", "subheading2", "subheading1", "title2", "title1"
      },
      openSettingsButton: {
        "ui:field": "button",
        "ui:variant": "contained", // "text", "outlined", "contained", "plain"
        "ui:fullWidth": true
      },
      defaultContactName: {
        "ui:placeholder": 'Enter default contact name',
      },
      defaultNote: {
        "ui:placeholder": 'Enter default note',
        "ui:widget": "textarea", // show note input as textarea
      },
    },
    formData: {
      contactType: 'candidate',
      defaultContactName: 'John Doe',
      defaultNote: '',
    },
  },
}, '*');
```

To update the page, you can re-register the page with new data and same page id.

Navigate to the page:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-navigate-to',
  path: '/customized/page1', // page id
}, '*');
```

![customized page](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/2a20feaf-1336-4559-a488-ed327dd49ddc)

## Handle button clicked and input changed event

Pass `buttonEventPath` and `customizedPageInputChangedEventPath` when you register service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    customizedPageInputChangedEventPath: '/customizedPage/inputChanged',
    buttonEventPath: '/button-click',
  }
}, '*');
```

Add event listener to get button clicked and input changed event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/customizedPage/inputChanged') {
      console.log(data); // get input changed data in here: data.body.input
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
      // you can re-register page data here to update the page
      return;
    }
    if (data.path === '/button-click') {
      if (data.body.button.id === 'page1') {
        // on submit button click
        // button id is the page id
        console.log('Save button clicked');
        // ...
      }
      if (data.body.button.id === 'openSettingsButton') {
        // click on the button registered in schema, button id is the button key
        console.log('Open settings button clicked');
        // ...
      }
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

When the user clicks the button, you will receive a message with the path `/button-click`. When the user changes the input, you will receive a message with the path `/customizedPage/inputChanged`.
