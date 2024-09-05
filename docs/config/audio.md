# Audio

When the calling setting is configured to "Browser", the widget utilizes the browser's default audio and microphone devices for capturing audio and playing ringtones or call voices. Users can also change the audio device via audio settings page.

## Audio output

Due to browser limitations, the widget can only play audio after user interacts with it. Therefore, an audio initialization is required to enable ringtone playback for incoming calls. Users can initialize audio by interacting with any button within the widget.

And developer can enable `Audio Initialization` banner to remind user to initialize audio. The banner will be displayed at the top of the widget.

<!-- md:version 2.0.1 -->

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?enableAudioInitPrompt=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableAudioInitPrompt=1">
    </iframe>
    ```

![audio init](https://github.com/user-attachments/assets/e10b9bbe-3868-477d-995b-c4d73fcb3bbf)

## Audio input

Access to a microphone device is essential for the widget to capture audio. If the widget cannot access the microphone, it will display a `Web Phone Unavailable` badge:

![Web Phone Unavailable](https://github.com/user-attachments/assets/e1142dfc-a7ab-4f3a-8891-a9c4a121962e)

There are some reasons the widget might fail to access the microphone:

### User permission
   
The user must grant permission for the widget to access the microphone. If permission is denied, the widget will be unable to capture audio. When the user clicks on the `Web Phone Unavailable` badge, the browser will prompt a dialog requesting microphone access.

### No microphone device

If the user's device does not have a microphone, the widget will be unable to capture audio. Users can connect an external microphone to resolve this issue.

### HTTP protocol

Microphone access is only permitted over secure connections (HTTPS). If the website is not using HTTPS, the browser will prevent the widget from accessing the microphone.


### Permissions-Policy

For security reasons, some websites may implement a Permissions-Policy header that restricts microphone usage. If such a header is present, the widget will only be able to access the microphone if the policy explicitly permits it. The header should be formatted as follows:

```html
Permissions-Policy: microphone=("https://apps.ringcentral.com" "self")
```


