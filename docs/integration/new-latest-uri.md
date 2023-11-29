# Migrating from Github Page latest URI

In previously, we deployed the latest build at Github Page: `https://ringcentral.github.io/ringcentral-embeddable/`. And now the latest build is deployed at `https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/` to have more stable network access.

To migrate to the new latest URI, you can just replace the old URI with the new one. 

=== "Javascript"

    Update adapter js src:

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    Update iframe src:

    ```html
    <iframe width="300" height="500" allow="microphone" 
      src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html">
    </iframe>
    ```

Then **add** new redirect URI in your [RingCentral app settings](https://developers.ringcentral.com/) to

```
https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/redirect.html
```

After migrating, user will need to **re-authorize** RingCentral to your app to use the widget as domain changed.
