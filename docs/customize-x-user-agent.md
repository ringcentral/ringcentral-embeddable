# Customize X-User-Agent

We provide default `X-User-Agent` header as `RingCentralEmbeddable/0.2.0 RCJSSDK/3.1.3` in RingCentral API request for SDK usage analysis in backend. In this API, developers can also provide their desired User Agent into widget.

## Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?userAgent=TestAPP/1.0.0";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?userAgent=TestAPP/1.0.0">
</iframe>
```

After that widget will change `X-User-Agent` header into `TestAPP/1.0.0 RingCentralEmbeddable/0.2.0 RCJSSDK/3.1.3` when send request to RingCentral Server.
