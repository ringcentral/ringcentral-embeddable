# New adapter UI

In adapter JS way, our codes will generate a `RingCentral Badge` in web page by default:

![Old UI](https://user-images.githubusercontent.com/7036536/55137185-47d4f500-516b-11e9-9519-17ded87f338c.jpeg)

In latest version, we implement a new dock UI:

![New dock UI](https://user-images.githubusercontent.com/7036536/55137190-4d323f80-516b-11e9-9b90-aa285a1147dd.jpeg)

To switch UI with `newAdapterUI` params:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?newAdapterUI=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```
