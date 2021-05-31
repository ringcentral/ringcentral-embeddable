# Disable and Enable Features

We provide Call, CallHistory, Messages and ConferenceInvite features in the widget. Sometimes you only need some features. So we allow developers to disable features that unneeded.

## Disable messages features

Just pass `disableMessages` on adapter.js uri or iframe src uri.

## Disable SMS/Text read features

Just pass `disableReadText` on adapter.js uri or iframe src uri.

### Use adapter way:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?disableMessages=true";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Use iframe way:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html?disableMessages=true">
</iframe>
```

## Disable Call releated features

To pass `disableCall=true` on adapter.js uri or iframe src uri as upper example.

## Disable Meeting feature

To pass `disableMeeting=true` on adapter.js uri or iframe src uri as upper example.

## Enable Glip feature

Glip feature is in beta. It is disabled it by default. To enable it:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?disableGlip=false";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

Before we start to use Glip API, need to add `Glip` permission to your app in RingCentral Developer website.

## Enable Conference invite feature

Conference Invite feature will be deprecated in end of 2020. Now it is disabled by default.

To enable it by passing `disableConferenceInvite=false` on adapter.js uri or iframe src uri as upper example.

## Enable Conference Call feature

To enable Conference Call (3-way-calling) feature, please add `CallControl` permission to your app in RingCentral Developer website. Please send email to [devsupport](mailto:devsupport@ringcentral.com) to add it if your app has been graduated into production. After permissions added, you can get the feature after re-login to the widget.

![conference call](https://user-images.githubusercontent.com/7036536/110581133-eb770e80-81a4-11eb-9951-fde986a07780.png)

## Enable Active Call Control feature

Active Call Control feature uses new `CallControl` RESTful API to control RingCentral Call. With this API, users can control their calls on other devices in this widget. 

Before we start to use Active Call Control feature, need to add `CallControl` permission to your app in RingCentral Developer website. After permissions added, you can get the feature after re-login to the widget.

Please send email to [devsupport](mailto:devsupport@ringcentral.com) to add `CallControl` permission if you get any problem.

## Enable Ringtone Settings feature

For when call is ringing, app will play default ringtone. But we also support to customize ringtone.

Ringtone settings is disabled by default. To enable it:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?enableRingtoneSettings=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

By enabled, user can get ringtone settings at settings page.
**Notice**: supported after v1.6.3
