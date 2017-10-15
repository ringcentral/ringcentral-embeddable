# [RingCentral Web Widget](https://ringcentral.github.io/ringcentral-web-widget/)

## Introduction
This is a web application of RingCentral JS Widget.
Build with [RingCentral Commons](https://github.com/ringcentral/ringcentral-js-integration-commons/) and [RingCentral Widget](https://github.com/ringcentral/ringcentral-js-widget).

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

```
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-web-widget/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

To use you own appKey, just update `rcs.src` to following uri:
```
https://ringcentral.github.io/ringcentral-web-widget/adapter.js?appKey=your_app_key
```

### Iframe way

Create a iframe with the following codes:

```
<iframe width="300" height="500" id="rc-widget" src="https://ringcentral.github.io/ringcentral-web-widget/app.html">
</iframe>
```

To use you own appKey, just update `src` to following uri:
```
https://ringcentral.github.io/ringcentral-web-widget/app.html?appKey=your_app_key
```

You can use the config tool in this [page](https://ringcentral.github.io/ringcentral-web-widget) to generate codes with config.

## Customize RedirectUri

In implicit grant flow or authorization code flow, it will require a valid redirect uri that developer set in developers account. This app offers a default redirect uri option that you can use, `https://ringcentral.github.io/ringcentral-web-widget/redirect.html`. But it also allow to config redirect uri.

```
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

```
<iframe width="300" height="500" id="rc-widget" src="https://ringcentral.github.io/ringcentral-web-widget/app.html?redirectUri=your_redirect_uri">
</iframe>
```

But in your redirect page, you need to add following codes to pass callback params to this app.

```
<script>
  if (window.opener) {
    window.opener.postMessage({
      callbackUri: window.location.href,
    }, '*');
  }
</script>
```

## API to contrl web widget

When widget is installed in a iframe, there are some APIs to control it. Those APIs is based on `postMessage`.

### Go to dial and start a new call

```
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-new-call',
  phoneNumber: `phone number`,
  toCall: true,
}, '*');
```
This feature can be used for `Click to Dial`

### Go to SMS

```
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-adapter-new-sms',
  phoneNumber: `phone number`,
}, '*');
```
This feature can be used for `Click to SMS`

### Get new call message from widget

```
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
      default:
        break;
    }
  }
});
```

## How to develop based on this app

### Clone the code
```
git clone https://github.com/ringcentral/ringcentral-web-widget.git
```

### Create api secret file in project root path
```
# api.json
{
  "appKey": "your ringcentral app key",
  "appSecret": "your ringcentral app sercet",
  "server": "ringcentral sever url, eg: https://platform.devtest.ringcentral.com"
}
```
The appSecret is optional. If you don't provide appSecret, app will use implicit grant flow, or it will use
authorization code.

App Permission required: `Edit Message`, `Edit Presence`, `Faxes`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS` and `VoIP Calling`

### Start development server

```
yarn
yarn start
```

open site: 'http://localhost:8080/' on browser
