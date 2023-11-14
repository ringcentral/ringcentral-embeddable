---
hide:
  - navigation
---

# Support and troubleshooting

## Limited support on non-supported browsers

RingCentral Embeddable is full tested on the latest versions of the following browsers:

* Google Chrome
* Microsoft Edge (a Chromium-based browser)
* Mozilla Firefox

In all other browsers, support may be limited, especially browsers that do not support WebRTC. For those browsers you may see a warning indicating that the web phone is "unavailable." For these browsers, you can modify your [Calling settings](config/call-settings.md) and set your calling mode to either:

* Call with RingCentral Desktop app
* RingOut

## Granting access to speakers and microphones

RingCentral Embeddable requests the `userMedia` permission from your browser in order to access a computer's microphone and speaker, necessary for making phone calls. There are three circumstances that will cause this request to fail:

* There is no microphone and speaker devices in your computer
* The end user does not click "Allow" when the request is made
* The widget is not served via HTTPS

In Chrome or Firefox, browsers will block the `userMedia` request for a non-HTTPS website. One can forcibly circumvent this limitation in one of the following ways (this is not recommended for production use):

* Chrome users: goto `chrome://flags/#unsafely-treat-insecure-origin-as-secure` page, enable `Insecure origins treated as secure`
* Firefox users: goto `about:config` page, enable `media.getusermedia.insecure`

## Enabling active call control features

Active Call Control feature uses new `CallControl` RESTful API to control RingCentral Call. With this API, users can control their calls on other devices in this widget. 

Before we start to use Active Call Control feature, need to add `CallControl` permission to your app in RingCentral Developer website. After permissions added, you can get the feature after re-login to the widget.

Please [submit a help ticket](https://developers.ringcentral.com/support/create-case) to add `CallControl` permission if you get any problem.

## Enabling the conference calling feature

To enable Conference Call (3-way-calling) feature, please add `CallControl` permission to your app via the RingCentral Developer console. 
If your app has already been graduated and you need help, please [submit a help ticket](https://developers.ringcentral.com/support/create-case) and we can assist. After the permission is added you can obtain the feature after you re-login to the widget.

![conference call](https://user-images.githubusercontent.com/7036536/110581133-eb770e80-81a4-11eb-9951-fde986a07780.png)

