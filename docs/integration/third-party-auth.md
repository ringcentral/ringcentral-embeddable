## Add third party authorization button

For some CRM API, they requires user to authorize firstly. This feature allows developer to add a third party authorization button and sync status into widget.

First you need to pass `authorizationPath`, `authorizedTitle`, `unauthorizedTitle` and `authorized` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    authorizationPath: '/authorize',
    authorizedTitle: 'Unauthorize',
    unauthorizedTitle: 'Authorize',
    authorized: false,
    authorizedAccount: 'test@email.com', // optional, authorized account email or id
    authorizationLogo: 'https://your_brand_picture/logo.png', // optional, show your brand logo in authorization section, recommended: height 20px, width < 85px.
    // showAuthRedDot: true, // optional, this will show red dot at settings page when need to auth
  }
}, '*');
```

After registered, you can get a `TestService authorization button` in setting page:

![authorization image](https://user-images.githubusercontent.com/7036536/55848678-55817600-5b80-11e9-8eb3-a784a56997a8.jpeg)

Add a message event to response authorization button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/authorize') {
      // add your codes here to handle third party authorization
      console.log(data);
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: 'ok' },
      }, '*');
    }
  }
});
```

Update authorization status in widget:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-update-authorization-status',
  authorized: true,
}, '*');
```

**Notice:** If you register authorization service into widget, upper contacts related service will works only after status changed to authorized.
