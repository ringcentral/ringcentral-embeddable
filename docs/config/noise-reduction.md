# Noise reduction

> Supported from version `1.10.0`. It is in Beta now

Noise reduction is a feature that can be enabled to reduce user's background noise sent to the other party. It is supported at the moment for Chrome and Edge browsers.

## How to enable noise reduction

!!! info "It is not supported when the widget is loaded from Github Page build. The widget should be loaded from `https://apps.ringcentral.com` domain. Please follow here to migrate it to [new latest build](../integration/new-latest-uri.md) firstly."

It is hidden by default. To make it available, developers need to add `enableNoiseReductionSetting=1` to the widget's `src` or `href` query parameters.

### Via script tag's `src` attribute

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?enableNoiseReductionSetting=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Via iframe's `href` attribute

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" 
  src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableNoiseReductionSetting=1">
</iframe>
```
