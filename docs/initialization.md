# Installing Embeddable on a web page

RingCentral Embeddable supports two ways for integrating itself onto a webpage. They include:

* via Javascript
* via an iframe

### Embedding via Javascript

Add following the following code to the `<head>` section of a website. This method is recommended for most applications as it optimised page load performance. 

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

You may also load RingCentral Embeddable directly as follows:

```html
<script src="https://ringcentral.github.io/ringcentral-embeddable/adapter.js">
</script>
```

!!! info "Learn more about the `defer` and `async` attributes when [loading scripts directly](https://stackoverflow.com/questions/61393943/javascript-as-part-of-the-page-vs-script-src)"

#### Initializing Embeddable manually

Starting in `v1.8.5`, one can initialize Embeddable manually using the code below. This is beneficial if your application needs to load a lot of Javascript and you need to optimize page load and rendering speeds. Note: this is only available when initializing via Javacript. 

```html hl_lines="1-3"
<script>
  window.RC_EMBEDDABLE_ADAPTER_MANUAL_INIT = true; // enable manual init
</script>
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

Once the script has been loaded, you can trigger the initialization process as follows:

```js
window.RCAdapterInit();
```

And you can dispose of Embeddable as well:

```js
window.RCAdapterDispose();
```

### Embedding via an iframe

Some developers may prefer to load Embeddable directly via an iframe for [security or performance reasons](https://blog.bitsrc.io/using-iframes-vs-scripts-for-embedding-components-e30eb569cb46). To load Embeddable via an iframe, use the following code.

```html
<iframe width="300" height="500" id="rc-widget" allow="autoplay; microphone" 
        src="https://ringcentral.github.io/ringcentral-embeddable/app.html">
</iframe>
```

