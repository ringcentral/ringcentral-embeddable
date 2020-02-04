# Control Widget

The Widget provides some API that allow developer to control it out of widget. It is based on [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API.

## Go to Dial and start a call

Find the widget iframe and use `postMessage` to send command and data:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-new-call',
  phoneNumber: `phone number`,
  toCall: true,
}, '*');
```

This feature can be used for `Click to Dial`. If you set `toCall` to ture, it will start the call immediately.

If you are using Adapter JS way, just you can just call `RCAdapter.clickToCall('phonenumber')`.

[Here](work-with-ringcentral-c2d.md) is tutorial to use [RingCentral C2D](https://github.com/ringcentral/ringcentral-c2d) library to quick implement `Click to Dial` feature.

## Go to SMS Page

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-new-sms',
  phoneNumber: `phone number`,
}, '*');
```

Go to SMS Page with prefill text

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-new-sms',
  phoneNumber: `phone number`,
  text: `your text`,
}, '*');
```

If you are using Adapter JS way, just you can just call `RCAdapter.clickToSMS('phonenumber')`.

## Control the web call

Following APIs need to work with [Web phone call event](widget-event.md#web-phone-call-event) to get `callId`.

### Answer a ringing call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'answer',
  callId: `call id`
}, '*');
// callId comes from web phone call event

// answer the current ringing call, call id default is current ringing call id.
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'answer',
}, '*');
```

### Reject a ringing call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'reject',
  callId: `call id`
}, '*');
```

### To voicemail a ringing call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'toVoicemail',
  callId: `call id`
}, '*');
```

### Forward a ringing call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'forward',
  callId: `call id`,
  options: {
    forwardNumber: 'forward_number'
  }
}, '*');
```

### Hangup a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'hangup',
  callId: `call id`
}, '*');

// hangup current active call
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'hangup',
}, '*');
```

### Hold a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'hold',
  callId: `call id`
}, '*');
```

### Unhold a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'unhold',
  callId: `call id`
}, '*');
```

### Transfer a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'transfer',
  callId: `call id`,
  options: {
    transferNumber: 'transfer_number'
  }
}, '*');
```

### Record a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'startRecord',
  callId: `call id`
}, '*');
```

**Notice**: this only works after call [started](widget-event.md#web-phone-call-event) (Inbound call accepted/Oubound call connected)

### Stop record a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'stopRecord',
  callId: `call id`
}, '*');
```

### Mute a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'mute',
  callId: `call id`
}, '*');
```

### Unmute a call

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'unmute',
  callId: `call id`
}, '*');
```

## Log out user

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-logout'
}, '*');
```

## Minimize/Hide/Remove the widget

Only for Adapter JS way:

Minimize:

```
RCAdapter.setMinimized(true);
// RCAdapter.setMinimized(false); // maximize
```

Hide:

```
RCAdapter.setClosed(true);
// RCAdapter.setClosed(false); // Show
```

Remove:

```
RCAdapter.dispose();
```
