# Using a custom client ID with RingCentral Emebeddable 

It is strongly recommended that developers register their own applications when deploying and using RingCentral Embeddable in a production context. Doing so has the following benefits:

* You are less likely to be impacted by users of other instances of Emebeddable
* You will have visibility into the analytics of your user's use of your app/integration
* You will be able to better customize your instance of Embeddable

Specifying your own client ID is relatively straight-forward using the steps below. 

## Register an application

1. Login to the [Developer Console]([https://developers.ringcentral.com/](https://developers.ringcentral.com/login.html), creating an account as necessary.
2. Click "Register app"
3. Select the "REST API App" app type
4. Select "3-legged OAuth flow authorization code" auth type and "Client-side web app, e.g. SPA, Javascript"
5. Add the following app scopes:
   * `Edit Message`
   * `Edit Presence`
   * `Internal Messages`
   * `Read Accounts`
   * `Read Call Log`
   * `Read Contacts`
   * `Read Messages`
   * `Read Presence`
   * `RingOut`
   * `SMS`
   * `Call Control`
   * `WebSocketSubscription`
   * `VoIP Calling`
   * `TeamMessaging` (optional)
   * `Video` (optional).
6. Add the following OAuth Redirect URI to your app's auth settings, or provide a [custom redirect URI](customize-redirect-uri.md):
   * `https://ringcentral.github.io/ringcentral-embeddable/redirect.html`

## Update your code

Consult the instructions below depending upon how you have chosen to integrate Embeddable into your web page.

### Using a `<script>` tag 

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    var clientId = "YOUR CLIENT ID";
    var serverUrl = "https://platform.ringcentral.com";
    //var serverUrl = "https://platform.devtest.ringcentral.com"; // sandbox
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?clientId="+clientId+"&appServer="+serverUrl;
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Using an Iframe

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone"
        src="https://ringcentral.github.io/ringcentral-embeddable/app.html?clientId=your_app_client_id&appServer=https://platform.devtest.ringcentral.com">
</iframe>
```

### Notice

`appKey` and `appSecret` have been renamed into `clientId` and `clientSecret` since `v1.4.0`.

We are using [Authorization Code with PKCE](https://medium.com/ringcentral-developers/use-authorization-code-pkce-for-ringcentral-api-in-client-app-e9108f04b5f0) grant flow in this widget since `v1.4.0`. But for backward compatibility, we still support Authorization code flow if you provide `clientSecret` in URI. It isn't recommended to use Authorization Code flow.

In the Authorization code with PKCE flow, a user's access token is managed in the browser's local storage for that user. If a user is inactive for more than 7 days, then the user will be automatically logged out. Embeddable automatically refreshes access tokens when API requests are made to the RingCentral API. 

Refresh tokens expire in 7 days. So if a user is active within those 7 days after logging in, then the login session will be kept for an additional 7 days.

[This](https://ringcentral.github.io/ringcentral-embeddable/) is a config tool that can help you to update codes with config.

## Graduate your app

Sandbox is used by developers when building and testing applications. In order to use the app in production, developers must "graduate" their app. For RingCentral Embeddable apps, the following should be done in sandbox to quality for graduation:

* Send more than 5 SMS messages
* Send more than 5 internal messages (SMS message to extension number in current account)
* Read more than 5 unread inbound messages
* Update presence more than 5 times in setting page
* Go to Contacts page, and click refresh button more than 5 times
* Login and logout more than 5 times
* Make 5 outbound web phone (Browser based) calls
* Make 5 inbound web phone (Browser based) calls
* Make 5 [Ringout](interact-with-calling-settings.md#interact-with-calling-settings) calls
* Control(end/hold) Ringout call in widget more than 5 times in widget

Once you have successfully graduated your app, you will need to update the clientID and serverUrl your instance of Embeddable points to in order to run successfully in production. 

**Notice**: Please create developer support ticket [here](https://developers.ringcentral.com/support/create-case) if you got any issues at app graduation.
