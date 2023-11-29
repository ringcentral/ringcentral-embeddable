# [RingCentral Embeddable](https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/)

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

New latest build URI changed to `https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/`. See [Migrating from Github Page latest URI](https://ringcentral.github.io/ringcentral-embeddable/docs/integration/new-latest-uri.md) for more details.

## Additional RingCentral Embeddable resources

* [Document and guide website](https://ringcentral.github.io/ringcentral-embeddable/docs)
* [Free online demo and configuration tool](https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/)
* [Watch a video on our website](https://developers.ringcentral.com/embeddable-voice)
* [List of all Embeddable releases](https://github.com/ringcentral/ringcentral-embeddable/releases)

## Getting started

RingCentral Embeddable can be integrate into a web page in two primary ways. 

### Quick start and demo

For those who want to get up and running as quickly as possible, the instructions below allow you to embed a phone into a web page in under a minute. This is perfect for a quick demo or proof of concept. 

*Please note: this quick start mode has all developers share the same client ID and secret. It is NOT recommended for production use as the actions of other users may result in the app being rate-limited, or even suspended - causing disruption to your integration. Once you have successfully demo'ed Embeddable, please [register your own app](docs/config-client-id-and-secret.md) with RingCentral, being careful to configure it properly, and insert your own Client ID into your embed tag.*

#### Embed via a `<script>` tag, a.k.a. "Adapter" method

Add the code below to any web page's header to embed a RingCentral phone in a matter of minutes.

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

#### Embed via an iframe

Insert the following HTML into any webpage to embed a RingCentral phone into that page. 

```html
<iframe width="300" height="500" id="rc-widget" allow="autoplay; microphone"
        src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html">
</iframe>
```

### Register an app

#### Specifying your own Client ID

We recommend developers [register an application](https://developers.ringcentral.com/guide/getting-started/register-app) through which they can manage and monitor all API traffic generated via RingCentral Embeddable. Once the application has been registered, you will need to specify your app's client ID when Embeddable is loaded. The client ID can be specified by appending it to the URL used to load it. For example:

**Via a script tag**
```
https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?clientId=<YOUR CLIENT ID>
```

**Via an iframe**
```
https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?clientId=<YOUR CLIENT ID>
```

### Running Embeddable in sandbox

To run RingCentral Embeddable in our [developer sandbox environment](https://developers.ringcentral.com/guide/getting-started/using-sandbox), pass the sandbox URL to Embeddable via the `appServer` query string parameter. For example:

**Via a script tag**
```
https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?appServer=https://platform.devtest.ringcentral.com
```

**Via an iframe**
```
https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?appServer=https://platform.devtest.ringcentral.com
```

### Use our configuration helper

Use our [RingCentral Embeddable configuration helper](https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/) to generate the HTML or Javascript that you can easily copy and paste into your web page or application.

## Using the latest version of Embeddable

We make the [most recent version of RingCentral Embeddable](https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/) available via CDN. Referencing this build of Embeddable ensures that your application will always have access to the latest features, enhancements, and bug fixes.

### Access a specific version of Embeddable

To better manage risk developers may wish to reference a specific version of RingCentral Embeddable. Doing so ensures that changes RingCentral introduces to Embeddable will not disrupt your existing product. Browse our list of [stable RingCentral Embeddable releases](https://github.com/ringcentral/ringcentral-embeddable/releases), select the version you wish to use, and reference it by its version number. For example:

```
https://apps.ringcentral.com/integration/ringcentral-embeddable/1.4.1
```

Use this versioned URL in place of the URLs above in the adapter examples. 

*Be advised, however, that referencing Embeddable in this way means that you will need to perform all upgrades manually.*

*Developers are urged to use version 1.9 or greater. Developers using older versions of RingCentral Embeddable will cease to function in March 2024 when PubNub support is discontinued.*

## Document and guide

Please refer to [docs website](https://ringcentral.github.io/ringcentral-embeddable/docs)


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
