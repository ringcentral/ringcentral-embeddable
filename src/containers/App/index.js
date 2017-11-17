import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router, Route } from 'react-router';

import CallingSettingsPage from 'ringcentral-widget/containers/CallingSettingsPage';
import RegionSettingsPage from 'ringcentral-widget/containers/RegionSettingsPage';
import DialerPage from 'ringcentral-widget/containers/DialerPage';
import ComposeTextPage from 'ringcentral-widget/containers/ComposeTextPage';
import ConversationPage from 'ringcentral-widget/containers/ConversationPage';
// import ConferencePage from 'ringcentral-widget/containers/ConferencePage';
import MessagesPage from 'ringcentral-widget/containers/MessagesPage';
import SettingsPage from 'ringcentral-widget/containers/SettingsPage';
import ActiveCallsPage from 'ringcentral-widget/containers/ActiveCallsPage';
import CallHistoryPage from 'ringcentral-widget/containers/CallHistoryPage';
import IncomingCallPage from 'ringcentral-widget/containers/IncomingCallPage';
import CallCtrlPage from 'ringcentral-widget/containers/CallCtrlPage';
import CallBadgeContainer from 'ringcentral-widget/containers/CallBadgeContainer';
import WelcomePage from 'ringcentral-widget/containers/WelcomePage';

import AlertContainer from '../AlertContainer';

import MainView from '../MainView';
import AppView from '../AppView';


