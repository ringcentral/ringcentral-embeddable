# In-page Login (Beta)

RingCentral Embeddable is a whole front-end application, it doesn't need backend server and it saves user data on local browser. But for some developers want to integrate RingCentral service in backend and front-end, RingCentral Embeddable supports to reuse login status from server-side oauth login.

## Prerequisites

* [Use your own app client id and app client secret](config-client-id-and-secret.md)
* [Customize Redirect Uri](customize-redirect-uri.md)

## Implement the OAuth authorization code flow

Firstly, developer should implement the OAuth authorization code flow in own web server. When user goes to developer's website, it should show a ringcentral login button in web page to allow user to login with his RingCentral account to connect RingCentral services. So server can get the RingCentral API token and save it in backend connecting current login user.

## Inject RingCentral Embeddable with in-page mode

After user logins success by developer's authorization code flow, developer should inject the widget with in-page mode and pass same `appKey` to the widget as previous authorization code flow.

### Use adapter way:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?authMode=sso&appKey=your_app_key";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Use iframe way:

```html
<iframe width="300" height="500" id="rc-widget" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?authMode=sso&appKey=your_app_key">
</iframe>
```

With auth In-page mode, the widget will use **implicit flow** and it will redirect to RingCentral OAuth uri if the widget haven't been logined. Because user have logined in previous flow, RingCentral OAuth server will redirect back to the widget with access token. So the widget will be logined without filling password again.
