---
hide:
  - navigation
---

# Embed a phone into any webpage with RingCentral Embeddable

!!! tip "Are you integrating with a CRM?"
    Are you looking to log phone calls, SMS conversations and all other communications into a remote system, like a CRM or proprietary system? Check out App Connect! Built on top of Embeddable, App Connect makes building a full-featured integration with a CRM much, much easier. 
	
	[Learn more](https://ringcentral.github.io/rc-unified-crm-extension/){.md-button .md-button--primary}

RingCentral Embeddable provides a ready-to-use, fully-functional web phone that can be embedded into any web site. Embeddable is a javascript wrapper around the foundational [RingCentral Widgets Library](https://github.com/ringcentral/ringcentral-js-widgets). By adding a few lines of javascript, anyone can embed a phone into any web page in seconds. 

## Quick start

=== "Javascript"

    Add following code to any website's header to embed a RingCentral phone into that page. 

    ```js
    <script>
      (function() {
        var rcs = document.createElement("script");
        rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js";
        var rcs0 = document.getElementsByTagName("script")[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    </script>
    ```

=== "iframe"

    Add the following anywhere on your webpage.

    ```html
    <iframe width="300" height="500" allow="microphone" 
      src="https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html">
    </iframe>
    ```

Or access our [RingCentral Embeddable configuration tool](https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/) for a live demo.

!!! info "When loading RingCentral Embeddable for the first time, users will need to grant access to their microphone and speaker."

### Prerequisites

* A [RingCentral](https://ringcentral.com/pricing/) account
* A supported browser, including:
    - Chrome
    - Microsoft Edge
    - Firefox

!!! hint "Removing the "FOR DEMO PURPOSES ONLY" banner"
    You may observe that a banner appears when running the sample code above. To remove this banner, please register your own application and [use the client ID](config/client-id.md) associated with that application. 
