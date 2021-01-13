# Multiple Brands

RingCentral works with a number of [carriers and partners](https://developers.ringcentral.com/guide/basics/partner-compatibility) to deliver a cutting edge white labeled Cloud Communications service directly to their respective customers. This guide will show you how to create RingCentral Embeddable app for other brands.

## AT&T Office@Hand

### Adapter JS way

* Use `adapter.att.js` to instead of `adapter.js`
* Set `appServer` to `https://platform.ringcentral.biz`

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.att.js?appServer=https://platform.ringcentral.biz";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=att` and `appServer` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?brand=att&appServer=https://platform.ringcentral.biz">
</iframe>
```

## BT Cloud Work

Use `adapter.bt.js` to instead of `adapter.js`:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.bt.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=bt` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?brand=bt">
</iframe>
```

## TELUS

Use `adapter.telus.js` to instead of `adapter.js`:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.telus.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=telus` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?brand=telus">
</iframe>
```

## Other Brands

For other brands, we are still customizing styles for them. Those users can use with default brand.

### Adapter JS way

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

### Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html">
</iframe>
```
