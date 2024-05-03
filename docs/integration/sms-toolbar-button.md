# SMS toolbar button

First, register service with `buttonEventPath`:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    buttonEventPath: '/button-click',
    buttons: [{
      id: 'template',
      type: 'smsToolbar',
      icon: 'icon_url',
      label: 'Template',
    }],
  }
}, '*');
```

Add a message event to listen button click event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/button-click') {
      // add your codes here to handle the vcard file download event
      console.log(data.body.button);
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
