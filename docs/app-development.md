# Develop and graduate your application in sandbox

Upon successfully [registering your application](app-registration.md) you will be provided with a unique client ID to identify your application on the network. Your next step will be to develop your application using this unique client ID in the RingCentral developer sandbox environment. 

!!! info "Learn more [RingCentral's Developer sandbox environment](https://developers.ringcentral.com/guide/getting-started/using-sandbox)." 

## Initializing your application in sandbox

To develop your application in sandbox, you will need to update two of RingCentral Embeddable's [configuration parameters](config/index.md). Set the following parameters:

| Parameter   | Value                                      |
|-------------|--------------------------------------------|
| `clientId`  | *Your sandbox client ID*                   |
| `appServer` | `https://platform.devtest.ringcentral.com` |

### Example using a `<script>` tag 

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    var clientId = "YOUR CLIENT ID";
	var appServer = "https://platform.devtest.ringcentral.com"
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?clientId="+clientId+"&appServer="+appServer;
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Example using an iframe

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone"
        src="https://ringcentral.github.io/ringcentral-embeddable/app.html?clientId=your_app_client_id&appServer=https://platform.devtest.ringcentral.com">
</iframe>
```

## Graduate your app to production

Sandbox is used by developers when building and testing applications. In order to use the app in production, developers must "graduate" their app. For RingCentral Embeddable apps, the following should be done in sandbox to quality for graduation:

* Send more than 5 SMS messages
* Send more than 5 internal messages (SMS message to extension number in current account)
* Read more than 5 unread inbound messages
* Update presence more than 5 times in setting page
* Go to Contacts page, and click refresh button more than 5 times
* Login and logout more than 5 times
* Make 5 outbound web phone (Browser based) calls
* Make 5 inbound web phone (Browser based) calls
* Make 5 [Ringout](config/call-settings.md) calls
* Control(end/hold) Ringout call in widget more than 5 times in widget

Once you have completed the above steps within a 24-hour period, you should be able to "Apply for production" from the Graduation tab in the Developer Console. If you have successfully fulfilled all requirements, you will obtain a new client ID which can be used in production. 

!!! info "Having difficulty graduating your app?" 
    Please create [developer support ticket](https://developers.ringcentral.com/support/create-case) if you experience issues during the app graduation process.

## Update your client ID and server URL

Once you have successfully graduated your app, update your Embeddable application's `clientId` and `appServer` [configuration parameters](config/index.md) to point your application to RingCentral's production environment.

