import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute } from 'react-router';
import loginStatus from 'ringcentral-integration/modules/Auth/loginStatus';
import sleep from 'ringcentral-integration/lib/sleep';

import AlertContainer from 'ringcentral-widget/containers/AlertContainer';
import WelcomePage from 'ringcentral-widget/containers/WelcomePage';
import CallingSettingsPage from 'ringcentral-widget/containers/CallingSettingsPage';
import RegionSettingsPage from 'ringcentral-widget/containers/RegionSettingsPage';
import DialerPage from 'ringcentral-widget/containers/DialerPage';
import ComposeTextPage from 'ringcentral-widget/containers/ComposeTextPage';
import ConversationPage from 'ringcentral-widget/containers/ConversationPage';
// import ConferencePage from 'ringcentral-widget/containers/ConferencePage';
import MessagesPage from 'ringcentral-widget/containers/MessagesPage';
import SettingsPage from 'ringcentral-widget/containers/SettingsPage';
import CallMonitorPage from 'ringcentral-widget/containers/CallMonitorPage';
import CallHistoryPage from 'ringcentral-widget/containers/CallHistoryPage';
import ActiveCallPage from 'ringcentral-widget/containers/ActiveCallPage';

import MainView from '../MainView';
import AppView from '../AppView';


export default function App({
  phone,
}) {
  // TODO find a more reason place to do this
  phone.store.subscribe(() => {
    if (phone.auth.ready) {
      if (
        phone.router.currentPath !== '/welcome' &&
        phone.auth.loginStatus === loginStatus.notLoggedIn
      ) {
        phone.router.history.push('/welcome');
      } else if (
        phone.router.currentPath === '/welcome' &&
        phone.auth.loginStatus === loginStatus.loggedIn
      ) {
        phone.router.history.push('/');
      }
    }
  });

  const ensureLogin = async (nextState, replace, cb) => {
    if (!(await phone.auth.checkIsLoggedIn())) {
      replace('/welcome');
    }
    cb();
  };
  return (
    <Provider store={phone.store} >
      <Router history={phone.router.history} >
        <Route
          component={props => (
            <AppView
              auth={phone.auth}
              alert={phone.alert}
              locale={phone.locale}
              environment={phone.environment}
              brand={phone.brand}
              rateLimiter={phone.rateLimiter}
              connectivityMonitor={phone.connectivityMonitor}
              callingSettings={phone.callingSettings}>
              {props.children}
              <ActiveCallPage
                locale={phone.locale}
                webphone={phone.webphone}
                regionSettings={phone.regionSettings}
                router={phone.router}
              >
                <AlertContainer
                  locale={phone.locale}
                  alert={phone.alert}
                  rateLimiter={phone.rateLimiter}
                  brand={phone.brand}
                />
              </ActiveCallPage>
            </AppView>
          )} >
          <Route
            path="/"
            component={props => (
              <MainView
                router={phone.router}
                messageStore={phone.messageStore}
                auth={phone.auth}
                rolesAndPermissions={phone.rolesAndPermissions} >
                {props.children}
                <AlertContainer
                  locale={phone.locale}
                  alert={phone.alert}
                  rateLimiter={phone.rateLimiter}
                  brand={phone.brand}
                />
              </MainView>
            )} >
            <IndexRoute
              onEnter={ensureLogin}
              component={() => (
                <DialerPage
                  call={phone.call}
                  callingSettings={phone.callingSettings}
                  connectivityMonitor={phone.connectivityMonitor}
                  locale={phone.locale}
                  rateLimiter={phone.rateLimiter}
                />
              )} />
            <Route
              path="/settings"
              onEnter={ensureLogin}
              component={() => (
                <SettingsPage
                  auth={phone.auth}
                  extensionInfo={phone.extensionInfo}
                  accountInfo={phone.accountInfo}
                  regionSettings={phone.regionSettings}
                  version={phone.version}
                  locale={phone.locale}
                  brand={phone.brand}
                  router={phone.router}
                  rolesAndPermissions={phone.rolesAndPermissions}
                  regionSettingsUrl="/settings/region"
                  callingSettingsUrl="/settings/calling"
                />
              )} />
            <Route
              path="/settings/region"
              onEnter={ensureLogin}
              component={() => (
                <RegionSettingsPage
                  regionSettings={phone.regionSettings}
                  locale={phone.locale}
                  router={phone.router}
                />
              )} />
            <Route
              path="/settings/calling"
              onEnter={ensureLogin}
              component={() => (
                <CallingSettingsPage
                  brand={phone.brand}
                  callingSettings={phone.callingSettings}
                  locale={phone.locale}
                  router={phone.router}
                />
              )} />
            <Route
              path="/calls"
              onEnter={ensureLogin}
              component={() => (
                <CallMonitorPage
                  locale={phone.locale}
                  callMonitor={phone.callMonitor}
                  contactMatcher={phone.contactMatcher}
                  regionSettings={phone.regionSettings}
                  connectivityMonitor={phone.connectivityMonitor}
                  dateTimeFormat={phone.dateTimeFormat}
                  onLogCall={async () => { await sleep(1000); }}
                  onViewContact={() => {}}
                  router={phone.router}
                  composeText={phone.composeText}
                  rateLimiter={phone.rateLimiter}
                  rolesAndPermissions={phone.rolesAndPermissions}
                />
              )} />
            <Route
              path="/history"
              onEnter={ensureLogin}
              component={() => (
                <CallHistoryPage
                  locale={phone.locale}
                  callHistory={phone.callHistory}
                  contactMatcher={phone.contactMatcher}
                  regionSettings={phone.regionSettings}
                  connectivityMonitor={phone.connectivityMonitor}
                  dateTimeFormat={phone.dateTimeFormat}
                  call={phone.call}
                  composeText={phone.composeText}
                  rolesAndPermissions={phone.rolesAndPermissions}
                  router={phone.router}
                  onLogCall={async () => { await sleep(1000); }}
                  onViewContact={() => {}}
                  rateLimiter={phone.rateLimiter}
                />
              )} />
            <Route
              path="/composeText"
              onEnter={ensureLogin}
              component={() => (
                <ComposeTextPage
                  locale={phone.locale}
                  auth={phone.auth}
                  composeText={phone.composeText}
                  messageStore={phone.messageStore}
                  router={phone.router}
                  regionSettings={phone.regionSettings}
                  contactSearch={phone.contactSearch}
                  rolesAndPermissions={phone.rolesAndPermissions}
                  messageSender={phone.messageSender}
                  connectivityMonitor={phone.connectivityMonitor}
                  rateLimiter={phone.rateLimiter}
                />
              )} />
            <Route
              path="/conversations/:conversationId"
              onEnter={ensureLogin}
              component={props => (
                <ConversationPage
                  locale={phone.locale}
                  auth={phone.auth}
                  params={props.params}
                  regionSettings={phone.regionSettings}
                  conversation={phone.conversation}
                  messageStore={phone.messageStore}
                  dateTimeFormat={phone.dateTimeFormat}
                  contactMatcher={phone.contactMatcher}
                  connectivityMonitor={phone.connectivityMonitor}
                  rateLimiter={phone.rateLimiter}
                  messages={phone.messages}
                  conversationLogger={phone.conversationLogger}
                />
              )} />
            <Route
              path="/messages"
              onEnter={ensureLogin}
              component={() => (
                <MessagesPage
                  locale={phone.locale}
                  auth={phone.auth}
                  messages={phone.messages}
                  messageStore={phone.messageStore}
                  extensionInfo={phone.extensionInfo}
                  regionSettings={phone.regionSettings}
                  contactMatcher={phone.contactMatcher}
                  dateTimeFormat={phone.dateTimeFormat}
                  connectivityMonitor={phone.connectivityMonitor}
                  rolesAndPermissions={phone.rolesAndPermissions}
                  rateLimiter={phone.rateLimiter}
                  router={phone.router}
                  conversationLogger={phone.conversationLogger}
                />
              )} />
          </Route>
          <Route
            path="/welcome"
            onEnter={async (nextState, replace, cb) => {
              if (await phone.auth.checkIsLoggedIn()) {
                replace('/');
              }
              cb();
            }}
            component={() => (
              <WelcomePage
                auth={phone.auth}
                locale={phone.locale}
                rateLimiter={phone.rateLimiter}
                connectivityMonitor={phone.connectivityMonitor} >
                <AlertContainer
                  locale={phone.locale}
                  alert={phone.alert}
                  rateLimiter={phone.rateLimiter}
                  brand={phone.brand}
                />
              </WelcomePage>
            )}
          />
        </Route>
      </Router>
    </Provider>
  );
}

App.propTypes = {
  phone: PropTypes.object.isRequired,
};
