# Customize Authorization

In widget, we implement RingCentral authorization including authorization code flow and implicit flow. But you can also implement the authorization code flow out of the widget, and pass authorization code to widget for authorizing.

To pass existed RingCentral authorization code:

## Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?authorizationCode=ringcentral_authorization_code&appKey=ringcentral_app_client_id&appSecret=ringcentral_app_client_secret";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?authorizationCode=ringcentral_authorization_code&appKey=ringcentral_app_client_id&appSecret=ringcentral_app_client_secret">
</iframe>
```

We aslo need to pass `appKey` and `appSecret` for customizing [RingCentral app](config-client-id-and-secret.md). The authorization code should be generated with same RingCentral app client id. Once widget got authorized, we don't need to include authorization code in uri in next time. The widget will create access token and refresh token automatically after getting authorization code.

