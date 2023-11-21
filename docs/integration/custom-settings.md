# Custom third-party settings and preferences

!!! info "This feature requires you to [register your app as a service](index.md) first."

For some features that support user to enable or disable, widget supports to add settings into widget's setting page. Now this only supports toggles.

First, register service with `settings` and `settingsPath`:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    settingsPath: '/settings',
    settings: [{ name: 'Open contact page when call coming', value: true }],
  }
}, '*');
```

After registering, you can get your setting in settings page:

![settings](https://user-images.githubusercontent.com/7036536/59655815-2b76b080-91ce-11e9-90e2-4a03a10c84bf.jpeg)

Add a message event to listen settings updated event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/settings') {
      // add your codes here to save settings into your service
      console.log(data);
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
