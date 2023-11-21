# Show contact's activities from your application

!!! info "This feature requires you to [register your app as a service](index.md) first."

First you need to pass `activitiesPath` and `activityPath` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    activityName: 'TestService', // optional, will use service.name as default
    activitiesPath: '/activities',
    activityPath: '/activity'
  }
}, '*');
```

Add a message event to response activities query event:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/activities') {
      const contact = data;
      console.log(contact);
      const activities = [{
        id: '123',
        subject: 'Title',
        time: 1528854702472
      }];
      // response to widget
      document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
        type: 'rc-post-message-response',
        responseId: data.requestId,
        response: { data: activities },
      }, '*');
    }
    if (data.path === '/activity') {
      const activity = data;
      // handle activity here
      console.log(activity);
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

Data from `activitiesPath` will be showed in contact details page in the widget. Event from `activityPath` is triggered when user click activity item in the widget.

![image](https://user-images.githubusercontent.com/7036536/42258605-2ba93d40-7f8f-11e8-8f4c-c14a397d343e.png)
