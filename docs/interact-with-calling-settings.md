# Interact with Calling Settings

In RingCentral Embeddable widget, we provide 4 calling options in `Calling Setting` page.

- Browser - make and receive calls using your computer’s microphone and speaker based on browser
- RingCentral for Desktop - make and receive calls using your RingCentral for Desktop app
- My RingCentral Phone
- Custom Phone

For `My RingCentral Phone` and `Custom Phone`, they work with our [Ringout](https://support.ringcentral.com/s/article/85?language=en_US) mode. Users also need to set `My Location` phone number. So when user creates a call, RingCentral will first call user's location phone number, then call correspondent's phone number. If user enables `Prompt me to dial 1 before connecting the call`, RingCentral will only call correspondent's phone number after user dials 1.  Please refer to [here](https://support.ringcentral.com/s/article/85?language=en_US) for more detailed information.

For `RingCentral for Desktop`, `My RingCentral Phone` and `Custom Phone`, calls are on other devices, the widget can only get call event and information. And it is recommended to enable `active call control`, so user can also control the call in widget.

## Default option

To set default `callWith` option:

### Adapter JS way

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?defaultCallWith=browser";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

###  Iframe way

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?defaultCallWith=browser">
</iframe>
```

There are 4 options for `defaultCallWith`: 

- browser
- softphone
- myphone
- customphone

They are short names of `Browser`, `RingCentral for Desktop`, `My RingCentral Phone` and `Custom Phone`.

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
        break;
      default:
        break;
    }
  }
});
```

## Update Calling settings

```js
document.querySelector("#rc-widget").contentWindow.postMessage({
  type: 'rc-calling-settings-update',
  callWith: 'softphone',
  // myLocation: '+1111111111', // required for myphone and customphone
  // ringoutPrompt: true, // required for myphone and customphone
}, '*');
```
