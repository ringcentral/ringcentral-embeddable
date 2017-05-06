# [RingCentral Js Widget Demo](https://embbnux.github.io/ringcentral-widget-demo/)

## Introduction
This is the demo of RingCentral Js Widget.
Build with [RingCentral Commons](https://github.com/ringcentral/ringcentral-js-integration-commons/) and [RingCentral Widget](https://github.com/ringcentral/ringcentral-js-widget).

## Dependences

* yarn
* webpack 2
* react
* redux


## How to Develop

### Clone the code
```
git clone https://github.com/embbnux/ringcentral-widget-demo.git
```

### Create api secret file
```
# src/config/api.js
export default {
  appKey: 'your ringcentral app key',
  appSecret: 'your ringcentral app sercet',
  server: 'ringcentral sever url, eg: https://platform.devtest.ringcentral.com',
};
```

### Start server
```
yarn
yarn start
```
open site: 'http://localhost:8080/' on browser 
