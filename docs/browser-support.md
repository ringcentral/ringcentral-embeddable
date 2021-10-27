# Browser support

RingCentral Embeddable is full tested on Chrome, Edge(Chromium) and Firefox desktop browser. It doesn't support `IE`. It may has some issues in other browsers.

In [Browser](interact-with-calling-settings.md) calling mode, our web phone feature (WebRTC call) is only supported in Chrome/Chromium based browser, Firefox and other browsers which support WebRTC protocol. So in no-WebRTC browsers, the widget will show web phone unavailable warning. If you want to use our widget in other browsers, please change default calling mode to [others](interact-with-calling-settings.md), such as `Call with RingCentral Desktop app` or `Ringout`.

Our widget also needs to require `userMedia` from browser to get microphone and speaker for making web phone call. 

There are 3 conditions that will cause `userMedia` request fail:

* No microphone and speaker devices in your computer
* User doesn't allow `userMedia` request
* HTTP website

In Chrome or Firefox, browser will block `userMedia` request by default in HTTP website. So in HTTP website, the widget's web phone feature is unavailable. To enable it (**not recommended**):

* Chrome: goto `chrome://flags/#unsafely-treat-insecure-origin-as-secure` page, enable `Insecure origins treated as secure`
* Firefox: goto `about:config` page, enable `media.getusermedia.insecure`
