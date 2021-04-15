# Popup the widget in a standalone window

Support to open the widget in a popup window, so the widget is opened at a standalone window. User can close web page that embed the widget, and call will not be ended, and still active at popup window.

**Notice**: this feature is in beta, we need more tests and feedback about it. It only works after v1.6.3.

### To enable this feature:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?enablePopup=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

After enabled, user will get a popup button at header:

![Popup window button](https://user-images.githubusercontent.com/7036536/114856037-32e26180-9e19-11eb-9e41-46d40ff50c2d.png)

The feature is based on [Webphone Multiple Tabs solution 1](multiple-tabs.md#option-1-have-only-connection-in-first-opened-tab), so `multipleTabsSupport` will be automatically enabled after you enable `enablePopup`. Before user open popup window, web phone connection is built at first opened tab. After user open popup window, web phone connection is built at popup window.

### Known issues:

* App can't make a opened popup window into desktop top (Browser limitation)
* App will send [Web phone call session notification](widget-event.md#web-phone-call-event) at every tabs
* User need to focus at popup window when start or answer a call at popup window for microphone permission at Firefox
