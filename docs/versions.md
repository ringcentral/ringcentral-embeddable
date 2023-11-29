# Loading a specific version of RingCentral Embeddable

## Using the latest build

We prefer developers to load the latest version of RingCentral Embeddable. This is the default behavior when you load Embeddable via a CDN and do not reference a specific version number, or if you use the [RingCentral Embeddable embed tool](https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/) to generate your embed code. Using the latest build ensures that your application will automatically receive updates along with any new bug fixes. 

## Loading older versions

Developers wishing to load a specific and fixed version of RingCentral Embeddable can do so by plugging their desired version into the following URL format:

    https://apps.ringcentral.com/integration/ringcentral-embeddable/<version number>

For example:

* `https://apps.ringcentral.com/integration/ringcentral-embeddable/1.4.1`
* `https://apps.ringcentral.com/integration/ringcentral-embeddable/1.9.3`

Loading a specific version may be considered more stable by some developers as their application will be insulated from new features, or unintended changes that may not be backwards-compatible. 

!!! danger "Update your Redirect URI to match"
    Starting with version `1.2.0`, please note that the [redirect uri](config/redirect-uri.md) of Embeddable must be changed to match the version you are loading. For example:
	
	`https://apps.ringcentral.com/integration/ringcentral-embeddable/1.4.1/redirect.html`

### Example: loading specific version via Javascript

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/1.4.1/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

