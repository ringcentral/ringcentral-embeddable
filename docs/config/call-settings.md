# Interact with Calling Settings

In RingCentral Embeddable widget, we provide 4 calling options in `Calling Setting` page.

- Browser - make and receive calls using your computer’s microphone and speaker based on browser
- RingCentral App - make and receive calls using your `RingCentral` desktop app
- RingCentral Phone - make and receive calls using your `RingCentral Phone` desktop app
- RingOut

For `RingOut`, You can get full document here [Ringout](https://support.ringcentral.com/s/article/85?language=en_US) mode. Users also need to set `My Location` phone number. So when user creates a call, RingCentral will first call user's location phone number, then call correspondent's phone number. If user enables `Prompt me to dial 1 before connecting the call`, RingCentral will only call correspondent's phone number after user dials 1.  Please refer to [here](https://support.ringcentral.com/s/article/85?language=en_US) for more detailed information.

For `RingCentral App`, `RingCentral Phone`, `RingOut`, calls are on other devices, the widget can get call event and information from APIs. And it is recommended to enable [active call control](../support.md#enabling-active-call-control-features), so user can also control the call in widget.

## Default option

To set default `callWith` option:

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?defaultCallWith=browser";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?defaultCallWith=browser">
    </iframe>
    ```

There are 4 options for `defaultCallWith`: 

- browser
- jupiter
- softphone
- ringout

They are short names of `Browser`, `RingCentral App`, `RingCentral Phone`, `RingOut`.

## Calling settings updated event

Event fired when user changed `call with` option in calling settings page:

```js
window.addEventListener('message', (e) => {
  const data = e.data;
  if (data) {
    switch (data.type) {
      case 'rc-calling-settings-notify':
        // get calling setting in here
        console.log(data);
        // {
        //   type: 'rc-calling-settings-notify',
        //   callWith: 'ringout',
        //   fromNumbers: [], // show after enableFromNumberSetting flag set
        //   myLocation: '+11111111', // show after showMyLocationNumbers flag set
        //   myLocationNumbers: [], // show after showMyLocationNumbers flag set
        // }
        break;
      default:
        break;
    }
  }
});
```

## Enable call from number setting

In widget, user can also select `From` number when make a browser call. For developers who also want to set `From` number programmatically, we need to enable from number settings:

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?enableFromNumberSetting=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?enableFromNumberSetting=1">
    </iframe>
    ```

After enabled, we can receive `From` number list in [calling settings updated](#calling-settings-updated-event) event when `callWith` is `browser`.

## Show my location numbers

<!-- md:version 1.8.1 -->

In `RingOut` mode, user need to set `My Location` number to receive first-leg call. For developers who also want to get user's known location numbers programmatically, we need to set `showMyLocationNumbers` flag firstly:

=== "Javascript"

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js?showMyLocationNumbers=1";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    ```html
    <iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html?showMyLocationNumbers=1">
    </iframe>
    ```

After enabled, we can receive `myLocation` and `myLocationNumbers` in [calling settings updated](#calling-settings-updated-event) event.

## Update Calling settings

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-calling-settings-update',
  callWith: 'softphone',
  // myLocation: '+1111111111', // required for ringout
  // ringoutPrompt: true, // required for ringout
  // fromNumber: '+1111111111', // set from number when callWith is browser
}, '*');
```

For `fromNumber`, the number should be from `fromNumbers` list in calling settings event, or `anonymous` for `Blocked` from number.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-calling-settings-update',
  fromNumber: 'anonymous',
}, '*');
```
