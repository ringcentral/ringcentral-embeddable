# Develop your application in sandbox

!!! info "Introducing RingCentral Embeddable 2.0 beta"
    Consider building your Embeddable application on the [next version of RingCentral Embeddable](2.x.md) to take full advantage of the new features and capabilities it brings. 

Upon successfully [registering your application](app-registration.md) you will be provided with a unique client ID to identify your application on the network. Your next step will be to develop your application using this unique client ID in the RingCentral environment. 

## Initializing your application

To develop your application in sandbox, you will need to update two of RingCentral Embeddable's [configuration parameters](config/index.md). Set the following parameters:

| Parameter   | Value                              |
|-------------|------------------------------------|
| `clientId`  | *Your client ID*                   |
| `appServer` | `https://platform.ringcentral.com` |

### Example using a `<script>` tag 

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    var clientId = "YOUR CLIENT ID";
	var appServer = "https://platform.ringcentral.com"
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?clientId="+clientId+"&appServer="+appServer;
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Example using an iframe

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone"
        src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?clientId=your_app_client_id&appServer=https://platform.ringcentral.com">
</iframe>
```

