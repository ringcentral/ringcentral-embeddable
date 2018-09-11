# [RingCentral Embeddable](https://ringcentral.github.io/ringcentral-embeddable/)

## Introduction

This is an out-of-the-box embeddable web application that help developers to integrate RingCentral services to their web applications with few codes.

Built with:

* [RingCentral Widgets](https://github.com/ringcentral/ringcentral-js-widgets) - base on react and redux

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

#### Stable version

We provide latest RingCentral Embeddable version on github page `https://ringcentral.github.io/ringcentral-embeddable`. It includes latest features and bugfix in RingCentral Embeddable. And it will keep up to date with master codes. But we **recommend** developers to use versioned RingCentral Embeddable. Current latest stable version of RingCentral Embeddable is `0.1.0`. You can get versioned app in this uri `https://apps.ringcentral.com/integration/ringcentral-embeddable/0.1.0`.

Just replace `https://ringcentral.github.io/ringcentral-embeddable` in upper codes to the versioned uri, and you will be using versioned RingCentral Embeddable. The versioned app will not be influenced when new features are added, so it will be more stable than latest version. When you need to update RingCentral Embeddable, you need to update the versioned app uri in your codes manually.

To get all versions of RingCentral Embeddable in [here](https://github.com/ringcentral/ringcentral-embeddable/releases).

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
* [Enable and Disable Features in Widget](docs/disable-features.md)
  * Disable messages features
  * Disable Call releated features
  * Disable Conference invite feature
  * [Enable Glip feature](docs/disable-features.md#enable-glip-feature)
* [SSO Login Mode](docs/sso-login-mode.md)

## Awesome Embeddable examples

* RingCentral Embeddable with Salesforce Lightning - [tutorial](https://ringcentral-web-widget-demos.readthedocs.io/en/latest/salesforce_lightning/tutorial/)
* RingCentral Embeddable with Static CRM - [tutorial](https://ringcentral-web-widget-demos.readthedocs.io/en/latest/static_crm/tutorial/)
* RingCentral Embeddable with chrome extension - [repo](https://github.com/embbnux/ringcentral-embeddable-voice-extension)
* RingCentral Embeddable with Third Party service - [repo](https://github.com/embbnux/ringcentral-embeddable-voice-with-third-party)
* RingCentral Embeddable with Electron - Support Linux - [repo](https://github.com/embbnux/ringcentral-embeddable-voice-app)
* RingCentral Embeddable with Game of Thrones theme - [repo](https://github.com/embbnux/ringcentral-web-widget-styles)
* RingCentral Embeddable with Java app - jxBrowser - [repo](https://github.com/tylerlong/jxbrowser-webrtc)

## Contribution and Development

We provide a online version that developers can use to embed and config in their web application. When you want to get a deep development of this widget, you can clone codes of this widget, update it and deploy by yourself.

### Clone the code

```bash
$ git clone https://github.com/ringcentral/ringcentral-embeddable.git
```

### Create a free RingCentral app

1. Create a [RingCentral developer free account](https://developer.ringcentral.com)
2. Create a RingCentral app with platform type - "Browser Based"
3. Add permissions `Edit Message`, `Edit Presence`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS`, `Glip` and `VoIP Calling` to your app.
4. Add redirect uri `http://localhost:8080/redirect.html` to your app settings.

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

### Start development server

We assume you have pre-installed node.js > 8 and yarn.

```bash
$ yarn       # use yarn to install dependences
$ yarn start # start a webpack dev server
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
