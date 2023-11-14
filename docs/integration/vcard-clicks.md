# VCard click handler

In SMS messages, user can receive vcard (contact) file with MMS. We allow third party to handle the vard attachment download event. For example, when user click vcard file download button, your service will receive the vcard URI, and save the contact into your service.

First, register service with `vcardHandlerPath`:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    vcardHandlerPath: '/vcardHandler',
  }
}, '*');
```

Add a message event to listen vcard click event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/vcardHandler') {
      // add your codes here to handle the vcard file download event
      console.log(data.body.vcardUri);
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
