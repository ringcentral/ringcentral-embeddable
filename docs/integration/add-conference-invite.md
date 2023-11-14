# Add a conference invite button with your service

`Conference Invite` is disabled by default, follow [here](../support.md#enabling-the-conference-calling-feature) to enable it.

First you need to pass `conferenceInvitePath` and `conferenceInviteTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService', // service name
    conferenceInvitePath: '/conference/invite',
    conferenceInviteTitle: 'Invite with TestService',
  }
}, '*');
```

After registered, you can get a `Invite with TestService` in conference invite page.

![Conference Invite with Third party](https://user-images.githubusercontent.com/7036536/85112457-3aac9600-b248-11ea-828d-050b5535fa60.png)

Add a message event to response conference invite button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/conference/invite') {
      // add your codes here to handle conference invite data
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
