## Adapter Init

By default, the adapter script will auto init and start the widget. 
To init the widget manually:

```html
<script>
  window.RC_EMBEDDABLE_ADAPTER_MANUAL_INIT = true; // enable manual init
</script>
<script>
  // import adapter js
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
<!-- Or import by script src directly -->
<!-- <script src="https://ringcentral.github.io/ringcentral-embeddable/adapter.js"></script> -->
```

### Manual Init:

```js
window.RCAdapterInit();
```

### Dispose the widget:

```js
window.RCAdapterDispose();
```
