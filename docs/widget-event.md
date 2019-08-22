# The Web Widget Event

The Widget provides some events that developer can get data from it. It is based on [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API.

## Web phone call event

These events are only fired when calling mode is `Browser`. And user has a call in our widget.

Get web phone (Browser) call info from web phone call event:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-call-ring-notify':
        // get call when user gets a ringing call
        console.log(data.call);
        break;
      case 'rc-call-init-notify':
        // get call when user creates a call from dial
        console.log(data.call);
        break;
      case 'rc-call-start-notify':
        // get call when a incoming call is accepted or a outbound call is connected
        console.log(data.call);
        break;
      case 'rc-call-hold-notify':
        // get call when user holds a call
        console.log(data.call);
        break;
      case 'rc-call-resume-notify':
        // get call when user unholds call
        console.log(data.call);
        break;
      case 'rc-call-end-notify':
        // get call on call end event
        console.log(data.call);
        break;
      default:
        break;
    }
  }
});
```

* The `rc-call-ring-notify` event is fired when user gets a ringing incoming call
* The `rc-call-init-notify` event is fired when user create a call from dial pad
* The `rc-call-start-notify` event is fired when user accepts a ringing call or a outbound call is connected
* The `rc-call-hold-notify` event is fired when user holds a call
* The `rc-call-resume-notify` event is fired when user unholds a call.
* The `rc-call-end-notify` event is fired when call is ended.

**Notice:** When user creates a call to a physical phone number, `rc-call-start-notify` is fired when callee accepts call. When user creates a call to a VOIP phone number (such as bettween RingCentral account), `rc-call-start-notify` is fired when outbound call is ringing in callee side.

## RingOut call event

This event is fired when calling mode is `My RingCentral Phone` or `Custom Phone`. [Here](https://support.ringcentral.com/s/article/85) is introduction about RingCentral RingOut call.

Get RingOut call info from RingOut call event:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-ringout-call-notify':
        // get call on active call updated event
        console.log(data.call);
        break;
      default:
        break;
    }
  }
});
```

## Active Call event

This event is fired in `all` calling mode, even call is on another device with same RingCentral account.

Get all active calls in current RingCentral logged user (extension):

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-active-call-notify':
        // get call on active call updated event
        console.log(data.call);
        break;
      default:
        break;
    }
  }
});
```

If user opens multiple tabs, the event will be fired in every tab. `disableInactiveTabCallEvent` is a option that makes widget only fire active call event in last active tab. Just add `disableInactiveTabCallEvent=1` in widget adapter js uri or iframe src.

## Login Status event

Get login status from widget

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-login-status-notify':
        // get login status from widget
        console.log('rc-login-status-notify:', data.loggedIn);
        break;
      default:
        break;
    }
  }
});
```

## Message event

Get all message created or updated event from widget

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-message-updated-notify':
        // get message from widget event
        console.log('rc-message-updated-notify:', data.message);
        break;
      default:
        break;
    }
  }
});
```

Get new inbound message event from widget

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-inbound-message-notify':
        // get new inbound message from widget event
        console.log('rc-inbound-message-notify:', data.message);
        break;
      default:
        break;
    }
  }
});
```

## Route changed event

Get Current page route from widget

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-route-changed-notify':
        // get current page route from widget
        console.log('rc-route-changed-notify:', data.path);
        break;
      default:
        break;
    }
  }
});
```
