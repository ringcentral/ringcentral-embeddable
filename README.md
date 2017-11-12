# [RingCentral Web Widget](https://ringcentral.github.io/ringcentral-web-widget/)

## Introduction

This is an out-of-the-box embeddable web application built using the RingCentral JS Widget library.

Built with:

* [RingCentral Commons](https://github.com/ringcentral/ringcentral-js-integration-commons/) and
* [RingCentral Widgets](https://github.com/ringcentral/ringcentral-js-widgets)

## Dependences

* yarn
* webpack 2
* react
* redux

## Visit Online

Visit [website](https://ringcentral.github.io/ringcentral-web-widget/) in github pages.

## Use as a web widget

there are two ways to integrate this widget to a web application

### Adapter way

Just add following the following codes to a website's header. It will create a iframe in your website.

```html
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-web-widget/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

To use you own `appKey`, just update `rcs.src` to following uri:

```
https://ringcentral.github.io/ringcentral-web-widget/adapter.js?appKey=your_app_key
```

### Iframe way

Create a iframe with the following codes:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-web-widget/app.html">
</iframe>
```

To use you own appKey, just update `src` to following uri:

```
https://ringcentral.github.io/ringcentral-web-widget/app.html?appKey=your_app_key
```

You can use the config tool in this [page](https://ringcentral.github.io/ringcentral-web-widget) to generate codes with config.

## Customize RedirectUri

In implicit grant flow or authorization code flow, it will require a valid redirect uri that developer set in developers account. This app offers a default redirect uri option that you can use, `https://ringcentral.github.io/ringcentral-web-widget/redirect.html`. But it also allow to config redirect uri.

```html
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-web-widget/adapter.js?redirectUri=your_redirect_uri";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

Or

```html
<iframe width="300" height="500" id="rc-widget" src="https://ringcentral.github.io/ringcentral-web-widget/app.html?redirectUri=your_redirect_uri">
</iframe>
```

But in your redirect page, you need to add following code to pass callback params to this app.

```html
<script>
  if (window.opener) {
    window.opener.postMessage({
      callbackUri: window.location.href,
    }, '*');
  }
</script>
```

## API to control web widget

When widget is installed in a iframe, there are some APIs to control it. Those APIs is based on `postMessage`.

### Go to dial and start a new call

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-new-call',
  phoneNumber: `phone number`,
  toCall: true,
}, '*');
```
This feature can be used for `Click to Dial`

### Go to SMS

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-new-sms',
  phoneNumber: `phone number`,
}, '*');
```
This feature can be used for `Click to SMS`

### Get new call message from widget

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

### Control the call

#### Answer a ringing call

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'answer',
  callId: `call id`
}, '*');

// answer the current ringing call, call id default is current ringing call id.
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'answer',
}, '*');
```

#### Reject a ringing call

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'reject',
  callId: `call id`
}, '*');
```

#### Hangup a call

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

## How to develop based on this app

### Clone the code

```bash
$ git clone https://github.com/ringcentral/ringcentral-web-widget.git
```

### Create API secret file in project root path

```js
# api.json
{
  "appKey": "your ringcentral app key",
  "appSecret": "your ringcentral app sercet",
  "server": "ringcentral sever url, eg: https://platform.devtest.ringcentral.com"
}
```

The `appSecret` is optional to enable the authorization code flow. If you don't provide `appSecret`, the app will use the implicit grant flow.

App Permissions required: `Edit Message`, `Edit Presence`, `Faxes`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS` and `VoIP Calling`

### Start development server

```bash
$ yarn
$ yarn start
```

Open site: 'http://localhost:8080/' on browser
