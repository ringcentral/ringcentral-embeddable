# Customize Redirect Uri

In authorization code flow, it will require a valid redirect uri that developer set in developers account. This app offers a default redirect uri option that you can use, https://ringcentral.github.io/ringcentral-embeddable/redirect.html. And it also supports to config redirect uri.

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

Or

```html
<iframe width="300" height="500" id="rc-widget" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?redirectUri=your_redirect_uri">
</iframe>
```

In your redirect page, you need to add following code to pass auth callback params to this app.

```html
<script>
  // Important: the origin is used for postMessage
  var origin = 'https://ringcentral.github.io'; // origin where the widget is deployed.
  if (window.opener) {
    // pass callbackUri to widget
    window.opener.postMessage({
      callbackUri: window.location.href,
    }, origin);
  }
</script>
```
