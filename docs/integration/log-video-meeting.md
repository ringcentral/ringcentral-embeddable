# Log RingCentral video meeting into your service

!!! info "This feature requires you to [register your app as a service](index.md) first."

!!! info "This is only relevant for customers who use RingCentral Video"

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
