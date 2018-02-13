# Control Widget

The Widget provide some API that allow developer to control it out of widget. It is based on [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API.

## Go to Dial and start a call

Find the widget iframe, and post message to send command and data:

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-new-call',
  phoneNumber: `phone number`,
  toCall: true,
}, '*');
```

This feature can be used for `Click to Dial`. If you set `toCall` to ture, it will start the call immediately.

## Go to SMS Page

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-new-sms',
  phoneNumber: `phone number`,
}, '*');
```

## Control the web call

### Answer a ringing call

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'answer',
  callId: `call id`
}, '*');
// callId comes from web phone call event

// answer the current ringing call, call id default is current ringing call id.
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'answer',
}, '*');
```

### Reject a ringing call

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'reject',
  callId: `call id`
}, '*');
```

### Hangup a call

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'hangup',
  callId: `call id`
}, '*');

// hangup current active call
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'hangup',
}, '*');
```

## Log out user

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-logout'
}, '*');
```
