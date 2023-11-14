# Third Party Service in Widget

After integrating the RingCentral Embeddable to your application, you can also integrate your own service into the widget, such as show contact data from your application or show a button named with your application.

This document show how the widget can interact with your application deeply.

## Register your service

Find the widget iframe and use `postMessage` to register:

```js
var registered = false;
window.addEventListener('message', function (e) {
  const data = e.data;
  // Register when widget is loaded
  if (data && data.type === 'rc-login-status-notify' && registered === false) {
    registered = true;
    document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
      type: 'rc-adapter-register-third-party-service',
      service: {
        name: 'TestService'
      }
    }, '*');
  }
});
```

