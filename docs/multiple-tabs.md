# Multiple Tabs

For the Embeddable widget, it supports to run in multiple tabs, and will share the same storage and login status. But widgets in different tabs are still different instances. 

When calling mode is set into [Browser](interact-with-calling-settings.md), widgets will create web phone connection in every widget instance. In our server-side, we have limitation of 5 phone connection. So when user selects `Browser` to make call, we only support to open tabs that no more than 5.

## Option to disconnect inactive web phone

For 5 tab limition, now we support to disconnect webphone connection in inactive tabs. So user can open more than 5 tabs, and not more than 5 active tabs. When user goes to new tabs and new widget's web phone is connected, web phone connection in inactive tabs will be disconnected. When user goes back to inactive tab, widget will reconnect web phone connection.

**Notice**: this feature is in beta, we need more tests and feedback about it.

To enable this feature:

### Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?disconnectInactiveWebphone=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?disconnectInactiveWebphone=1">
</iframe>
```
