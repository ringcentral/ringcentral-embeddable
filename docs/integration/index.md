# Service integration features

After integrating the RingCentral Embeddable library into your web application, you can also integrate your own custom service into the CTI as well. This will allow you to associate an icon with [contacts you synchronize](address-book.md) into Embeddable via its API, or display a button to [facilitate authorization](third-party-auth.md) with your service. In a nutshell, anywhere in Embeddable where the library allows you to modify or augment the user interface, requires you to first register your service so the Embeddable can properly indicate what features are native to the CTI, and which ones have been added by a third-party. 

## Registering your app as a service in Embeddable

The code below shows how to register your service. When you do so you will choose a name for your service, below we use `TestService`. You will use that exact same name when engaging with the service API features. You will register your service by using the `postMessage` API.

```js title="Registering your service via postMessage"
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

