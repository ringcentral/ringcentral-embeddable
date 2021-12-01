# Using your own RingCentral app client id

Developer should config the Widget to use their own RingCentral app client id.

1. Create a [RingCentral developer free account](https://developer.ringcentral.com)
2. Create a RingCentral app with app type - "**Web browser (Javascript)**"
3. And add permissions `Edit Message`, `Edit Presence`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS`, `Call Control` and `VoIP Calling` to your app.
4. Add redirect uri `https://ringcentral.github.io/ringcentral-embeddable/redirect.html` to your app settings. You can also [customize redirect uri](customize-redirect-uri.md)

## Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?clientId=your_app_client_id&appServer=https://platform.devtest.ringcentral.com";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?clientId=your_app_client_id&appServer=https://platform.devtest.ringcentral.com">
</iframe>
```

### Notice

`appKey` and `appSecret` have been renamed into `clientId` and `clientSecret` since `v1.4.0`.

We are using [Authorization Code with PKCE](https://medium.com/ringcentral-developers/use-authorization-code-pkce-for-ringcentral-api-in-client-app-e9108f04b5f0) grant flow in this widget since `v1.4.0`. But for backward compatibility, we still support Authorization code flow if you provide `clientSecret` in URI. It isn't recommended to use Authorization Code flow.

In authorization code with PKCE grant flow, user token is managed in Browser storage. if user is inactive more than 7 days, user will be logged out. The widget refreshes token when there are API requests to RingCentral API. The refresh token will be expired in 7 days. So if user is active in 7 days, login session will be kept another 7 days. And when it refreshes token, app will get a new refresh token and old refresh token will be expired for security.

[This](https://ringcentral.github.io/ringcentral-embeddable/) is a config tool that can help you to update codes with config.

## Graduation for your RingCentral app

For RingCentral app in RingCentral developer website, the initial environment is `Sandbox` which is used for development and test. `Sandbox` environment only works with `Sandbox` account. So before we publish our app into production, we need to graduate app into `production` environment. [Here](https://developers.ringcentral.com/guide/basics/production) is guide for RingCentral app graduation.

For Embeddable app, we need to have full usages with your sandbox client id for graduation requirements:

* Send more than 5 SMS messages
* Send more than 5 internal messages (message to extension number in current account)
* Read more than 5 unread inbound messages
* Update presence more than 5 times in setting page
* Go to Contacts page, and click refresh button more than 5 times
* Login and logout more than 5 times
* Make 5 outbound web phone (Browser based) calls
* Make 5 inbound web phone (Browser based) calls
* Make 5 [Ringout](interact-with-calling-settings.md#interact-with-calling-settings) calls
* Control(end/hold) Ringout call in widget more than 5 times in widget

**Notice**: Please create developer support ticket [here](https://developers.ringcentral.com/support/create-case) if you got any issues at app graduation.
