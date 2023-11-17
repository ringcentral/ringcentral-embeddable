# Log messages into your service

!!! info "This feature requires you to [register your app as a service](index.md) first."

## Add message logger button in messages page

First you need to pass `messageLoggerPath` and `messageLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    messageLoggerPath: '/messageLogger',
    messageLoggerTitle: 'Log to TestService',
    // messageLoggerAutoSettingLabel: 'Auto log messages', // optional, customize the auto log setting label
    // attachmentWithToken: true,
  }
}, '*');
```

After registered, you can get a `Log to TestService` in messages page, and `Auto log messages` setting in setting page:

![message log button](https://user-images.githubusercontent.com/7036536/60498444-2c890100-9ce9-11e9-980b-c57d5ed50c2d.jpeg)

Then add a message event to response message logger button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/messageLogger') {
      // add your codes here to log messages to your service
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

This message event is fired when user clicks `Log` button. Or if user enables `Auto log messages` in settings, this event will be also fired when a message is created and updated.

In this message event, you can get call information in `data.body.conversation`. Messages are grouped by `conversationId` and `date`. So for a conversation that have messages in different date, you will receive multiple log message event.

For Voicemail and Fax, you can get `attachment` data in message. The `attachment.link` is a link used to get voicemail file from RingCentral server with Browser. The `attachment.uri` is a URI which can be used to get attachment file  with RingCentral access token. If you pass `attachmentWithToken` when register service, you can get `attachment.uri` with `access_token`. The `access_token` will be expired in minutes, so need to download immediately when get it. 

## Auto log messages settings

User can enable/disable auto log in settings page. To set default `Auto log messages` enabled:

Add `defaultAutoLogMessageEnabled` into the `adapter.js` URI:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?defaultAutoLogMessageEnabled=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Add message log entity matcher

In message logger, widget needs to know if messages are logged. To provide `messageLogEntityMatcherPath` when register, widget will send match request to get match result of messages history.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    messageLoggerPath: '/callLogger',
    messageLoggerTitle: 'Log to TestService',
    messageLogEntityMatcherPath: '/messageLogger/match'
  }
}, '*');
```

Then add a message event to response message logger match event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/messageLogger/match') {
      // add your codes here to reponse match result
      console.log(data); // get message conversation log id list in here
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: {
            '674035477569017905/7/2/2019': [{ // conversation log id from request
              id: '88888', // log entity id from your platform
            }]
          }
        },
      }, '*');
    }
  }
});
```
