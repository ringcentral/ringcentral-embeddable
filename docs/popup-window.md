# Popup the widget in a standalone window

Support to open the widget in a popup window, so the widget is opened at a standalone window. User can close web page that embed the widget, and call will not be ended, and still active at popup window.

**Notice**: this feature is in beta, we need more tests and feedback about it. It only works after v1.6.3.

### To enable this feature:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?enablePopup=1&multipleTabsSupport=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

After enabled, user will get a popup button at header:

![Popup window button](https://user-images.githubusercontent.com/7036536/114856037-32e26180-9e19-11eb-9e41-46d40ff50c2d.png)

The feature is based on [Webphone Multiple Tabs solution 1](multiple-tabs.md#option-1-have-only-connection-in-first-opened-tab), so `multipleTabsSupport` need to be  enabled. If you have enable `disconnectInactiveWebphone`, please remove it. Before user open popup window, web phone connection is built at first opened tab. After user open popup window, web phone connection is built at popup window.

#### To check if popup window opened

From v1.8.0:

```js
RCAdapter.isWindowPoppedUp().then((opened) => {...})
```

### Known issues:

* App can't make a opened popup window into desktop top (Browser limitation)
* App will send [Web phone call session notification](widget-event.md#web-phone-call-event) at every tabs
* User need to focus at popup window when start or answer a call at popup window for microphone permission at Firefox

## Host the popup window

For some reason, developers need to host [the popup HTML file](https://github.com/ringcentral/ringcentral-embeddable/blob/master/src/popup.html) by themselves. For example, if developer want to add [Third Party service](https://github.com/ringcentral/ringcentral-embeddable/blob/master/docs/third-party-service-in-widget.md#third-party-service-in-widget) register and response into the widget, it is required to host [the popup HTML file](https://github.com/ringcentral/ringcentral-embeddable/blob/master/src/popup.html) in your domain, and add your script inside the HTML file. It can be also used for resolve cross-origin domain issue.

In this case, we can config the popup button to open your own popup HTML file URI:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?enablePopup=1&popupPageUri=your_popup_html_file_uri";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

The HTML file need to be based on code of this [file](https://github.com/ringcentral/ringcentral-embeddable/blob/master/src/popup.html). Then update the `adapter.js` src into absolute address in the file:

```html
<script src="https://ringcentral.github.io/ringcentral-embeddable/adapter.js"></script>
```

Then add your own script in the file.