export default function App({
  phone,
  hostingUrl,
}) {
  return (
    <Provider store={phone.store} >
      <Router history={phone.router.history} >
        <Route
          component={routerProps => (
            <AppView
              hostingUrl={hostingUrl}
              auth={phone.auth}
              alert={phone.alert}
              locale={phone.locale}
              environment={phone.environment}
              brand={phone.brand}
              rateLimiter={phone.rateLimiter}
              connectivityMonitor={phone.connectivityMonitor}
              callingSettings={phone.callingSettings}>
              {routerProps.children}
              <CallBadgeContainer
                locale={phone.locale}
                webphone={phone.webphone}
                hidden={routerProps.location.pathname === '/calls/active'}
                goToCallCtrl={() => {
                  phone.router.push('/calls/active');
                }}
              />
              <IncomingCallPage
                brand={phone.brand}
                locale={phone.locale}
                webphone={phone.webphone}
                forwardingNumber={phone.forwardingNumber}
                regionSettings={phone.regionSettings}
                router={phone.router}
                contactMatcher={phone.contactMatcher}
                getAvatarUrl={
                  async (contact) => {
                    const avatarUrl = await phone.contacts.getProfileImage(contact);
                    return avatarUrl;
                  }
                }
              >
                <AlertContainer
                  locale={phone.locale}
                  alert={phone.alert}
                  rateLimiter={phone.rateLimiter}
                  brand={phone.brand}
                  router={phone.router}
                  callingSettingsUrl="/settings/calling"
                  regionSettingsUrl="/settings/region"
                />
              </IncomingCallPage>
            </AppView>
          )} >
          <Route
            path="/"
            component={() => (
              <WelcomePage
                version={phone.version}
                auth={phone.auth}
                locale={phone.locale}
                rateLimiter={phone.rateLimiter}
                connectivityMonitor={phone.connectivityMonitor}
              >
                <AlertContainer
                  locale={phone.locale}
                  alert={phone.alert}
                  rateLimiter={phone.rateLimiter}
                  brand={phone.brand}
                  router={phone.router}
                  callingSettingsUrl="/settings/calling"
                  regionSettingsUrl="/settings/region"
                />
              </WelcomePage>
            )}
          />
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
                  router={phone.router}
                  callingSettingsUrl="/settings/calling"
                  regionSettingsUrl="/settings/region"
                />
              </MainView>
            )} >
            <Route
              path="/dialer"
              component={() => (
                <DialerPage
                  call={phone.call}
                  callingSettings={phone.callingSettings}
                  connectivityMonitor={phone.connectivityMonitor}
                  locale={phone.locale}
                  rateLimiter={phone.rateLimiter}
                  regionSettings={phone.regionSettings}
                  webphone={phone.webphone}
                />
              )} />
            <Route
              path="/settings"
              component={routerProps => (
                <SettingsPage
                  params={routerProps.location.query}
                  auth={phone.auth}
                  extensionInfo={phone.extensionInfo}
                  accountInfo={phone.accountInfo}
                  regionSettings={phone.regionSettings}
                  version={phone.version}
                  locale={phone.locale}
                  brand={phone.brand}
                  router={phone.router}
                  rolesAndPermissions={phone.rolesAndPermissions}
                  callingSettings={phone.callingSettings}
                  presence={phone.detailedPresence}
                  regionSettingsUrl="/settings/region"
                  callingSettingsUrl="/settings/calling"
                />
              )} />
            <Route
              path="/settings/region"
              component={() => (
                <RegionSettingsPage
                  regionSettings={phone.regionSettings}
                  locale={phone.locale}
                  router={phone.router}
                />
              )} />
            <Route
              path="/settings/calling"
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
              component={() => (
                <ActiveCallsPage
                  locale={phone.locale}
                  callMonitor={phone.callMonitor}
                  contactMatcher={phone.contactMatcher}
                  contactSearch={phone.contactSearch}
                  regionSettings={phone.regionSettings}
                  connectivityMonitor={phone.connectivityMonitor}
                  rateLimiter={phone.rateLimiter}
                  onViewContact={() => { }}
                  onCreateContact={() => { }}
                  router={phone.router}
                  composeText={phone.composeText}
                  rolesAndPermissions={phone.rolesAndPermissions}
                  webphone={phone.webphone}
                  brand={phone.brand}
                />
              )} />
            <Route
              path="/calls/active"
              component={() => (
                <CallCtrlPage
                  brand={phone.brand}
                  locale={phone.locale}
                  contactMatcher={phone.contactMatcher}
                  webphone={phone.webphone}
                  regionSettings={phone.regionSettings}
                  forwardingNumber={phone.forwardingNumber}
                  callMonitor={{ calls: [{}, {}] }}
                  onAdd={() => {
                    phone.router.push('/dialer');
                  }}
                  onBackButtonClick={() => {
                    phone.router.push('/calls');
                  }}
                  getAvatarUrl={
                    async (contact) => {
                      const avatarUrl = await phone.contacts.getProfileImage(contact);
                      return avatarUrl;
                    }
                  }
                />
              )} />
            <Route
              path="/history"
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
                  onViewContact={() => {}}
                  rateLimiter={phone.rateLimiter}
                  brand={phone.brand}
                  showContactDisplayPlaceholder={false}
                />
              )} />
            <Route
              path="/composeText"
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
              component={props => (
                <ConversationPage
                  locale={phone.locale}
                  auth={phone.auth}
                  params={props.params}
                  brand={phone.brand}
                  regionSettings={phone.regionSettings}
                  conversation={phone.conversation}
                  messageStore={phone.messageStore}
                  dateTimeFormat={phone.dateTimeFormat}
                  contactMatcher={phone.contactMatcher}
                  connectivityMonitor={phone.connectivityMonitor}
                  rateLimiter={phone.rateLimiter}
                  messages={phone.messages}
                  router={phone.router}
                  showContactDisplayPlaceholder={false}
                />
              )} />
            <Route
              path="/messages"
              component={() => (
                <MessagesPage
                  locale={phone.locale}
                  router={phone.router}
                  messages={phone.messages}
                  brand={phone.brand}
                  regionSettings={phone.regionSettings}
                  dateTimeFormat={phone.dateTimeFormat}
                  connectivityMonitor={phone.connectivityMonitor}
                  rateLimiter={phone.rateLimiter}
                  call={phone.call}
                  rolesAndPermissions={phone.rolesAndPermissions}
                  onLogConversation={async () => { await sleep(1000); }}
                  onViewContact={() => { }}
                  onCreateContact={() => { }}
                  showContactDisplayPlaceholder={false}
                />
              )} />
          </Route>
        </Route>
      </Router>
    </Provider>
  );
}

App.propTypes = {
  phone: PropTypes.object.isRequired,
};
