# Disable and Enable Features

We provide Call, CallHistory, Messages and ConferenceInvite features in the widget. Sometimes you only need some features. So we allow developers to disable features that unneeded.

## Disable messages features

Just pass `disableMessages` on adapter.js uri or iframe src uri.

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

To pass `disableCall` on adapter.js uri or iframe src uri as upper example.

## Disable Conference invite feature

To pass `disableConferenceInvite` on adapter.js uri or iframe src uri as upper example.

## Disable Meeting feature

To pass `disableMeeting` on adapter.js uri or iframe src uri as upper example.

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

## Enable Conference Call feature

Conference Call (3-way-calling) feature is in beta. It is disabled it by default. To enable it:

```js
<script>
(function() {
var rcs = document.createElement("script");
rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?disableConferenceCall=false";
var rcs0 = document.getElementsByTagName("script")[0];
rcs0.parentNode.insertBefore(rcs, rcs0);
})();
</script>
```

Before we start to use Conference Call feature, need to add `TelephonySessions` permission to your app in RingCentral Developer website. This feature is in beta. Please send email to [devsupport](mailto:devsupport@ringcentral.com) to add `TelephonySessions` permission if you get any problem.

## Enable Active Call Control feature

Active Call Control feature uses new `CallControl` RESTful API to control RingCentral Call. With this API, users can control their calls on other devices in this widget. 

Before we start to use Active Call Control feature, need to add `CallControl` permission to your app in RingCentral Developer website. After permissions added, you can get the feature after relogin to the widget.

Please send email to [devsupport](mailto:devsupport@ringcentral.com) to add `CallControl` permission if you get any problem.
