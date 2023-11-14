# RingCentral Embeddable events

RingCentral Embeddable emits a number of events that a developer can subscribe to in order to integrate more deeply with the library. Subscribing to these events is done via the [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API.

## Active call event

This event is fired for all [calling modes](../config/call-settings.md), even when the call is on another device within the same RingCentral account. Get all active calls in current RingCentral logged user (extension) via a message event.

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

!!! warning "Working with multiple instances of Embeddable"
    If user opens multiple tabs, the event will be fired in every tab. [`disableInactiveTabCallEvent`](../config/multiple-tabs.md) is a option that makes widget only fire active call event in last active tab. Just add [`disableInactiveTabCallEvent=1`](../config/multiple-tabs.md) in widget adapter js uri or iframe src.

## Dialer status event

Before we use the API [to open the dialer](api.md#go-to-dial-and-start-a-call), we need to check dialer status to make sure it is ready. This event fires whenever the status of the dialer changes. 

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-dialer-status-notify':
        // get dialer status from widget
        console.log('rc-dialer-status-notify:', data.ready);
        break;
      default:
        break;
    }
  }
});
```

## Login popup event

Embeddable will open a popup window in order to login a user when that user clicks the login button. For some reason, you may want to popup window by yourself. So you can use login popup event to get login URI for open login window.

For enabling this event, set the [`disableLoginPopup=1`](../config/popup-window/) configuration parameter.

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-login-popup-notify':
        // get login oAuthUri from widget
        console.log('rc-login-popup-notify:', data.oAuthUri);
        //  window.open(data.oAuthUri); // open oauth uri to login
        break;
      default:
        break;
    }
  }
});
```

This event also allows you to intercept the RingCentral authorization code if you so choose to faciliate authorization, which you can use to complete the [authorization](authorization.md) process for Embeddable. 

## Login status event

You can receive changes to the user's current login status via this event, allowing you reinitiate the login process if the user is loged out, or to perform other login-related operations. 

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-login-status-notify':
        // get login status from widget
        console.log('rc-login-status-notify:', data.loggedIn, data.loginNumber);
        break;
      default:
        break;
    }
  }
});
```

## Meeting status event

Get meeting status and permission:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-meeting-status-notify':
        // get meeting status and permission from widget
        console.log('rc-meeting-status-notify:', data.ready, data.permission);
        break;
      default:
        break;
    }
  }
});
```

## Message event

Get all message created or updated events via Embeddable. These message events include events relating to:

* SMS messages sent/received
* Voicemails received
* Fax messages sent/received

This does not include Team chat messaging events. 

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

### New inbound messages

Get new inbound message event from Embeddable.

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

## Presence sync event

Subscribe to [presence change events](https://developers.ringcentral.com/api-reference/Extension-Presence-Event) for the currently logged in user.

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-adapter-syncPresence':
        // get dndStatus, telephonyStatus, userStatus defined here 
		// https://developers.ringcentral.com/api-reference/Extension-Presence-Event
        console.log(data);
        break;
      default:
        break;
    }
  }
});
```

!!! hint "You can [modify a user's presence](api.md#set-presense) via Embeddable's API"

## Region settings event

Subscribe to any changes to a user's region settings.

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-region-settings-notify':
        // get region settings from widget
        console.log('rc-region-settings-notify:', data);
        break;
      default:
        break;
    }
  }
});
```

## RingOut call event

This event is fired when [calling mode](../config/call-settings.md) is set to `My RingCentral Phone` or `Custom Phone`. Get the RingOut call event via message event:

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

!!! info "Learn more about [RingOut](https://support.ringcentral.com/article-v2/Intro-to-RingOut.html?brand=RingCentral&product=MVP&language=en_US)"

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

## Telephony Session Event

Telephony Session is active call data from new [Call Control API](https://developers.ringcentral.com/api-reference/Call-Control/readCallSessionStatus). In telephony session, we can get full state of caller and callee. We can use Telephony Session event instead of Active Call event.

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-telephony-session-notify':
        // get telehony session on telephony session event
        console.log(data.telephonySession);
        break;
      default:
        break;
    }
  }
});
```

## Web phone call event

These events are only fired when [calling mode](../config/call-settings.md) is set to `Browser` and the user has received a call via Embedddable.

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
      case 'rc-call-mute-notify':
        // get call on call muted or unmuted event
        console.log(data.call);
        break;
      default:
        break;
    }
  }
});
```

### Call event types

| Event | Trigger |
|-|-|
| `rc-call-ring-notify` | fired when user gets a ringing incoming call |
| `rc-call-init-notify` | fired when user create a call from dial pad |
| `rc-call-start-notify` | fired when user accepts a ringing call or a outbound call is connected |
| `rc-call-hold-notify` | fired when user holds a call |
| `rc-call-resume-notify` | fired when user unholds a call |
| `rc-call-end-notify` | fired when call is ended |
| `rc-call-mute-notify` | fired when call is muted or unmuted |

!!! info "VOIP call vs physical phone calls"
    When user creates a call to a physical phone number, `rc-call-start-notify` is fired when callee accepts call. When user creates a call to a VOIP phone number (such as bettween RingCentral account), `rc-call-start-notify` is fired when outbound call is ringing in callee side.

## Web phone connection status event

> supported after `v1.8.3`

Embeddable's web phone (browser-based calling) works only after having successfully connected with a SIP server. To detect when the phone is connected:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-webphone-connection-status-notify':
        // get call on active call updated event
        console.log(data.connectionStatus); // connectionStatus-connected, connectionStatus-disconnected
        break;
      default:
        break;
    }
  }
});
```

## Web phone sessions sync event

> supported after `v1.8.3`

To get current active web phone calls send the sync trigger to Embeddable. 

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-webphone-sessions-sync',
}, '*');
```

!!! info "Only send this trigger *after* getting web phone connected event."

Receive active web phone calls via message event:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-webphone-sessions-sync':
        console.log(data.calls); 
        break;
      default:
        break;
    }
  }
});
```

