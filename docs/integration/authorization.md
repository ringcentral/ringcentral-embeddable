# Alternative authorization methods

RingCentral Embeddable supports the [Authorization code with PKCE](https://developers.ringcentral.com/guide/authentication/auth-code-pkce-flow) grant type to facilitate user's logging into RingCentral. This is the recommended authorization method for applications like those built on top of RingCentral Embeddable. Therefore, no changes are necessary to enable authorization and usage of RingCentral Embeddable. However, some developers in specific and rare circumstances may wish to utilize a different method of authorization. This guide will instruct developers on how to do so. 

!!! info "Access tokens are stored in a browser's local storage"
    In the Authorization code with PKCE flow, a user's access token is managed safely and securely in the browser's local storage for that user. If a user is inactive for more than 7 days, then the user will be automatically logged out. Embeddable automatically refreshes access tokens when API requests are made to the RingCentral API, so as long as the user remains active, they will not be required to login again. Users that are inactive for longer than seven days, however, will be required to login to RingCentral again. 

## JWT flow

Developers can login to RingCentral Embeddable using the [JWT auth flow](https://developers.ringcentral.com/guide/authentication/jwt/quick-start) if they so choose. However, doing so means that every user of RingCentral Embeddable will be logged in as the same user, which may undermine the value of RingCentral's audit trail and security practices. Please use at your own risk. 

!!! warning "JWT auth flow in Embeddable is experimental"
    While the JWT auth flow itself is not experimental, its usage within the context of RingCentral Embeddable is. This is due to the fact that using JWT in this way is beyond the intended design of Embeddable, and could be problematic in some circumstances. 
	
	JWT also requires you to expose your client secret, which if exposed publicly could expose you to some security risks. 

### Via Javascript

```js
<script>
  (function() {
    var rcs = document.createElement("script");
	var clientId = "<YOUR CLIENT ID>";
	var clientSecret = "<YOUR CLIENT SECRET>";
	var jwt = "<YOUR JWT TOKEN>";
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?"+
	    "clientId="+clientId+"&clientSecret="+clientSecret+"&jwt="+jwt;
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Via iframe

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" 
    src="https://ringcentral.github.io/ringcentral-embeddable/app.html?clientId=ringcentral_app_client_id&clientSecret=ringcentral_app_client_secret&jwt=your_jwt_token">
</iframe>
```

## Authorization code flow

!!! danger "Authorization code flow has been deprecated"
    RingCentral Embeddable utilizes the [Authorization Code with PKCE](https://medium.com/ringcentral-developers/use-authorization-code-pkce-for-ringcentral-api-in-client-app-e9108f04b5f0) grant flow by default since `v1.4.0`. Developers are required to upgrade.
	
	If for debugging purposes you need to utilize this mode or authorization, developers can specify their app's client secret using the `clientSecret` URI parameter via a script tag's `src` attribute, or an iframe's `href` attribure. 

Pass RingCentral authorization code and code verifier:

### Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
	var clientId = "<YOUR CLIENT ID>";
	var clientSecret = "<YOUR CLIENT SECRET>";
	var authCode = "<AUTH CODE>";
	var authCodeVerifier = "<AUTH CODE VERIFIER>";
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?"+
	   "clientId="+clientId+"&authorizationCode="+authCode+"&authorizationCodeVerifier="+authCodeVerifier;
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
  callbackUri: "http://localhost:8080/redirect.html?"+
     "code=authorization_code&state=MTU5OTE0MzE5NTQ5OQ%3D%3D&code_verifier="
}, '*');
```

!!! info "`authorizationCodeVerifier` query parameter is only supported after `v1.8.1`"
     `authorizationCodeVerifier` is not required if you use the authorization URI generated from the [login popup event](events.md#login-popup-event).
	 
	 For authorization code flow (without PKCE), `clientId` and `clientSecret` is required with `authorizationCode`. The app needs `clientSecret` to exchange token. The authorization code should be generated with same RingCentral app client id and secret.

