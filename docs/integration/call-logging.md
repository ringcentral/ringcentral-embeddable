# Log a call in your service

!!! info "This feature requires you to [register your app as a service](index.md) first."

## Add call log button/icon in call history tab

First you need to pass `callLoggerPath` and `callLoggerTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    // callLoggerAutoSettingLabel: 'Auto log calls', // optional, customized the auto log setting label
    // recordingWithToken: 1
  }
}, '*');
```

After registered, you can get a `Log to TestService` in calls page, and `Auto log calls` setting in setting page

![calllogbutton](https://user-images.githubusercontent.com/7036536/48827686-d1814a00-eda8-11e8-81e4-2b48b1df2bcc.png)

Then add a message event to response call logger button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/callLogger') {
      // add your codes here to log call to your service
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

This message event is fired when user clicks `Log` button. Or if user enables `Auto log calls` in settings, this event will be also fired when a call is started and updated.

In this message event, you can get call information in `data.body.call`. When call is recorded and recording file is generated, you can get `recording` data in `data.body.call`:

```js
{
  contentUri: "https://media.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004/content"
  id: "6469338004"
  link: "http://apps.ringcentral.com/integrations/recording/sandbox/?id=Ab7937-59r6EzUA&recordingId=6469338004"
  type: "OnDemand"
  uri: "https://platform.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004"
}
```

The `link` property in `recording` is a link to get and play recording file from RingCentral server. The `contentUri` is a URI which can be used to get `recording` file  with RingCentral access token. If you pass `recordingWithToken` when register service, you can get contentUri with `access_token`. The `access_token` will be expired in minutes, so need to download immediately when get it.

```js
{
  contentUri: "https://media.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004/content?access_token=ringcentral_access_token"
  id: "6469338004"
  link: "http://apps.ringcentral.com/integrations/recording/sandbox/?id=Ab7937-59r6EzUA&recordingId=6469338004"
  type: "OnDemand"
  uri: "https://platform.devtest.ringcentral.com/restapi/v1.0/account/170848004/recording/6469338004"
}
```

## Auto log calls setting

<!-- md:version 1.10.0 -->

User can enable/disable auto log in settings page. To set default `Auto log calls` enabled:

Add `defaultAutoLogCallEnabled` into the `adapter.js` URI:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?defaultAutoLogCallEnabled=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

Listen to `Auto log calls` setting changed:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-callLogger-auto-log-notify') {
    console.log('rc-callLogger-auto-log-notify:', data.autoLog);
  }
});
```

## Add call logger modal

For some developers who want to add note when log a call to their platform, we provide a log modal to support it.

Add `showLogModal` when register service:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    showLogModal: true,
  }
}, '*');
```

![image](https://user-images.githubusercontent.com/7036536/48827685-d1814a00-eda8-11e8-8160-0fb92cbb88f5.png)

## Add call log entity matcher

In call logger button, widget needs to know if call is logged. To provide `callLogEntityMatcherPath` when register, widget will send match request to get match result of calls history.

Note: If you have [third party auth](#add-third-party-authorization-button) configured, call log entity matcher only works when `authorized` is `true`.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    callLoggerPath: '/callLogger',
    callLoggerTitle: 'Log to TestService',
    callLogEntityMatcherPath: '/callLogger/match'
  }
}, '*');
```

Then add a message event to response call logger matcher event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/callLogger/match') {
      // add your codes here to reponse match result
      console.log(data); // get call session id list in here
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: {
            '214705503020': [{ // call session id from request
              id: '88888', // call log entity id from your platform
              note: 'Note', // Note of this call log entity
            }]
          }
        },
      }, '*');
    }
  }
});
```

### Trigger call logger entity match manually

The widget will trigger call logger entity match after call logged automatically. But you can still trigger it to match manually

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-trigger-call-logger-match',
  sessionIds: [`call_session_id`],
}, '*');
```

## Get un-logged calls

<!-- md:version 2.1.0 -->

When user have calls in other device during the widget closed, those calls data can't be sent by the `callLoggerPath` event even auto log enabled. You can get those calls by un-logged calls api.

```js
const { calls, hasMore } = await RCAdapter.getUnloggedCalls(PER_PAGE, PAGE_NUMBER); // PER_PAGE: number of calls per page, PAGE_NUMBER: page number
```
