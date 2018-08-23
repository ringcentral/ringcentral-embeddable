# Get Started

there are two ways to integrate this widget to a web application:

## Adapter JS way

Just add following the following codes to a website's header. It will create a iframe in your website.

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Iframe way

Create a iframe with the following codes:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html">
</iframe>
```

You can also customize the Widget to use your RingCentral app client id and client secrect in [here](config-client-id-and-secret.md).
