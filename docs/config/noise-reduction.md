# Noise reduction

> Added in version `1.10.0`. Currently in beta.

Noise reduction is a self-descriptive feature that when enabled, filters out background noise present in the user's environment to create a clearer, easier-to-hear audio stream for people on the other end of a call. Noise reduction is currently only supported within the Google Chrome and Microsoft Edge browsers.

## How to enable noise reduction

!!! info "Noise reduction is only supported when loading Embeddable from `apps.ringcentral.com`"
    Noise reduction is not supported if you are loading the Embeddable library from a Github domain. The embeddable library must be loaded from `https://apps.ringcentral.com` domain. Please check your source code and migrate to a more [new recent build hosted at ringcentral.com](../integration/new-latest-uri.md)."

While in beta, the noise reduction feature is hidden by default. To make it available, developers need to add `enableNoiseReductionSetting=1` to the widget's `src` or `href` query parameters.

=== Javascript

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?enableNoiseReductionSetting=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== iframe

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" 
      src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableNoiseReductionSetting=1">
    </iframe>
    ```
