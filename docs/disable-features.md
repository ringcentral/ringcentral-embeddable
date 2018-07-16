# Disable Features

We provide Call, CallHistory, Messages and ConferenceInvite features in the widget. Sometimes you only need some features. So we allow developers to disable features that unneeded.

## Disable messages features

Just pass `disableMessages` on adapter.js uri or iframe src uri.

### Use adapter way:

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-web-widget/adapter.js?disableMessages=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Use iframe way:

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" src="https://ringcentral.github.io/ringcentral-web-widget/app.html?disableMessages=1">
</iframe>
```

## Disable Call releated features

To pass `disableCall` on adapter.js uri or iframe src uri as upper example.

## Disable Conference invite feature

To pass `disableConferenceInvite` on adapter.js uri or iframe src uri as upper example.
