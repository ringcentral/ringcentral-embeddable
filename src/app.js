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

if (apiConfig.appKey && apiConfig.appKey === defaultApiConfig.appKey) {
  console.warn('Default RingCentral client id is deprecated, it is required to setup your own RingCentral Client Id, Please stop using it soon before it is completely removed. Please follow here to setup your own RingCentral app client id: https://github.com/ringcentral/ringcentral-embeddable/blob/master/docs/config-client-id-and-secret.md');
}
if (!apiConfig.appKey) {
  console.error('From v1.0.2, It is required to setup your own RingCentral Client Id. Please follow here to setup your own RingCentral app client id: https://github.com/ringcentral/ringcentral-embeddable/blob/master/docs/config-client-id-and-secret.md');
  // don't throw error in PR tests
  if (window.location.hostname !== 'localhost') {
    throw new Error('RingCentral App Client Id is required.');
  }
}

const appVersion = process.env.APP_VERSION;
const externalAppVersion = pathParams.appVersion || appVersion;

const {
  stylesUri,
  authMode,
  userAgent,
  analyticsKey,
  enableErrorReport,
  authorizationCode,
  defaultCallWith,
  enableFromNumberSetting,
  disconnectInactiveWebphone,
  disableInactiveTabCallEvent,
} = pathParams;

const redirectUri = pathParams.redirectUri || process.env.REDIRECT_URI;
const proxyUri = pathParams.proxyUri || process.env.PROXY_URI;
const disableCall = typeof pathParams.disableCall !== 'undefined';
const disableMessages = typeof pathParams.disableMessages !== 'undefined';
const disableReadText = typeof pathParams.disableReadText !== 'undefined';
const disableConferenceInvite = typeof pathParams.disableConferenceInvite === 'undefined' || pathParams.disableConferenceInvite === 'true';
const disableGlip = typeof pathParams.disableGlip === 'undefined' || pathParams.disableGlip === 'true';
const disableConferenceCall = typeof pathParams.disableConferenceCall === 'undefined' || pathParams.disableConferenceCall === 'true';
const disableMeeting = typeof pathParams.disableMeeting !== 'undefined';

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
  disableReadText,
  disableConferenceInvite,
  disableGlip,
  disableConferenceCall,
  disableMeeting,
  authMode,
  userAgent,
  analyticsKey,
  errorReportEndpoint,
  errorReportSampleRate,
  recordingLink,
  authorizationCode,
  defaultCallWith,
  disableInactiveTabCallEvent: !!disableInactiveTabCallEvent,
  enableFromNumberSetting: !!enableFromNumberSetting,
  disconnectInactiveWebphone: !!disconnectInactiveWebphone,
});

const store = createStore(phone.reducer);

phone.setStore(store);

window.phone = phone;

ReactDOM.render(
  <App
    phone={phone}
    showCallBadge={!fromAdapter}
    appVersion={externalAppVersion}
  />,
  document.querySelector('div#viewport'),
);
