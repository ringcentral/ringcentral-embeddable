# Hosting RingCentral Embeddable from your own servers

While not recommended, some developers may wish to download the RingCentral Embeddable javascript library and host it from their own servers. If you elect to do this, make sure you also:

* create a custom `redirect.html` page 
* host your `redirect.html` file from the same domain as your Embeddable javascript file
* [update your redirect Uri](config/redirect-uri.md) to point to your custom `redirect.html` file
