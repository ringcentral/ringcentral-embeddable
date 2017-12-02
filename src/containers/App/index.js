import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router, Route } from 'react-router';

import PhoneProvider from 'ringcentral-widgets/lib/PhoneProvider';
import CallingSettingsPage from 'ringcentral-widgets/containers/CallingSettingsPage';
import RegionSettingsPage from 'ringcentral-widgets/containers/RegionSettingsPage';
import DialerPage from 'ringcentral-widgets/containers/DialerPage';
import ComposeTextPage from 'ringcentral-widgets/containers/ComposeTextPage';
import ConversationPage from 'ringcentral-widgets/containers/ConversationPage';
import MessagesPage from 'ringcentral-widgets/containers/MessagesPage';
import SettingsPage from 'ringcentral-widgets/containers/SettingsPage';
import ActiveCallsPage from 'ringcentral-widgets/containers/ActiveCallsPage';
import CallHistoryPage from 'ringcentral-widgets/containers/CallHistoryPage';
import IncomingCallPage from 'ringcentral-widgets/containers/IncomingCallPage';
import CallCtrlPage from 'ringcentral-widgets/containers/CallCtrlPage';
import CallBadgeContainer from 'ringcentral-widgets/containers/CallBadgeContainer';
import WelcomePage from 'ringcentral-widgets/containers/WelcomePage';
import AudioSettingsPage from 'ringcentral-widgets/containers/AudioSettingsPage';
import ContactsPage from 'ringcentral-widgets/containers/ContactsPage';
import ContactDetailsPage from 'ringcentral-widgets/containers/ContactDetailsPage';

import AlertContainer from 'ringcentral-widgets/containers/AlertContainer';
import getAlertRenderer from '../../components/AlertRenderer';

import MainView from '../MainView';
import AppView from '../AppView';


export default function App({
  phone,
  hostingUrl,
}) {
  return (
    <PhoneProvider phone={phone}>
      <Provider store={phone.store} >
        <Router history={phone.routerInteraction.history} >
          <Route
            component={routerProps => (
              <AppView
                hostingUrl={hostingUrl}
              >
                {routerProps.children}
                <CallBadgeContainer
                  hidden={routerProps.location.pathname === '/calls/active'}
                  goToCallCtrl={() => {
                    phone.routerInteraction.push('/calls/active');
                  }}
                />
                <IncomingCallPage
                  showContactDisplayPlaceholder={false}
                  getAvatarUrl={
                    async (contact) => {
                      const avatarUrl = await phone.contacts.getProfileImage(contact);
                      return avatarUrl;
                    }
                  }
                >
                  <AlertContainer
                    callingSettingsUrl="/settings/calling"
                    regionSettingsUrl="/settings/region"
                    getAdditionalRenderer={getAlertRenderer}
                  />
                </IncomingCallPage>
              </AppView>
            )} >
            <Route
              path="/"
              component={() => (
                <WelcomePage>
                  <AlertContainer
                    callingSettingsUrl="/settings/calling"
                    regionSettingsUrl="/settings/region"
                    getAdditionalRenderer={getAlertRenderer}
                  />
                </WelcomePage>
              )}
            />
            <Route
              path="/"
              component={routerProps => (
                <MainView>
                  {routerProps.children}
                  <AlertContainer
                    callingSettingsUrl="/settings/calling"
                    regionSettingsUrl="/settings/region"
                    getAdditionalRenderer={getAlertRenderer}
                  />
                </MainView>
              )} >
              <Route
                path="/dialer"
                component={DialerPage}
              />
              <Route
                path="/settings"
                component={routerProps => (
                  <SettingsPage
                    params={routerProps.location.query}
                    regionSettingsUrl="/settings/region"
                    callingSettingsUrl="/settings/calling"
                  />
                )}
              />
              <Route
                path="/settings/region"
                component={RegionSettingsPage}
              />
              <Route
                path="/settings/calling"
                component={CallingSettingsPage}
              />
              <Route
                path="/settings/audio"
                component={AudioSettingsPage}
              />
              <Route
                path="/calls"
                component={() => (
                  <ActiveCallsPage
                    onCreateContact={() => { console.log('Sorry, The feature is still on development'); }}
                    onCallsEmpty={() => {
                      if (phone.webphone && phone.webphone._webphone) {
                        phone.routerInteraction.push('/dialer');
                      }
                    }}
                  />
                )} />
              <Route
                path="/calls/active"
                component={() => (
                  <CallCtrlPage
                    onAdd={() => {
                      phone.routerInteraction.push('/dialer');
                    }}
                    onBackButtonClick={() => {
                      phone.routerInteraction.push('/calls');
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
                    onViewContact={() => {}}
                    showContactDisplayPlaceholder={false}
                  />
                )}
              />
              <Route
                path="/composeText"
                component={ComposeTextPage}
              />
              <Route
                path="/conversations/:conversationId"
                component={routerProps => (
                  <ConversationPage
                    params={routerProps.params}
                    showContactDisplayPlaceholder={false}
                    showGroupNumberName
                  />
                )}
              />
              <Route
                path="/messages"
                component={() => (
                  <MessagesPage
                    showGroupNumberName
                    onCreateContact={() => { console.log('Sorry, The feature is still on development'); }}
                    showContactDisplayPlaceholder={false}
                  />
                )}
              />
              <Route
                path="/contacts"
                component={() =>
                  <ContactsPage
                    onCreateContact={() => { console.log('Sorry, The feature is still on development'); }}
                    onVisitPage={async () => {
                      await phone.contacts.sync();
                    }}
                  />
                }
              />
              <Route
                path="/contacts/:contactType/:contactId"
                component={routerProps => (
                  <ContactDetailsPage
                    params={routerProps.params}
                    onClickMailTo={
                      (email) => {
                        window.open(`mailto:${email}`);
                      }
                    }
                  />
                )}
              />
            </Route>
          </Route>
        </Router>
      </Provider>
    </PhoneProvider>
  );
}

App.propTypes = {
  phone: PropTypes.object.isRequired,
  hostingUrl: PropTypes.string.isRequired,
};
