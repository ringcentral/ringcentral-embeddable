---
type: runbook
title: Contributing to RingCentral Embeddable
description: Local development, automated testing, and deployment instructions.
owner: NEEDS_OWNER
status: proposed
---

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

We assume you have pre-installed node.js >= 20 and npm.

We have a `package-lock.json` file in source code to lock dependency versions. Use `npm ci` for clean, reproducible installs that match the locked versions exactly. `npm install` also works for day-to-day development.

```bash
$ npm install      # install dependencies from package-lock.json
$ npm start   # start a webpack dev server
```

Open site: 'http://localhost:8080/' on browser

### Setup your environment

For authenticated browser tests, create an optional `.env.test` file with a client ID that supports JWT grant authorization. Create a [JWT token](https://developers.ringcentral.com/guide/getting-started/create-credential) for your test user and supply it as `TEST_JWT_TOKEN`.

```
API_KEY=your_ringcentral_test_app_client_id
API_SECRET=your_ringcentral_test_app_client_secret
API_SERVER=ringcentral sever url, eg: https://platform.devtest.ringcentral.com
TEST_JWT_TOKEN=your_ringcentral_test_user_jwt
```

### Run automated tests

```
npm test
```

Run a focused test file when you only need one behavior:

```
npm test -- --runInBand test/unit/<name>.test.js
npm run test:unit
npm run test:integration
npm run test:coverage
```

Active tests live under `test/`. The files under `legacy-test/` are frozen reference material and are not part of any supported test command.

The `test:coverage` script enforces the active application's 80% coverage gate.

Run browser E2E tests separately:

```
npm run test:e2e
```

The [E2E configuration](jest.e2e.config.js) uses Jest and Puppeteer to exercise the real application, without the unit-test mocks. The [browser configuration](jest-puppeteer.config.js) starts the local development server and a separate host fixture on ports 8080 and 8081, then runs Chrome headlessly. Set `TEST_HEADLESS=false` to watch the browser. To test an application server that is already running, set `TEST_HOST_URI` and `TEST_E2E_EXTERNAL_SERVER=true`. `PUPPETEER_EXECUTABLE_PATH` can select an installed Chrome binary.

The smoke tests under [test/e2e](test/e2e) cover the direct app, landing-page iframe, cross-origin adapter injection, and widget minimize control without account credentials. The [authenticated navigation tests](test/e2e/widget.test.js) run when `TEST_JWT_TOKEN` is supplied. For those tests, provide the matching `API_KEY`, `API_SECRET`, and `API_SERVER` through environment variables or `.env.test`; without a JWT, Jest reports the authenticated cases as skipped.

### Deploy on production

If you create pull request to this repo and get merged, CI will deploy it to this repository's Github Page automatically. But for something that customized, you can deploy it to your own web space, such as your github page.

1. Update `.env` file in production environment ([Graduate your RingCentral app to get production app client id](docs/config-client-id-and-secret.md#graduation-for-your-ringcentral-app))

2. Run command to compile code and build release

```
$ HOSTING_URL=your_host_uri npm run build
```

Please replace `your_host_uri` with your own web host address, such as `https://ringcentral.github.io/ringcentral-embeddable`.

And set redirect uri `${your_host_uri}/redirect.html` in your app setting on RingCentral Developer website.

3. Upload all files in `release` to your web space, then visit it in a browser.

### Build for a Chrome extension

Run the extension build from the active application:

```
npm run build-extension
```

The ignored `src/noise-reduction/` directory must contain the Krisp SDK scripts and `models/model_8.kw` and `models/model_16.kw` before building. The command fails before compilation when any required noise-reduction asset is missing.

The command creates a local application bundle in `extension/`. It keeps `app.html`, JavaScript chunks, workers, assets, worklets, plugins, and noise-reduction resources on the extension origin. The Chrome extension manifest must expose the embedded files through `web_accessible_resources`.

This build preserves the legacy local-extension behavior. A Manifest V3 release also requires the consuming extension to enforce an MV3-compatible content security policy; verify the generated `app.html` and worker bootstrap against that policy before publishing.
