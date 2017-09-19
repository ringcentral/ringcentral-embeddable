# [RingCentral JS Widget Demo](https://ringcentral.github.io/ringcentral-widget-demo/)

## Introduction
This is the demo of RingCentral JS Widget.
Build with [RingCentral Commons](https://github.com/ringcentral/ringcentral-js-integration-commons/) and [RingCentral Widget](https://github.com/ringcentral/ringcentral-js-widget).

## Dependences

* yarn
* webpack 2
* react
* redux


## How to Develop

### Clone the code
```
git clone https://github.com/ringcentral/ringcentral-widget-demo.git
```

### Create api secret file in project root path
```
# api.json
{
  "appKey": "your ringcentral app key",
  "appSecret": "your ringcentral app sercet",
  "server": "ringcentral sever url, eg: https://platform.devtest.ringcentral.com"
}
```

App Permission required: `Edit Message`, `Edit Presence`, `Faxes`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS` and `VoIP Calling`

### Start server
```
yarn
yarn start
```
open site: 'http://localhost:8080/' on browser

## Online demo

Visit [Demo website](https://ringcentral.github.io/ringcentral-widget-demo/) in github pages.
Set your appKey and appSecret in this online demo, and update redirect_uri in your rc dev account.
