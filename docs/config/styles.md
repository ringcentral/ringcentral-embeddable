# Customize look and feel through CSS

!!! warning "Not supported since 3.1"
    `stylesUri` works in 2.x and 3.x only. Version 3.1 has a new user interface, and custom stylesheets are no longer loaded. Remove `stylesUri` when you move to 3.1.

This is a online [demo](https://embbnux.github.io/ringcentral-web-widget-styles/) built with Game of Thrones Styles.

Style file is defined here: 

`https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css`

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?stylesUri=https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?stylesUri=https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css">
    </iframe>
    ```

!!! hint "See a [live demo](https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?stylesUri=https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css)"
