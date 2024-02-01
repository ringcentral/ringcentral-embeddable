# Call pop

This page describes how to implement the call pop feature based on the Embeddable [events](./events.md).

## Listen for the active call event

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-active-call-notify':
        // only pop call for incoming ringing call
        if (data.call.direction === 'Inbound' && data.call.telephonyStatus === 'Ringing') {
          // here we popup a Google form pre-fill uri:
          const formUri = `https://docs.google.com/forms/d/e/xxxxxxxxx/viewform?usp=pp_url&entry.985526131=${data.call.direction}&entry.1491856435=${data.call.from.phoneNumber}&entry.875629840=${encodeURIComponent(data.call.fromName)}&entry.1789287962=${data.call.to.phoneNumber}&entry.1281736933=${encodeURIComponent(data.call.toName)}`;
          window.open(formUri, 'Call form', 'width=600,height=600');
        }
        break;
      default:
        break;
    }
  }
});
```

Here we listen to active call event. When there is an incoming call, it will popup a Google Forms pre-fill uri.
Get the online demo [here](https://embbnux.github.io/ringcentral-embeddable-call-pop-demo/).
