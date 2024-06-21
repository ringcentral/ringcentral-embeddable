# SMS template

<!-- md:version 2.0.0 -->

The SMS template feature is supported starting in version 2.0.0. This feature allows users to manage and utilize a set of shared pre-written messages in the SMS messages sent via RingCentral Embeddable. When enabled, users can:

* Select and apply an templated message in an SMS they are writing
* Create new SMS templates
* Access templates create by coworkers or administrators

## Enable SMS template

First, you need to add `EditExtensions` permission into your RingCentral app in RingCentral developer portal.

Then, you need to enable the SMS template feature in the widget. To enable it, you need to set `enableSMSTemplate` flag into the widget's URI. 

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?enableSMSTemplate=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableSMSTemplate=1">
    </iframe>
    ```

## Use SMS template

After enabled, user should be able to see the SMS template tab SMS text input toolbar.

![SMS template](https://github.com/ringcentral/ringcentral-embeddable/assets/7036536/c5dda595-1d9d-41c5-ba74-50f590d63e1a)

## Import SMS template

The widget provides a API to import SMS template into the widget. You can use the following code to import SMS template into the widget.

=== "Adapter JS"

    ```js
    RCAdapter.createSMSTemplate('Template name', 'Template text');
    ```

=== "Javascript"

    ```js
    document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
      type: 'rc-adapter-message-request',
      requestId: Date.now().toString(),
      path: '/create-sms-template',
      body: {
        displayName: 'Template name',
        text: 'Template text'
      },
    }, '*');
    ```
