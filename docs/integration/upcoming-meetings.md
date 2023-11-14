## Show upcoming meeting list in RingCentral Video page

**Notice**: only work on RingCentral Video meeting service.

First you need to pass `meetingUpcomingPath` when you register meeting invite service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService', // service name
    meetingInvitePath: '/meeting/invite',
    meetingInviteTitle: 'Invite with TestService',
    meetingUpcomingPath: '/meetingUpcomingList
  }
}, '*');
```

Then add a message event to response upcoming meeting  request:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/meetingUpcomingList') {
      // add your codes here to query upcoming meeting from your service
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: {
          data: [{
            id: '123456',
            title: 'Test Meeting in TestService',
            editEventUrl: 'https://your_meeting_uri',
            startTime: "2020-03-22T01:00:00Z",
            endTime: "2020-03-22T02:00:00Z",
            meetingIds: ['433214948'],
          }],
        },
      }, '*');
    }
  }
});
```
