# Customize look and feel through CSS

This is a online [demo](https://embbnux.github.io/ringcentral-web-widget-styles/) built with Game of Thrones Styles.

Style file is defined here: 

`https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css`

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?stylesUri=https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?stylesUri=https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css">
    </iframe>
    ```

!!! hint "See a [live demo](https://ringcentral.github.io/ringcentral-embeddable/app.html?stylesUri=https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css)"
