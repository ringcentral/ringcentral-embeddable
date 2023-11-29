# Multiple Tabs

For the Embeddable widget, it supports to run in multiple tabs, and will share the same storage and login status. But widgets in different tabs are still different instances. 

When calling mode is set into [Browser](call-settings.md), widgets will create web phone connection in every widget instance. In our server-side, we have limitation of 5 phone connection. So when user selects `Browser` to make call, we only support to open tabs that no more than 5.

## Option 1: Have only connection in first connected tab

To resolve 5 tab limitation issue for multiple tabs (more than 5), we have this option to make only a web phone connection in multiple tabs.

### Core idea

1. Web phone connection is only connected in first connected tab.
2. When user has a call in second tab or third tab etc, voice transmission is happened in first tab. Second tab only has web phone UI.
3. When user controls call in second tab, control command sent to first tab to execute.
4. When user closes first tab, second tab becomes first opened tab. Web phone will be connected in this tab.
5. Web phone states are shared with local storage between different tabs.
6. Use localStorage as message channel between different tabs.

!!! info "This feature is in beta, we need more tests and feedback about it. It only works after v1.5.0."

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?multipleTabsSupport=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?multipleTabsSupport=1">
    </iframe>
    ```

!!! note "Known issues"
    * For Safari and Firefox, users need to go back to first opened tab to allow microphone permission for every call.
    * For Chrome, user need to go back to first opened tab to allow microphone permission if user hasn't allowed microphone permission.
    * [Web phone call session notification](../integration/events.md#web-phone-call-event) happens at all tabs with the widget.
    * Web phone call muted event does not work at no web phone connection tabs. 
    * For Chrome and Firefox, browser may throttle or unload inactive (5 mins) tabs to make this feature broken.

## Option 2: disconnect inactive web phone

For 5 tab limitation, we support to disconnect web phone connection in inactive tabs. So user can open more than 5 tabs, and not more than 5 active tabs. 

### Core idea:

1. When user goes to new tab and web phone is connected, web phone connection in inactive tabs will be disconnected.
2. When user goes back to inactive tab, the tab became active and widget will reconnect web phone connection.
3. When user has active calls in inactive tabs, web phone connection in inactive tabs will be kept unless all calls ended.
4. User can control calls from inactive tabs by Call Control RESTful API in active tab. And can switch calls into current active tab.

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?disconnectInactiveWebphone=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?disconnectInactiveWebphone=1">
    </iframe>
    ```

!!! note "Known issues"
    * App will show connecting badge a while after user change active tab
    * Performance issue when user change active tab fast
    * At Firefox, app can't disconnect web phone successfully at active page unloaded. So it maybe show too many connection error.
