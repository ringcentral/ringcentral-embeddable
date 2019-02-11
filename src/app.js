import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';

import './lib/patchGetUserMedia';
import parseUri from './lib/parseUri';
import { createPhone } from './modules/Phone';
import App from './containers/App';
import brandConfig from './config/brand';
import defaultPrefix from './config/prefix';

const defaultApiConfig = process.env.API_CONFIG;
const appVersion = process.env.APP_VERSION;

const currentUri = window.location.href;
const pathParams = parseUri(currentUri);
const apiConfig = {
  appKey: pathParams.appKey || defaultApiConfig.appKey,
  appSecret: (pathParams.appKey ? pathParams.appSecret : defaultApiConfig.appSecret),
  server: pathParams.appServer || defaultApiConfig.server,
};

const redirectUri = pathParams.redirectUri || process.env.REDIRECT_URI;
const proxyUri = pathParams.proxyUri || process.env.PROXY_URI;
const stylesUri = pathParams.stylesUri;
const disableCall = typeof pathParams.disableCall !== 'undefined';
const disableMessages = typeof pathParams.disableMessages !== 'undefined';
const disableConferenceInvite = typeof pathParams.disableConferenceInvite !== 'undefined';
const disableGlip = typeof pathParams.disableGlip === 'undefined' || pathParams.disableGlip === 'true';
const disableConferenceCall = typeof pathParams.disableConferenceCall === 'undefined' || pathParams.disableConferenceCall === 'true';
const disableActiveCallControl = typeof pathParams.disableActiveCallControl === 'undefined' || pathParams.disableActiveCallControl === 'true';
const authMode = pathParams.authMode;
const prefix = pathParams.prefix || defaultPrefix;
const userAgent = pathParams.userAgent;

const phone = createPhone({
  apiConfig,
  brandConfig,
  prefix,
  appVersion,
  redirectUri,
  proxyUri,
  stylesUri,
  disableCall,
  disableMessages,
  disableConferenceInvite,
  disableGlip,
  disableConferenceCall,
  disableActiveCallControl,
  authMode,
  userAgent,
});

const store = createStore(phone.reducer);

phone.setStore(store);

window.phone = phone;

ReactDOM.render(
  <App
    phone={phone}
  />,
  document.querySelector('div#viewport'),
);
