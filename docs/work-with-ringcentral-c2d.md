# Work with RingCentral C2D

This is document that show how to implement `Click To Dial` feature with RingCentral C2D library. RingCentral C2D is a library that help developers to implement `Click To Dial` and `Click To SMS` feature, it will scan phone numbers in web page. When users hover on phone number, it will show C2D widget for `Click to Call`.

![C2D Screenshot](https://user-images.githubusercontent.com/7036536/51652788-d2627200-1fcb-11e9-8ba3-9e50baeaf8a6.png)

To implement with RingCentral Embeddable:

```html
<script src="https://unpkg.com/ringcentral-c2d@1.0.0/build/index.js"></script>
<script>
// Inject Embeddable
(function() {
  var rcs = document.createElement("script");
  rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js";
  var rcs0 = document.getElementsByTagName("script")[0];
  rcs0.parentNode.insertBefore(rcs, rcs0);
})();
// Interact with RingCentral C2D
var clickToDial = new RingCentralC2D();
clickToDial.on(RingCentralC2D.events.call, (phoneNumber) => {
  RCAdapter.clickToCall(phoneNumber, true);
});
clickToDial.on(RingCentralC2D.events.text, (phoneNumber) => {
  RCAdapter.clickToSMS(phoneNumber);
});
</script>
```
