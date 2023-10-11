# [RingCentral Embeddable](https://ringcentral.github.io/ringcentral-embeddable/)

[![Build Status](https://github.com/ringcentral/ringcentral-embeddable/workflows/CI%20Pipeline/badge.svg?branch=master)](https://github.com/ringcentral/ringcentral-embeddable/actions)
[![Latest release](https://img.shields.io/github/v/release/ringcentral/ringcentral-embeddable)](https://github.com/ringcentral/ringcentral-embeddable/releases)

RingCentral Embeddable is a fully functional, embeddable phone and dialer that is ready to use right out of the box. Using RingCentral Embeddable developers can embed a phone onto any web page to do the following:

* make and receive phone calls
* send and receive SMS messages
* access voicemail
* receive and view faxes
* access the contacts in your address book

For developers, RingCentral Embeddable is also a framework that allows them to customize the display and behavior of the embedded phone. This can be done via simple CSS, and by listening for events emitted by Embeddable to engage custom functionality via Javascript. For example, developers can listen for an event that is triggered when a call ends to surface a dialog to collect call notes. 

RingCentral Embeddable is React and Redux wrapper around [RingCentral Widgets](https://github.com/ringcentral/ringcentral-js-widgets).

## Important notice

All developers are advised to upgrade to RingCentral Embeddable 1.9 or greater. Applications who do not upgrade by March 31, 2024 will cease to function. Learn more about our plan to [end-of-life support for PubNub](https://community.ringcentral.com/articles/116312/end-of-life-for-pubnub-event-delivery-scheduled-fo.html) in our developer community.

## Additional RingCentral Embeddable resources

* [Free online demo and configuration tool](https://ringcentral.github.io/ringcentral-embeddable/)
* [Watch a video on our website](https://developers.ringcentral.com/embeddable-voice)
* [List of all Embeddable releases](https://github.com/ringcentral/ringcentral-embeddable/releases)

## Getting started

RingCentral Embeddable can be integrate into a web page in two primary ways. 

### Quick start and demo

For those who want to get up and running as quickly as possible, the instructions below allow you to embed a phone into a web page in under a minute. This is perfect for a quick demo or proof of concept. 

**Please note: this quick start mode has all developers share the same client ID and secret. It is NOT recommended for production use as the actions of other users may result in the app being rate-limited, or even suspended - causing disruption to your integration. Once you have successfully demo'ed Embeddable, please [register your own app](https://developers.ringcentral.com/guide/getting-started/register-app) with RingCentral, and insert your own Client ID into your embed tag.**

#### Embed via a `<script>` tag, a.k.a. "Adapter" method

Add the code below to any web page's header to embed a RingCentral phone in a matter of minutes.

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

#### Embed via an iframe

Insert the following HTML into any webpage to embed a RingCentral phone into that page. 

```html
<iframe width="300" height="500" id="rc-widget" allow="autoplay; microphone"
        src="https://ringcentral.github.io/ringcentral-embeddable/app.html">
</iframe>
```

### Register an app

#### Specifying your own Client ID

We recommend developers [register an application](https://developers.ringcentral.com/guide/getting-started/register-app) through which they can manage and monitor all API traffic generated via RingCentral Embeddable. Once the application has been registered, you will need to specify your app's client ID when Embeddable is loaded. The client ID can be specified by appending it to the URL used to load it. For example:

**Via a script tag**
```
https://ringcentral.github.io/ringcentral-embeddable/adapter.js?clientId=<YOUR CLIENT ID>
```

**Via an iframe**
```
https://ringcentral.github.io/ringcentral-embeddable/app.html?clientId=<YOUR CLIENT ID>
```

### Running Embeddable in sandbox

To run RingCentral Embeddable in our [developer sandbox environment](https://developers.ringcentral.com/guide/getting-started/using-sandbox), pass the sandbox URL to Embeddable via the `appServer` query string parameter. For example:

**Via a script tag**
```
https://ringcentral.github.io/ringcentral-embeddable/adapter.js?appServer=https://platform.devtest.ringcentral.com
```

**Via an iframe**
```
https://ringcentral.github.io/ringcentral-embeddable/app.html?appServer=https://platform.devtest.ringcentral.com
```

### Use our configuration helper

Use our [RingCentral Embeddable configuration helper](https://ringcentral.github.io/ringcentral-embeddable) to generate the HTML or Javascript that you can easily copy and paste into your web page or application.

## Using the latest version of Embeddable

We make the [most recent version of RingCentral Embeddable](https://ringcentral.github.io/ringcentral-embeddable) available via Github. Referencing this build of Embeddable ensures that your application will always have access to the latest features, enhancements, and bug fixes.

### Access a specific version of Embeddable

To better manage risk developers may wish to reference a specific version of RingCentral Embeddable. Doing so ensures that changes RingCentral introduces to Embeddable will not disrupt your existing product. Browse our list of [stable RingCentral Embeddable releases](https://github.com/ringcentral/ringcentral-embeddable/releases), select the version you wish to use, and reference it by its version number. For example:

```
https://apps.ringcentral.com/integration/ringcentral-embeddable/1.4.1
```

Use this versioned URL in place of the URLs above in the adapter examples. 

*Be advised, however, that referencing Embeddable in this way means that you will need to perform all upgrades manually.*

*Developers are urged to use version 1.9 or greater. Developers using older versions of RingCentral Embeddable will cease to function in March 2024 when PubNub support is discontinued.*

## Customizing RingCentral Embeddable

* [Get started](docs/get-started.md)
* [Browser support](docs/browser-support.md)
* [Use your own app client id](docs/config-client-id-and-secret.md)
* [Customize redirect Uri](docs/customize-redirect-uri.md)
* [Enable multiple tabs support](docs/multiple-tabs.md)
* [Multiple partner brands support](docs/multiple-brands.md)
* [Customize prefix](docs/customize-prefix.md)
* [Work with the Web Widget event](docs/widget-event.md)
  * [Web phone call event](docs/widget-event.md#web-phone-call-event)
  * [Ringout call event](docs/widget-event.md#ringout-call-event)
  * [Active Call event](docs/widget-event.md#active-call-event)
  * [Login Status event](docs/widget-event.md#login-status-event)
  * [Message event](docs/widget-event.md#message-event)
  * [Route event](docs/widget-event.md#route-changed-event)
* [API to control the Web Widget](docs/control-widget.md)
  * [Go to Dial and start a call](docs/control-widget.md#go-to-dial-and-start-a-call)
  * [Go to SMS](docs/control-widget.md#go-to-sms-page)
  * [Control the web call](docs/control-widget.md#control-the-web-call)
    * Answer a ringing call
    * Reject a ringing call
    * Hangup a call
  * [Log out user](docs/control-widget.md#log-out-user)
  * [Minimize and Hide widget](docs/control-widget.md#minimizehideremove-the-widget)
  * [Navigate to](docs/control-widget.md#navigate-to)
  * [Schedule a meeting (RingCentral Video/RingCentral Meetings)](docs/control-widget.md#schedule-a-meeting)
* [Work with RingCentral C2D](docs/work-with-ringcentral-c2d.md)
* [Interact with calling settings](docs/interact-with-calling-settings.md)
* [Third Party Service in Widget](docs/third-party-service-in-widget.md)
  * Register your service
  * Add meeting schedule button with your service
  * Show upcoming meeting list in RingCentral Video page
  * Log RingCentral Video meeting into your service
  * Show contacts from your application
  * Show contact's activities from your application
  * [Log call into your service](docs/third-party-service-in-widget.md#log-call-into-your-service)
  * [Log messages into your service](docs/third-party-service-in-widget.md#log-messages-into-your-service)
  * Add third party authorization button
  * [Third Party Settings](docs/third-party-service-in-widget.md#third-party-settings)
* [Enable and Disable Features in Widget](docs/disable-features.md)
  * Disable messages features
  * Disable Call releated features
  * Enable Conference invite feature
  * Add sign up button on login page
  * [Enable Glip feature](docs/disable-features.md#enable-glip-feature)
  * [Enable Conference(3-way) Calling feature](docs/disable-features.md#enable-conference-call-feature)
  * [Enable Active Call Control feature](docs/disable-features.md#enable-active-call-control-feature)
* [Adapter/Widget badge UI](docs/new-adapter-ui.md)
* [Enable Analytics](docs/add-analytics.md)
* [Customize Widget UI styles](docs/customize-ui-styles.md)
* [Popup a standalone widget](docs/popup-window.md)

## See RingCentral Embeddable in action

The following projects are all examples of RingCentral Embeddable being used on the web.

* Salesforce Lightning - [tutorial](https://ringcentral-web-widget-demos.readthedocs.io/en/latest/salesforce_lightning/tutorial/)
* Static CRM - [tutorial](https://ringcentral-web-widget-demos.readthedocs.io/en/latest/static_crm/tutorial/)
* Chrome extension - [repo](https://github.com/embbnux/ringcentral-embeddable-voice-extension)
* Google with Firefox add-on - [repo](https://github.com/embbnux/ringcentral-embeddable-for-google-firefox-addon)
* Third-party service - [repo](https://github.com/embbnux/ringcentral-embeddable-voice-with-third-party)
* Electron - Support Linux - [repo](https://github.com/embbnux/ringcentral-embeddable-voice-app)
* Game of Thrones theme - [repo](https://github.com/embbnux/ringcentral-web-widget-styles)
* Java app - jxBrowser - [repo](https://github.com/tylerlong/jxbrowser-webrtc)
* Extension factory CLI tool - [repo](https://github.com/ringcentral/ringcentral-embeddable-extension-factory)
