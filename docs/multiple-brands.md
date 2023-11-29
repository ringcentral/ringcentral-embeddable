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
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.att.js?appServer=https://platform.ringcentral.biz";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=att` and `appServer` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?brand=att&appServer=https://platform.ringcentral.biz">
</iframe>
```

## BT Cloud Work

Use `adapter.bt.js` to instead of `adapter.js`:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.bt.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=bt` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?brand=bt">
</iframe>
```

## TELUS

Use `adapter.telus.js` to instead of `adapter.js`:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.telus.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=telus` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?brand=telus">
</iframe>
```

## Atos Unify Office

> From v1.8.0

Use `adapter.atos.js` to instead of `adapter.js`:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.atos.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=atos` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?brand=atos">
</iframe>
```

## Avaya Cloud Office

> From v1.8.0

Use `adapter.avaya.js` to instead of `adapter.js`:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.avaya.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=avaya` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?brand=avaya">
</iframe>
```

## Rainbow Office

> From v1.8.0

Use `adapter.rainbow.js` to instead of `adapter.js`:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.rainbow.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

Add `brand=rainbow` in src query parameter:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?brand=rainbow">
</iframe>
```

## Other Brands

For other brands, we are still customizing styles for them. Those users can use with default brand.

### Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html">
</iframe>
```
