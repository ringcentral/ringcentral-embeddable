# Add meeting schedule feature with your service

!!! info "This feature requires you to [register your app as a service](index.md) first."

!!! warning "Deprecated. This is only relevant for customers who use RingCentral Meetings"

First we need to add `Meeting` permission into your app in RingCentral Developer website if you are using your own RingCentral client id. This works on RingCentral Video or RingCentral Meetings service.

Then pass `meetingInvitePath` and `meetingInviteTitle` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService', // service name
    meetingInvitePath: '/meeting/invite',
    meetingInviteTitle: 'Invite with TestService',
  }
}, '*');
```

After registered, we can get `Schedule Meeting` page in navigator, and `Invite` button in meeting page:

![meeting page](https://user-images.githubusercontent.com/7036536/54572803-37fb3980-4a24-11e9-9edc-ac81cb0fecac.jpeg)

Add a message event to response meeting invite button event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/meeting/invite') {
      // add your codes here to handle meeting invite data
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

