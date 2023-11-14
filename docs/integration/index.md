# Registering your app as a service in Embeddable

After integrating the RingCentral Embeddable library into your web application, you can also integrate your own custom service into the CTI as well. This will allow you to associate an icon with [contacts you synchronize](address-book.md) into Embeddable via its API, or display a button to [facilitate authorization](third-party-auth.md) with your service. 

## Register your service

Find Embeddable's iframe and use `postMessage` to register your service.

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

