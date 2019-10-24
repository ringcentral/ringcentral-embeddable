# Using your own RingCentrall app client id and client secret

Developer should config the Widget to use their own RingCentral app client id and client secret.

1. Create a [RingCentral developer free account](https://developer.ringcentral.com)
2. Create a RingCentral app with platform type - "Browser Based"
3. And add permissions `Edit Message`, `Edit Presence`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS` and `VoIP Calling` to your app. `Active Call Control` is optional, but recommended for [active call control](docs/disable-features.md#enable-active-call-control-feature)
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
