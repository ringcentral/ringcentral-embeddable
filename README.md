# [RingCentral Embeddable](https://ringcentral.github.io/ringcentral-embeddable/)

## Introduction

This is an out-of-the-box embeddable web application that help developers to integrate RingCentral services to their web applications with few codes.

Built with:

* [RingCentral Widgets](https://github.com/ringcentral/ringcentral-js-widgets)

## Dependences

* yarn
* webpack 3
* react
* redux

## Visit Online

Visit [website](https://ringcentral.github.io/ringcentral-embeddable/) in github pages.

## Use as a embeddable web widget

### Get Started

there are two ways to integrate this widget to a web application

#### Adapter JS way

Just add following the following codes to a website's header. It will create a RingCentral Embeddable widget in your website.

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

#### Iframe way

Create a iframe with the following codes:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html">
</iframe>
```

You can use the config tool in this [page](https://ringcentral.github.io/ringcentral-embeddable) to generate codes with config.

### Documents

* [Get Started](docs/get-started.md)
* [Use your own app client id and app client secret](docs/config-client-id-and-secret.md)
* [Customize Redirect Uri](docs/customize-redirect-uri.md)
* [Customize UI styles](docs/customize-ui-styles.md)
* [Work with the Web Widget event](docs/widget-event.md)
  * [Web phone call event](docs/widget-event.md#web-phone-call-event)
  * [Ringout call event](docs/widget-event.md#ringout-call-event)
  * [Active Call event](docs/widget-event.md#active-call-event)
  * [Login Status event](docs/widget-event.md#login-status-event)
  * [Message event](docs/widget-event.md#message-event)
* [API to control the Web Widget](docs/control-widget.md)
  * [Go to Dial and start a call](docs/control-widget.md#go-to-dial-and-start-a-call)
  * [Go to SMS](docs/control-widget.md#go-to-sms-page)
  * [Control the web call](docs/control-widget.md#control-the-web-call)
    * Answer a ringing call
    * Reject a ringing call
    * Hangup a call
  * [Log out user](docs/control-widget.md#log-out-user)
* [Third Party Service in Widget](docs/third-party-service-in-widget.md)
  * Register your service
  * Add a conference invite button with your service
  * Show contacts from your application
  * Show contact's activities from your application
  * Add call logger button in calls page
* [Disable Features in Widget](docs/disable-features.md)
  * Disable messages features
  * Disable Call releated features
  * Disable Conference invite feature
  * [Enable Glip feature](docs/disable-features.md#enable-glip-feature)
* [SSO Login Mode](sso-login-mode.md)

## Contribution and Development

We provide a online version that developers can use to embed and config in their web application. When you want to get a deep development of this widget, you can clone codes of this widget, update it and deploy by yourself.

### Clone the code

```bash
$ git clone https://github.com/ringcentral/ringcentral-embeddable.git
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

App Permissions required: `Edit Message`, `Edit Presence`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS` and `VoIP Calling`

### Start development server

```bash
$ yarn
$ yarn start
```

Open site: 'http://localhost:8080/' on browser

### Deploy on production

If you create pull request to this repo and get merged, CI will deploy it to this repo's github page automatically. But for something that customized, you can deploy it to your own web space, such as your github page.

1. Update `api.json` in production environment
2. Run command to compile codes and build release

```
$ HOSTING_URL=your_host_uri yarn build
```
Please replace `your_host_uri` with your own web host address, such as `https://ringcentral.github.io/ringcentral-embeddable`.

3. Upload all files in release folder to your web space. And visit it in browser.
