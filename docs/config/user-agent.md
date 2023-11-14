# Customize X-User-Agent

We provide default `X-User-Agent` header as `RingCentralEmbeddable/0.2.0 RCJSSDK/3.1.3` in RingCentral API request for SDK usage analysis in backend. In this API, developers can also provide their desired User Agent into widget.

After that widget will change `X-User-Agent` header into `TestAPP/1.0.0 RingCentralEmbeddable/0.2.0 RCJSSDK/3.1.3` when send request to RingCentral Server.
