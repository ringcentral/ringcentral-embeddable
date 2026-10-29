# Voicemail Drop (Beta)

<!-- md:version 3.0.0 -->

Voicemail Drop allows users to automatically leave a pre-recorded message when an outbound call reaches voicemail.

This means users don’t have to wait for the voicemail recording to finish — they can immediately start the next call instead.

## Enable Voicemail Drop

To enable Voicemail Drop, you need to set `enableVoicemailDrop` and `enableSideWidget` flag into the widget's URI.

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/3.x/adapter.js?enableSideWidget=1&enableVoicemailDrop=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" 
      src="https://apps.ringcentral.com/integration/ringcentral-embeddable/3.x/app.html?enableSideWidget=1&enableVoicemailDrop=1">
    </iframe>
    ```

After enabled, user can get voicemail drop settings in "Settings > Advanced -> Voicemail drop" page.

![voicemail drop settings](../assets/voicemail-drop-setting.png)

After pre-recorded messages added, user will get voicemail drop button in call actions. User can select one of the pre-recorded messages to leave.

![voicemail drop](../assets/voicemail-drop.png)

## Pre-recorded messages from your service

<!-- md:version 3.0.0 -->

Besides the messages users upload in the widget, your service can provide shared pre-recorded messages. Pass `voicemailDropFilesPath` when you [register your service](../integration/index.md):

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    voicemailDropFilesPath: '/voicemailDropFiles',
  }
}, '*');
```

The widget sends a request to this path to get the message list. Respond with an array of messages in `data`:

```js
// Function to response message to widget
function responseMessage(request, response) {
  document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
    type: 'rc-post-message-response',
    responseId: request.requestId,
    response,
  }, '*');
}

window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    const request = data;
    if (request.path === '/voicemailDropFiles') {
      responseMessage(request, {
        data: [
          {
            id: 'my-service-intro', // required, unique and stable
            label: 'Intro message', // required, shown in the message list
            uri: 'https://example.com/voicemail/intro.mp3', // required, audio file URI
          },
        ],
      });
    }
  }
});
```

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Unique and stable message ID. The widget finds the selected message by this ID when it drops the message. Use a prefix, such as your service name, so it doesn't collide with messages users upload. |
| `label` | Yes | Name shown in the message list. |
| `uri` | Yes | Audio file URI: an `https://` URL, or a `data:audio/mpeg;` or `data:audio/wav;` data URI. The widget downloads the file in the browser, so a URL on another domain must allow cross-origin (CORS) requests from the widget. |

Messages without a valid `uri` or a `label` are ignored. If `data` is not an array, the widget logs an error and shows no messages from your service.

The widget requests the list when the user opens the voicemail drop settings page or the voicemail drop message list on a call. The messages are listed after the user's own messages, marked as "Provided by an external service". Users can play them but can't edit or delete them in the widget.

## Voicemail drop on RingCX calls (Experimental)

<!-- md:version 3.1.0 -->

Voicemail drop on [RingCX](../integration/ringcx.md) calls needs `enableRingCX=1` as well, and the agent's voice connection must be the integrated softphone. The message plays on the agent's own line, so the agent stays on the call while it plays:

- The agent's microphone is muted during the drop, but the agent still hears the call, including the greeting and beep.
- The call page shows the progress: an elapsed timer while waiting for the greeting to end, then a bar with the played and total time of the message.
- Mute, keypad, hold, transfer and recording are disabled during the drop. **End call** stays available.
- If a person answers, **Take over** stops the message and gives the call back to the agent, with the microphone as it was before the drop.
- When the drop starts, the disposition opens in the side panel if the call needs one, so the agent can fill it in while the message plays.
- For campaigns that hang up on disposition, **Submit and hang up** is disabled until the message ends.
- When the message ends, the call hangs up. The agent submits the disposition and can then take the next call.

### Different between RingEX and RingCX calls

| | RingEX call | RingCX call |
| --- | --- | --- |
| Calls | Outbound | Outbound |
| After **Drop** | The widget goes to the dialer. The call keeps playing the message in the background. | The agent stays on the call page, which shows the drop's progress. |
| Next call | Can be started right away. | Can be started once the message ends and the call is dispositioned. RingCX keeps the agent engaged on the call until then. |
| Talk to the caller during the drop | No | Yes, with **Take over** |
| When the message ends | The call hangs up. | The call hangs up, and the agent finishes the disposition. |

## Online demo

[Voicemail drop online demo](https://apps.ringcentral.com/integration/ringcentral-embeddable/3.x/index.html){ .md-button .md-button--primary }
