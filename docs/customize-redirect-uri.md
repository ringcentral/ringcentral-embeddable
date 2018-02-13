# Customize Redirect Uri

In implicit grant flow or authorization code flow, it will require a valid redirect uri that developer set in developers account. This app offers a default redirect uri option that you can use, https://ringcentral.github.io/ringcentral-web-widget/redirect.html. But it also allow to config redirect uri.

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-web-widget/adapter.js?redirectUri=your_redirect_uri";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

Or

```html
<iframe width="300" height="500" id="rc-widget" src="https://ringcentral.github.io/ringcentral-web-widget/app.html?redirectUri=your_redirect_uri">
</iframe>
```

But in your redirect page, you need to add following code to pass callback params to this app.

```js
<script>
  if (window.opener) {
    window.opener.postMessage({
      callbackUri: window.location.href,
    }, '*');
  }
</script>
```
