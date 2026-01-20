# Track SMS typing time

<!-- md:version 3.0.0 -->

!!! info "This feature is still on progress"

This feature allows you to track how long a user spends composing an SMS message before sending it. The typing duration is measured in milliseconds and can be useful for analytics, productivity tracking, or CRM logging purposes.

## Enable SMS typing time tracking

### Enable via URI parameter

Add `enableTypingTimeTracking=1` to the widget URI:

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?enableTypingTimeTracking=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableTypingTimeTracking=1">
    </iframe>
    ```

### Enable dynamically via postMessage

You can enable or disable the feature at runtime:

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-update-sms-typing-time-tracking',
  enabled: true, // or false to disable
}, '*');
```

## Receive typing duration in message logs

!!! info "This feature requires you to [register message logger](message-logging.md) first."

When SMS typing time tracking is enabled and you have a message logger registered, the typing duration will be included in the message data when logging messages.

The `typingDurationMs` field will be added to each outbound message in the conversation:

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    if (data.path === '/messageLogger') {
      // Messages in the conversation will include typingDurationMs
      var conversation = data.body.conversation;
      conversation.messages.forEach(function(message) {
        if (message.typingDurationMs) {
          console.log('Message ID:', message.id);
          console.log('Typing duration (ms):', message.typingDurationMs);
          // Convert to seconds for display
          console.log('Typing duration (s):', message.typingDurationMs / 1000);
        }
      });
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

## How typing time is calculated

The tracker measures the time from when the user starts typing to when the message is sent:

- **Start**: Timer begins when the user starts typing in the message compose field
- **Pause**: If the user navigates away from the conversation, the timer is paused and accumulated time is preserved
- **Resume**: When the user returns to the conversation and continues typing, the timer resumes
- **Stop**: When the message is successfully sent, the total typing duration is saved
- **Clear**: If the compose field is cleared without sending, the timer is reset

This approach ensures accurate tracking even when users switch between conversations or temporarily leave the messaging interface.
