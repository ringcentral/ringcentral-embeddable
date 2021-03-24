# Get Started

there are two ways to integrate this widget to a web application:

## Adapter JS way

Just add following the following code to a website's header. It will create a iframe in your website.

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

## Iframe way

Create a iframe with the following code:

```html
<iframe width="300" height="500" id="rc-widget" allow="autoplay; microphone" src="https://ringcentral.github.io/ringcentral-embeddable/app.html">
</iframe>
```

#### Stable version

We provide latest RingCentral Embeddable version on github page `https://ringcentral.github.io/ringcentral-embeddable`. It includes latest features and bugfix in RingCentral Embeddable. And it will keep up to date with master code. But we **recommend** developers to use versioned RingCentral Embeddable. You can get current latest stable version of RingCentral Embeddable from [here](https://github.com/ringcentral/ringcentral-embeddable/releases). Such as `1.4.1`, you can get versioned app in this uri `https://apps.ringcentral.com/integration/ringcentral-embeddable/1.4.1`.

Just replace `https://ringcentral.github.io/ringcentral-embeddable` in [upper code](#adapter-js-way) to the versioned uri, and you will be using versioned RingCentral Embeddable. The versioned app will not be influenced when new features are added, so it will be more stable than latest version. When you need to update RingCentral Embeddable, you need to update the versioned app uri in your code manually.

For stable version from `1.0.2`, it is required to setup your own RingCentral client id. Please follow [here](docs/config-client-id-and-secret.md) to setup, or it will throw error with client id required.
For stable version from `1.2.0`, authorization redirect uri will change with version as `https://apps.ringcentral.com/integration/ringcentral-embeddable/1.4.1/redirect.html`, but you can make a fixed redirect URI with this [docs](docs/customize-redirect-uri.md).

To get all versions of RingCentral Embeddable in [here](https://github.com/ringcentral/ringcentral-embeddable/releases).

Example scripts with versioned app:

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

## Important

**Before going to production, you should setup the widget to use your own RingCentral app client id and client secrect by following [here](config-client-id-and-secret.md). And use stable version Embeddable**
