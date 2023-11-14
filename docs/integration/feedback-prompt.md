# Add feedback prompt in Settings tab

For developer who want to add feedback feature, the app provides a API to show a feed link in settings page:

First, register service with `feedbackPath`:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    feedbackPath: '/feedback',
  }
}, '*');
```

After registering, you can get feedback link in settings page:

![feedback](https://user-images.githubusercontent.com/7036536/218915001-89425b0f-9276-42cc-9d85-a810f69939c0.png)

Add a message event to listen feedback link click event and handle that:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/feedback') {
      
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
      // add your codes here to show your feedback form
      console.log(data);
    }
  }
});
```
