## SMS Settings

<!-- md:version 2.3.0 -->

When user sends SMS, the widgets allow user to select sender number in Compose Text page. And the widget also provides API to set the sender number.

### SMS settings updated event

To receive the event, developer needs to enable it firstly:

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?enableSmsSettingEvent=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableSmsSettingEvent=1">
    </iframe>
    ```

To receive events:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-sms-settings-notify':
        // get sms setting in here
        console.log(data);
        // {
        //   type: 'rc-sms-settings-notify',
        //   senderNumber: '+11111111111', // sms sender number that user selected
        //   senderNumbers: [], // available number list for SMS sender
        // }
        break;
      default:
        break;
    }
  }
});
```

### Update SMS settings

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-sms-settings-update',
  senderNumber: '+11111111111', // the number must be one of sender numbers in setting notify event
}, '*');
```

!!! info "The sender number setting will only work for new SMS conversation. If user send SMS in a existing conversation, the widget will use previous sender number in the conversation. To go to SMS page by API, please follow [here](../integration/api.md#go-to-sms-page-with-prefilled-text)."
