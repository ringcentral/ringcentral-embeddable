import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router, Route } from 'react-router';

import PhoneProvider from 'ringcentral-widgets/lib/PhoneProvider';
import CallingSettingsPage from 'ringcentral-widgets/containers/CallingSettingsPage';
import RegionSettingsPage from 'ringcentral-widgets/containers/RegionSettingsPage';
import DialerPage from 'ringcentral-widgets/containers/DialerPage';
import ComposeTextPage from 'ringcentral-widgets/containers/ComposeTextPage';
import IncomingCallPage from 'ringcentral-widgets/containers/IncomingCallPage';
import CallCtrlPage from 'ringcentral-widgets/containers/CallCtrlPage';
import CallBadgeContainer from 'ringcentral-widgets/containers/CallBadgeContainer';
import WelcomePage from 'ringcentral-widgets/containers/WelcomePage';
import AudioSettingsPage from 'ringcentral-widgets/containers/AudioSettingsPage';
import ContactsPage from 'ringcentral-widgets/containers/ContactsPage';
import ContactDetailsPage from 'ringcentral-widgets/containers/ContactDetailsPage';
import FeedbackPage from 'ringcentral-widgets/containers/FeedbackPage';
import ConferencePage from 'ringcentral-widgets/containers/ConferencePage';
import ConferenceCommands from 'ringcentral-widgets/components/ConferenceCommands';
import AlertContainer from 'ringcentral-widgets/containers/AlertContainer';
import ConversationsPage from 'ringcentral-widgets/containers/ConversationsPage';
import ConversationPage from 'ringcentral-widgets/containers/ConversationPage';
import GlipGroups from '@ringcentral-integration/glip-widgets/containers/GlipGroups';
import GlipChat from '@ringcentral-integration/glip-widgets/containers/GlipChat';

import MainView from '../MainView';
import AppView from '../AppView';

import RecentActivityContainer from '../RecentActivityContainer';
import ThirdPartyConferenceInviteButton from '../ThirdPartyConferenceInviteButton';

import SettingsPage from '../SettingsPage';
import CallsListPage from '../CallsListPage';

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
                    showFeedback={false}
                    showUserGuide={false}
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
                path="/settings/feedback"
                component={FeedbackPage}
              />
              <Route
                path="/calls"
                component={() => (
                  <CallsListPage />
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
                  <ConversationsPage
                    showGroupNumberName
                    showContactDisplayPlaceholder={false}
                  />
                )}
              />
              <Route
                path="/contacts"
                component={() =>
                  <ContactsPage
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
                  >
                    <RecentActivityContainer
                      navigateTo={(path) => {
                        phone.routerInteraction.push(path);
                      }}
                      contact={phone.contactDetails.contact}
                      useContact
                    />
                  </ContactDetailsPage>
                )}
              />
              <Route
                path="/conference"
                component={
                  () => (
                    <ConferencePage
                      additionalButtons={[ThirdPartyConferenceInviteButton]}
                    />
                  )
                }
              />
              <Route
                path="/conference/commands"
                component={() => (
                  <ConferenceCommands
                    currentLocale={phone.locale.currentLocale}
                    onBack={() => phone.routerInteraction.goBack()} />
                )}
              />
              <Route
                path="/glip"
                component={
                  () =>
                    <GlipGroups
                      hiddenCurrentGroup
                      onSelectGroup={(id) => {
                        phone.routerInteraction.push(`/glip/groups/${id}`);
                      }}
                    />
                }
              />
              <Route
                path="/glip/groups/:groupId"
                component={
                  routerProps => (
                    <GlipChat
                      params={routerProps.params}
                      onBackClick={() => {
                        phone.routerInteraction.push('/glip');
                      }}
                      onViewPersonProfile={
                        (id) => {
                          console.log(id);
                        }
                      }
                      onViewGroup={
                        (id) => {
                          phone.routerInteraction.push(`/glip/groups/${id}`);
                        }
                      }
                    />
                  )
                }
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
