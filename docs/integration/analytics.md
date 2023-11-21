# Enable analytics

Developers can implement their own custom event tracking with internal or third-party analytics systems using Embeddable's API. This feature is disabled by default. To enable analytics tracking, enable the [`enableAnalytics`](../config/index.md) configuration parameter.

## Listen for the track event

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
