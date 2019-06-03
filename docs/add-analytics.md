# Enable Analytics

In widget, we support to add analytics with Mixpanel service. It is disabled by default. To enable it, please add mixpanel key by passing `analyticsKey`:

## Use adapter JS way:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?analyticsKey=your_mixpanel_key";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Use iframe way:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?analyticsKey=your_mixpanel_key">
</iframe>
```
