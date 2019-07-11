import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';

import './lib/patchGetUserMedia';
import parseUri from './lib/parseUri';
import { createPhone } from './modules/Phone';
import App from './containers/App';

const defaultPrefix = process.env.PREFIX;
const brandConfig = process.env.BRAND_CONFIG;
const defaultApiConfig = process.env.API_CONFIG;

const currentUri = window.location.href;
const pathParams = parseUri(currentUri);
const apiConfig = {
  appKey: pathParams.appKey || defaultApiConfig.appKey,
  appSecret: (pathParams.appKey ? pathParams.appSecret : defaultApiConfig.appSecret),
  server: pathParams.appServer || defaultApiConfig.server,
};

const appVersion = pathParams.appVersion || process.env.APP_VERSION;

const {
  stylesUri,
  authMode,
  userAgent,
  analyticsKey,
  enableErrorReport,
  authorizationCode,
  defaultCallWith,
} = pathParams;

const redirectUri = pathParams.redirectUri || process.env.REDIRECT_URI;
const proxyUri = pathParams.proxyUri || process.env.PROXY_URI;
const disableCall = typeof pathParams.disableCall !== 'undefined';
const disableMessages = typeof pathParams.disableMessages !== 'undefined';
const disableConferenceInvite = typeof pathParams.disableConferenceInvite !== 'undefined';
const disableGlip = typeof pathParams.disableGlip === 'undefined' || pathParams.disableGlip === 'true';
const disableConferenceCall = typeof pathParams.disableConferenceCall === 'undefined' || pathParams.disableConferenceCall === 'true';
const disableActiveCallControl = typeof pathParams.disableActiveCallControl === 'undefined' || pathParams.disableActiveCallControl === 'true';

const prefix = pathParams.prefix || defaultPrefix;
const fromAdapter = !!pathParams.fromAdapter;
let _errorReportToken = null;
if (enableErrorReport) {
  _errorReportToken = process.env.ERROR_REPORT_KEY;
}
if (pathParams.errorReportToken) {
  _errorReportToken = pathParams.errorReportToken;
}
const errorReportSampleRate = pathParams.errorReportSampleRate || '0.1';
const errorReportProjectId = pathParams.errorReportProjectId || '16';
const errorReportEndpoint = (_errorReportToken && `http://${_errorReportToken}@ec2-13-124-226-35.ap-northeast-2.compute.amazonaws.com/${errorReportProjectId}`) || null;

const recordingLink = process.env.RECORDING_LINK;

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
  analyticsKey,
  errorReportEndpoint,
  errorReportSampleRate,
  recordingLink,
  authorizationCode,
  defaultCallWith,
});

const store = createStore(phone.reducer);

phone.setStore(store);

window.phone = phone;

ReactDOM.render(
  <App
    phone={phone}
    showCallBadge={!fromAdapter}
  />,
  document.querySelector('div#viewport'),
);
