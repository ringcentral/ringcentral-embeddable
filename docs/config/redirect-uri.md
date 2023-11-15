# Customize Redirect Uri

In authorization code flow, it will require a valid redirect uri that developer set in developers account. This app offers a default redirect uri option that you can use, https://ringcentral.github.io/ringcentral-embeddable/redirect.html. And it also supports to config redirect uri.

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?redirectUri=your_redirect_uri";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?redirectUri=your_redirect_uri">
    </iframe>
    ```

## Hosting a custom `redirect.html` file 

In your redirect page, you need to add following code to pass auth callback params to this app.

```html
<script>
  // Important: the origin is used for postMessage
  // Set "origin" to the same domain as the Embeddable library
  var origin = 'https://ringcentral.github.io'; 
  if (window.opener) {
    // pass callbackUri to widget
    window.opener.postMessage({
      callbackUri: window.location.href,
    }, origin);
    window.close(); // close the login popup window
  }
</script>
```

!!! warning "Be sure to host your redirect.html and Embeddable library from the same domain"
    To comply with browser security policies meant to prevent XSS vulnerabilities, both your `redirect.html` file and the RingCentral Embeddable javascript file must be hosted from the same domain. If not, users will be unable to authenticate.
