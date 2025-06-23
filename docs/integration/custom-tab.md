# Custom tab

<!-- md:version 2.0.0 -->

RingCentral Embeddable is a powerful tool that allows you to customize the user experience for your users. You can create customized pages or tabs to display your own content in the widget.

## Register a tab

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-customized-page',
  page: {
    id: 'tabID', // tab id, required
    title: 'CRM',
    type: 'tab', // tab type
    iconUri: 'https://xxx/icon.png', // icon for tab, 24x24, recommended color: #16181D
    activeIconUri: 'https://xxx/icon-active.png', // icon for tab in active status, 24x24, recommended color: ##2559E4
    darkIconUri: 'https://xxx/icon-dark.png', // Supported from v2.2.1, icon for tab in dark mode, 24x24, recommended color: #ffffff
    hidden: false, // optional, default false, whether to hide the tab icon from navigation bar
    unreadCount: 0, // optional, unread count, 0-99
    priority: 31, // tab priority, 0-100, 0 is the highest priority, Phone tab: 10, Text: 20, Fax: 30, Glip: 40, Contacts: 50, Video: 60, Settings: 70
    // schema and uiSchema are used to customize page, api is the same as [jsonschema-page](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page/?path=/docs/readme--docs)
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

!!! note "JSON Schema reference"
    Learn how to define custom page with JSON schema in the [JSON schema page document](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page/?path=/docs/readme--docs).

Navigate to the tab:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-navigate-to',
  path: '/customizedTabs/tabID', // page id
}, '*');
```

![Customized tab](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/3dfba67e-2422-41ec-98a3-43847de6396b)

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

## Show list in customized tab

![customized list](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/865e73e2-776b-4baf-87ed-fb52d965c84a)

You can show a list in the customized page:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-customized-page',
  page: {
    id: 'tabID', // tab id, required
    title: 'CRM',
    type: 'tab', // tab type
    iconUri: 'https://xxx/icon.png', // icon for tab, 24x24
    activeIconUri: 'https://xxx/icon-active.png', // icon for tab in active status, 24x24
    priority: 31,
    // schema and uiSchema are used to customize page, api is the same as [react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form)
    schema: {
      type: 'object',
      required: [],
      properties: {
        "search": {
          "type": "string",
        },
        "opportunity": {
          "type": "string",
          "oneOf": [{
            "const": "opportunity1",
            "title": "Opportunity 1",
            "description": "This is a description message",
            "meta": "4/18",
            "icon": "https://xxx/icon1.png"
          }, {
            "const": "opportunity2",
            "title": "Opportunity 2",
            "description": "This is a description message 2",
            "meta": "4/15",
            "icon": "https://xxx/icon1.png"
          }]
        },
        "section": {
          "type": "string",
          "oneOf": [{
            "const": "advanced1",
            "title": "Advanced settings 1",
          }, {
            "const": "advanced2",
            "title": "Advanced settings 2",
          }]
        },
      },
    },
    uiSchema: {
      search: {
        "ui:placeholder": 'Search',
        "ui:label": false,
      },
      opportunity: {
        "ui:field": "list",
        "ui:showIconAsAvatar": true, // optional, default true. show icon as avatar (round) in list
      },
      section: {
        "ui:field": "list",
        "ui:navigation": true, // optional, default false. show list as navigation items, supported from v2.1.0. it can be used to navigate to another page
      },
    },
    formData: {
      search: '',
      opportunity: '',
    },
  },
}, '*');
```

When user clicks on the list item, you will receive a message with the path `/customizedPage/inputChanged`.
