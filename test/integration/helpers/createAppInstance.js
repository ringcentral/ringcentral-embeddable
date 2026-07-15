import React from 'react';

import { RcMock, PubnubMock } from '@ringcentral-integration/mock';
import SimulateWindowObject from '@ringcentral-integration/commons/integration-test/utils/SimulateWindowObject';
import { waitUntilTo } from '@ringcentral-integration/utils';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { createStore } from 'redux';

import App from '../../../src/containers/App';
import { createPhone } from '../../../src/modules/Phone';

const apiConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  server: 'http://whatever',
  discoveryServer: 'http://whatever',
};

const brandConfig = {
  id: '1210',
  code: 'rc',
  name: 'RingCentral',
  appName: 'RingCentral Embeddable',
  signupUrl: 'https://www.ringcentral.com',
  assets: {},
};

function getUniquePrefix() {
  return `integration-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTestPhone(options = {}) {
  return createPhone({
    prefix: getUniquePrefix(),
    apiConfig,
    brandConfig,
    appVersion: 'test-version',
    redirectUri: 'http://localhost/redirect.html',
    proxyUri: 'http://localhost/proxy.html',
    brandBaseUrl: 'http://localhost/',
    recordingLink: 'https://example.com/recording',
    disableConferenceInvite: false,
    disableGlip: true,
    disableMeeting: true,
    disableNoiseReduction: true,
    disableInactiveTabCallEvent: true,
    multipleTabsSupport: false,
    isMainTab: true,
    autoMainTab: false,
    ...options,
  });
}

function createMock() {
  const rcMock = new RcMock({
    subscription: new PubnubMock(),
    enableValidation: false,
  });
  rcMock.replaceDefaultInitMock(rcMock.postSipProvision, function postSipProvision() {
    this.post('/restapi/v1.0/client-info/sip-provision', 200, {
      repeat: 0,
      response: {
        body: {
          device: {
            id: 'webphone-device-id',
            type: 'WebPhone',
          },
          sipInfo: [
            {
              username: 'test-sip-user',
              password: 'test-sip-password',
              authorizationId: 'test-authorization-id',
              domain: 'sip.example.test',
              outboundProxy: 'sip.example.test',
              outboundProxyIPv6: '',
              outboundProxyBackup: '',
              outboundProxyIPv6Backup: '',
              transport: 'WSS',
              certificate: '',
              switchBackInterval: 600,
            },
          ],
          sipInfoPstn: [],
          sipFlags: {
            voipFeatureEnabled: 'True',
            voipCountryBlocked: 'False',
            outboundCallsEnabled: 'True',
            dscpEnabled: false,
            dscpSignaling: 0,
            dscpVoice: 0,
            dscpVideo: 0,
          },
          sipErrorCodes: [],
        },
      },
    });
  });
  rcMock.defaultInitMocks.add(function getGrantExtensions() {
    this.get('/restapi/v1.0/account/:accountId/extension/:extensionId/grant', 200, {
      repeat: 0,
      response: {
        body: {
          records: [],
        },
      },
    });
  });
  return rcMock;
}

export async function createAppInstance(options = {}) {
  const rcMock = createMock();
  rcMock.init();
  SimulateWindowObject();
  const phone = createTestPhone(options.phoneOptions);
  const store = createStore(phone.reducer);
  phone.setStore(store);
  phone.connectivityMonitor._checkConnectionFunc = () => true;
  const app = render(
    <App
      phone={phone}
      showCallBadge={false}
      appVersion="test-version"
      fromPopup={false}
    />,
  );
  return {
    app,
    phone,
    rcMock,
  };
}

export async function loginApp({ phone }) {
  await waitUntilTo(() => {
    expect(phone.auth.ready).toBeTruthy();
  });
  Object.defineProperties(phone.audioSettings, {
    userMedia: {
      value: true,
      configurable: true,
    },
  });
  expect(screen.getByTestId('loginButton')).toBeInTheDocument();
  await phone.auth.login({
    username: 'test',
    password: 'test',
  });
  await waitForElementToBeRemoved(() => screen.queryByTestId('loginButton'), {
    timeout: 10000,
  });
  await waitUntilTo(() => {
    expect(phone.auth.loggedIn).toBeTruthy();
  });
}

export async function connectWebphone({ phone }) {
  await waitUntilTo(() => {
    expect(phone.webphone.ready).toBeTruthy();
  });
  await phone.webphone.connect({
    skipConnectDelay: true,
    skipDLCheck: true,
  });
  await waitUntilTo(() => {
    expect(phone.webphone.connected).toBeTruthy();
  });
}

export function destroyAppInstance({ app, rcMock }) {
  app.unmount();
  rcMock.reset();
  jest.clearAllTimers();
}
