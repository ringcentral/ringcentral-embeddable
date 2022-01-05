# Customize Authorization

In widget, we implement [RingCentral authorization](https://developers.ringcentral.com/api-reference/Authorization) with login popup window and [authorization code with PKCE flow](https://developers.ringcentral.com/guide/authentication/auth-code-pkce-flow) for user login. But you can also implement the authorization flow out of the widget, and pass authorization code to widget for login.

**Prerequisites**: [Customize `clientId`](config-client-id-and-secret.md)

Pass RingCentral authorization code and code verifier:

### Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?clientId=ringcentral_app_client_id&authorizationCode=ringcentral_authorization_code&authorizationCodeVerifier=code_verifier_for_the_code";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?clientId=ringcentral_app_client_id&authorizationCode=ringcentral_authorization_code&authorizationCodeVerifier=code_verifier_for_the_code">
</iframe>
```

### PostMessage way

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-authorization-code',
  callbackUri: "http://localhost:8080/redirect.html?code=authorization_code&state=MTU5OTE0MzE5NTQ5OQ%3D%3D&code_verifier="
}, '*');
```

### Notice

`authorizationCodeVerifier` query parameter is only supported after `v1.8.1`. And it is not required if you use authorization URI generated from [Login popup event](widget-event.md#login-popup-event).

For authorization code flow (without PKCE), `clientId` and `clientSecret` is required with `authorizationCode`. The app needs `clientSecret` to exchange token. The authorization code should be generated with same RingCentral app client id and secret.
