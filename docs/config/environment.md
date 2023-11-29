# Setting your environment

RingCentral supports two different environments in which applications can run. These two environments are:

* **Production**. This is the primary environment for normal RingCentral operations. 
* **Sandbox**. This is an environment set aside exclusively for developers to build and test applications before making them available in production. 

By default, RingCentral Embeddable's `appServer` configuration parameter points to production. 

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        var clientId = "YOUR CLIENT ID";
    	var appServer = "https://platform.devtest.ringcentral.com"
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?clientId="+clientId+"&=appServer="+appServer;
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone"
            src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?clientId=your_app_client_id&appServer=https://platform.devtest.ringcentral.com">
    </iframe>
    ```

!!! warning "`appKey` and `appSecret` have been renamed"
    Starting in version `v1.4.0`, `appKey` has been renamed to `clientId` and `appSecret` has been renamed to `clientSecret`.
