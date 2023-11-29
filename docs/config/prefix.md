# Customize Prefix

We provide default prefix `rc-widget` in the widget. It will used at iframe id prefix and storage key prefix, such as `rc-widget-adapter-frame` and `rc-widget-GlobalStorage-rateLimiterTimestamp`.

Some developers wants to customize the prefix, so the widget can support to have different user storage data. We provide prefix param to support this feature:

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?prefix=your_prefix";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?prefix=your_prefix">
    </iframe>
    ```

After that the widget iframe id will changed to `your_prefix-adapter-frame`. And user data will be storaged at `you_prefix` namespace.

For implicit grant flow, we use cookie to refresh the token, so it don't support different accounts in same browser in different tabs. If you want to support different accounts in different tabs or domains in same browser, you need to use [authrization code flow](client-id.md).
