# Contributing to RingCentral Embeddable

RingCentral Embeddable is a free and open source developer tool. We encourage all developers to share their enhancements back with the community so that we can all benefit from them. 

## Developing RingCentral Embeddable locally

The following will guide you through the process of cloning, modifying and submitting your changes back to RingCentral so that they can merged into the main project. 

### Register a RingCentral app

1. Create a free [RingCentral developer account](https://developer.ringcentral.com)
2. Register a RingCentral REST API app with Auth type - "**3-legged OAuth Client-side web app**"
3. Specify these app scopes: `Edit Message`, `Edit Presence`, `Internal Messages`, `Read Accounts`, `Read Call Log`, `Read Contacts`, `Read Messages`, `Read Presence`, `RingOut`, `SMS`, `Call Control`, `VoIP Calling`, `WebSocketSubscription`, `TeamMessaging` (optional) and `Video` (optional) to your app.
5. Add a redirect uri `http://localhost:8080/redirect.html` to your app settings

### Create environment variables file in your project root path

Create `.env` file in project root path:

```
API_KEY=<YOUR APP'S CLIENT ID> 
# Sandbox
#API_SERVER=https://platform.devtest.ringcentral.com
# Production
API_SERVER=https://platform.ringcentral.com
```

### Start development server

We assume you have pre-installed node.js >= 14 and yarn.

**We recommended `yarn` instead of `npm`.** We have `yarn.lock` file in source code to lock dependence version. With `yarn`, we can install dependencies with correct version that work well with this project.

```bash
$ yarn       # use yarn to install dependences
$ yarn start # start a webpack dev server
```

Open site: 'http://localhost:8080/' on browser

### Setup your environment

You need to create `.env.test` file based on `.env.test.default`. The client id should support JWT grant authorization. And create [JWT token](https://developers.ringcentral.com/guide/getting-started/create-credential) for your test user and the client id.

```
API_KEY=your_ringcentral_test_app_client_id
API_SECRET=your_ringcentral_test_app_client_secret
API_SERVER=ringcentral sever url, eg: https://platform.devtest.ringcentral.com
TEST_JWT_TOKEN=JWT_TOKEN_for_test_account_and_test_app_client_id
TEST_HOST_URI=http://localhost:8080
TEST_HEADLESS=false
```

### Run automated tests

```
yarn test
```

### Deploy on production

If you create pull request to this repo and get merged, CI will deploy it to this repository's Github Page automatically. But for something that customized, you can deploy it to your own web space, such as your github page.

1. Update `.env` file in production environment ([Graduate your RingCentral app to get production app client id](docs/config-client-id-and-secret.md#graduation-for-your-ringcentral-app))

2. Run command to compile code and build release

```
$ HOSTING_URL=your_host_uri yarn build
```

Please replace `your_host_uri` with your own web host address, such as `https://ringcentral.github.io/ringcentral-embeddable`.

And set redirect uri `${your_host_uri}/redirect.html` in your app setting on RingCentral Developer website.

3. Upload all files in release folder to your web space. And visit it in browser.

### Build for browser extension

For browser extension, we can host all files in browser extension local folder instead CDN.

To build for browser extension local files:

```
yarn build-extension
```

After building, we can get compiled files in this project's extension folder. Create a `embeddable` folder in your extension project. Copy all files in extension folder to your extesnion project's `embeddable` folder.

Then you can load this widget with `${your_extension_uri}/embeddable/adapter.js` or `${your_extension_uri}/embeddable/app.html`.
