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
