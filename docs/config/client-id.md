# Using a custom client ID with RingCentral Embeddable 

Upon successfully [registering your application](../app-registration.md) you will be provided with a unique client ID to identify your application on the network. 

## Develop your application in sandbox

Before you can deploy your newly created application to production and remove the FOR DEMO PURPOSES ONLY banner, you will need to point RingCentral Embeddable at [RingCentral's Developer sandbox environment](https://developers.ringcentral.com/guide/getting-started/using-sandbox). 

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        var clientId = "YOUR CLIENT ID";
	    var appServer = "https://platform.devtest.ringcentral.com"
        rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?clientId="+clientId+"&=appServer="+appServer;
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone"
        src="https://ringcentral.github.io/ringcentral-embeddable/app.html?clientId=your_app_client_id&appServer=https://platform.devtest.ringcentral.com">
    </iframe>
    ```

!!! warning "`appKey` and `appSecret` have been renamed"
    Starting in version `v1.4.0`, `appKey` has been renamed to `clientId` and `appSecret` has been renamed to `clientSecret`.
    
## Graduate your app

Sandbox is used by developers when building and testing applications. In order to use the app in production, developers must "graduate" their app. For RingCentral Embeddable apps, the following should be done in sandbox to quality for graduation:

* Send more than 5 SMS messages
* Send more than 5 internal messages (SMS message to extension number in current account)
* Read more than 5 unread inbound messages
* Update presence more than 5 times in setting page
* Go to Contacts page, and click refresh button more than 5 times
* Login and logout more than 5 times
* Make 5 outbound web phone (Browser based) calls
* Make 5 inbound web phone (Browser based) calls
* Make 5 [Ringout](call-settings.md#interact-with-calling-settings) calls
* Control(end/hold) Ringout call in widget more than 5 times in widget

!!! info "Having difficulty graduating your app?" 
    Please create [developer support ticket](https://developers.ringcentral.com/support/create-case) if you experience issues during the app graduation process.

## Update your client ID and server URL

Once you have successfully graduated your app, be sure to update the `clientID` and `serverUrl` your instance of Embeddable points to in order to run successfully in production. 

