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

### Go to Conversation Page

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-new-sms',
  phoneNumber: `phone number`,
  conversation: true, // will go to conversation page if conversation existed
}, '*');
```

### Go to SMS Page with prefilled text

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-new-sms',
  phoneNumber: `phone number`,
  text: `your text`,
}, '*');
```

If you are using Adapter JS way, just you can just call `RCAdapter.clickToSMS('phonenumber')`.

### Auto populate SMS conversation text

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-auto-populate-conversation',
  text: `your text`,
}, '*');
```

**Notice**: This only works when user is on SMS conversation detail page. It will add `your text` into user's conversation input.

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

## Trigger Login button click

App will open login popup window after getting this command. Follow [here](widget-event.md#login-popup-event) to disable popup window, and receive oauth uri.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-login'
}, '*');
```

Notice: this command only works when user isn't logged.

## Minimize/Hide/Remove the widget

Only for Adapter JS way:

Minimize:

```js
RCAdapter.setMinimized(true);
// RCAdapter.setMinimized(false); // maximize
```
> You can also disable `Minimize` feature by following [here](disable-features.md#disable-the-widget-minimized).

Hide:

```js
RCAdapter.setClosed(true);
// RCAdapter.setClosed(false); // Show
```

Remove:

```js
RCAdapter.dispose();
```

## Popup the widget

Only for Adapter JS way and [popup window feature](popup-window.md) enabled:

```js
RCAdapter.popupWindow();  // popup the widget in a standalone window
```

## Navigate To

Navigate to path:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-navigate-to',
  path: '/messages', // '/meeting', '/dialer', '//history', '/settings'
}, '*');
```

## Schedule a meeting

**Notice**: need to have `Meeting` permission in your RingCentral client id.

```js
// meeting info
const meetingBody = {
  topic: "Embbnux Ji's Meeting",
  meetingType: "Scheduled",
  password: "",
  schedule: {
    startTime: 1583312400368,
    durationInMinutes: 60,
    timeZone: {
      id: "1"
    }
  },
  allowJoinBeforeHost: false,
  startHostVideo: false,
  startParticipantsVideo: false,
  audioOptions: [
    "Phone",
    "ComputerAudio"
  ]
};

// send a request to schedule meeting
const requestId = Date.now().toString();
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-message-request',
  requestId: requestId,
  path: '/schedule-meeting',
  body: meetingBody,
}, '*');

// listen response
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-adapter-message-response') {
    if (data.responseId === requestId) {
      console.log(data.response);
    }
  }
});
```

## Set presence

> supported after `v1.8.2`

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-set-presence',
  userStatus: 'Available', // Offline, Busy, Available
  dndStatus: 'TakeAllCalls', // TakeAllCalls, DoNotAcceptAnyCalls, DoNotAcceptDepartmentCalls, TakeDepartmentCallsOnly
}, '*');
```

To get current presence status please refer this [event](widget-event.md#presence-sync-event).

## Show Custom Alert Message

> supported after `v1.8.6`

```js
const requestId = Date.now().toString();
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-message-request',
  requestId: requestId,
  path: '/custom-alert-message',
  alertMessage: 'Test info message',
  alertLevel: 'info',
  ttl: 5000 //5000ms => 5s
}, '*');
```

Note: `alertLevel` can be `info`, `warning` or `danger`.