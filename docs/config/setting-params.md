# Setting RingCentral Embeddable configuration parameters

RingCentral Embeddable supports a number of different configuration parameters to modify the behavior of the library is key ways. Each parameter is set in one of two ways. 

### Via script tag's `src` attribute

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://ringcentral.github.io/ringcentral-embeddable/adapter.js?parameterName=VALUE";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

### Via iframe's `href` attribute

```html
<iframe width="300" height="500" id="rc-widget" allow="microphone" 
  src="https://ringcentral.github.io/ringcentral-embeddable/app.html?parameterName=VALUE">
</iframe>
```

