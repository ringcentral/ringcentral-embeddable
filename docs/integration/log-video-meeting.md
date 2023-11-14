## Log RingCentral Video meeting into your service

**Notice**: only work on RingCentral Video meeting service.

First you need to pass `meetingLoggerPath` and `meetingLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    meetingLoggerPath: '/meetingLogger',
    meetingLoggerTitle: 'Log to TestService',
  }
}, '*');
```

After registered, you can get a `Log to TestService` in meeting history page.

Then add a message event to response meeting logger button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/meetingLogger') {
      // add your codes here to log meeting to your service
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
