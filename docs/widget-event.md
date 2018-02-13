# The Web Widget Event

The Widget provide some events that developer can get data from it. It is based on [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API.

## Web phone call event

Get web phone call info from web phone call event:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-call-ring-notify':
        // get call on ring event
        console.log(data.call);
        break;
      case 'rc-call-end-notify':
        // get call on call end event
        console.log(data.call);
        break;
      case 'rc-call-start-notify':
        // get call on start a outbound call event
        console.log(data.call);
        break;
      default:
        break;
    }
  }
});
```

## Active Call event

Get all active calls in current extension

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
