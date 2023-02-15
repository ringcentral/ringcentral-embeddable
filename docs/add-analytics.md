# Enable Analytics

In widget, we support to export some user behavior events (make call/send sms/schedule meeting) for tracking. It is disabled by default. To enable it, please pass `enableAnalytics`:

## Use adapter JS way:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?enableAnalytics=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Use iframe way:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?enableAnalytics=1">
</iframe>
```

## Listen to track event

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-analytics-track':
        // get analytics data
        console.log('rc-analytics-track:', data.event, data.properties);
        break;
      default:
        break;
    }
  }
});
```
