# Using your own RingCentral app client id and client secret

Developer should config the Widget to use their own RingCentral app client id and client secret.

1. Create a [RingCentral developer free account](https://developer.ringcentral.com)
2. Create a RingCentral app with platform type - "Browser Based"
3. And add permissions `Edit Message`, `Edit Presence`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS` and `VoIP Calling` to your app. `Active Call Control` is optional, but recommended for [active call control](disable-features.md#enable-active-call-control-feature)
4. Add redirect uri `https://ringcentral.github.io/ringcentral-embeddable/redirect.html` to your app settings. But you can also [customize redirect uri](customize-redirect-uri.md)

## Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?appKey=your_app_client_id&appSecret=your_app_client_secret&appServer=https://platform.devtest.ringcentral.com";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

`appSecret` is optional. If you provide `appSecret` to the Widget, it will use authorization code flow. If not, it will use implicit grant flow to log in. In implicit flow, if user is inactive in 1 hour, login session will be expired. In authorization code flow, if user is inactive in 7 days, login session will be expired.

## Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?appKey=your_app_client_id&appSecret=your_app_client_secret&appServer=https://platform.devtest.ringcentral.com">
</iframe>
```

[This](https://ringcentral.github.io/ringcentral-embeddable/) is a config tool that can help you to update codes with config.

## Graduation for your RingCentral app

For RingCentral app in RingCentral developer website, the initial environment is `Sandbox` which is used for development and test. `Sandbox` environment only works with `Sandbox` account. So before we publish our app into production, we need to graduate app into `production` environment. [Here](https://developers.ringcentral.com/guide/basics/production) is guide for RingCentral app graduation.

For Embeddable app, we need to have full usages with your sandbox client id for graduation requirements:

* Send more then 5 SMS messages
* Send more then 5 internal messages (message to extension number in current account)
* Read more then 5 unread inbound messages
* Update presence more then 5 times in setting page
* Login and logout more then 5 times
* Make 5 outbound web phone (Browser based) calls
* Make 5 inbound web phone (Browser based) calls
* Make 5 [Ringout](interact-with-calling-settings.md#interact-with-calling-settings) calls
* Control(end/hold) Ringout call in widget more then 5 times in widget if enable [active call control](disable-features.md#enable-active-call-control-feature)
