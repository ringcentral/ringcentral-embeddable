# Noise reduction

> Added in version `1.10.0`. Currently in beta.

Noise reduction is a self-descriptive feature that when enabled, filters out background noise present in the user's environment to create a clearer, easier-to-hear audio stream for people on the other end of a call. Noise reduction is currently only supported within the Google Chrome and Microsoft Edge browsers.

## How to enable noise reduction

!!! info "Noise reduction is only supported when loading Embeddable from `apps.ringcentral.com`"
    Noise reduction is not supported if you are loading the Embeddable library from a Github domain. The embeddable library must be loaded from `https://apps.ringcentral.com` domain. Please check your source code and migrate to a more [new recent build hosted at ringcentral.com](../integration/new-latest-uri.md)."

At version `1.10.x`, noise reduction is disabled by default. To enable noise reduction, developer need to pass `enableNoiseReductionSetting` at query parameters.

=== "Javascript"

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

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" 
      src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableNoiseReductionSetting=1">
    </iframe>
    ```

From `v2.0.0`, noise reduction feature is enabled by default for supported browsers. User can disable it manually in settings page. If you want to disable and remove the feature, please check [How to remove noise reduction feature](#how-to-remove-noise-reduction-feature).

## How to remove noise reduction feature

Noise reduction settings will be showed in settings page automatically from `v2.0.0`. If you don't want to use noise reduction feature, you can remove it by setting `disableNoiseReduction` at query parameters.

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?disableNoiseReduction=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" 
      src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?disableNoiseReduction=1">
    </iframe>
    ```
