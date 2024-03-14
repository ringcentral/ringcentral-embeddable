# Customized page

The RingCentral Embeddable is a powerful tool that allows you to customize the user experience for your users. You can create a customized page to display your own content in the widget.

Register your service:

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

Register the page:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-customized-page',
  page: {
    id: 'page1', // page id, required
    pageTitle: 'Customized page 1',
    saveButtonLabel: 'Save', // optional if you don't want to show save button
    fields: [{ 
      id: 'warning',
      type: 'admonition.warn', // or 'admonition.info'
      text: "Please authorize the CRM to use this feature."
    }, {
      id: 'contactType',
      label: 'Default link type',
      type: 'input.choice',
      choices: [{
        id: 'Candidate',
        name: 'Candidate',
      }, {
        id: 'Contact',
        name: 'Contact',
      }],
      value: 'Candidate',
    }, {
      id: 'defaultContactName',
      label: 'Default contact name',
      type: 'input.string',
      value: '',
    }, {
      id: 'Default note',
      label: 'Note',
      type: 'input.text',
      value: '',
    }],
  },
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
        console.log('Save button clicked');
        // ...
      }
    }
  }
});
```

When the user clicks the button, you will receive a message with the path `/button-click`. When the user changes the input, you will receive a message with the path `/customizedPage/inputChanged`.
```