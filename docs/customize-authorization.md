# Customize Authorization

In widget, we implement RingCentral authorization including authorization code flow and [authorization code with PKCE flow](https://medium.com/ringcentral-developers/use-authorization-code-pkce-for-ringcentral-api-in-client-app-e9108f04b5f0) for user login. But you can also implement the authorization flow out of the widget, and pass authorization code to widget for login.

**Prerequisites**: [Customize `clientId` and `clientSecret`](config-client-id-and-secret.md)

To pass existed RingCentral authorization code:

## Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?authorizationCode=ringcentral_authorization_code&clientId=ringcentral_app_client_id&clientSecret=ringcentral_app_client_secret";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?authorizationCode=ringcentral_authorization_code&clientId=ringcentral_app_client_id&clientSecret=ringcentral_app_client_secret">
</iframe>
```

## PostMessage way

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-authorization-code',
  callbackUri: "http://localhost:8080/redirect.html?code=U0pDMDFQMDlQQVMwMHxBQURVRHJTaUF1bnltdDF6OWlMcEZhTWtWeldYelhVbmRqbThjaDllRk50NzVReWFxMjVjenpFN3ZJbWZleWJfZnFBT0FaalBGTkM0SXVrc21kTmhZUVJBUDNkV3J0Rzk1aXg3clFVbmR2TDlRRnZWVERBeEEwenJFamxuQ3EtSW1pNGlCSVpqUnAtX0M0QW4tQk9EcXpjeHpXY2JmQjE1cm92aHx1MThGTEF8dDEydzU0bjNQaUI0c196YUVTMEtlUXxBUQ&state=MTU5OTE0MzE5NTQ5OQ%3D%3D"
}, '*');
```

**Notice**

For authorization code flow, `clientId` and `clientSecret` is required with `authorizationCode`. The app needs `clientSecret` to exchange token. The authorization code should be generated with same RingCentral app client id and secret.

For authorization code with PKCE, only `clientId` is required. The widget will create `code_verifier` and `code_challenge` pair for generating oauth uri and exchanging token. So you need to get oauth login URI from it. You can get oauth login uri from this [event](widget-event.md#login-popup-event).
