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

import ConferenceCallDialerPage from 'ringcentral-widgets/containers/ConferenceCallDialerPage';
import CallsOnholdPage from 'ringcentral-widgets/containers/CallsOnholdPage';
import DialerAndCallsTabContainer from 'ringcentral-widgets/containers/DialerAndCallsTabContainer';
import ConferenceParticipantPage from 'ringcentral-widgets/containers/ConferenceParticipantPage';
import TransferPage from 'ringcentral-widgets/containers/TransferPage';
import ActiveCallCtrlPage from 'ringcentral-widgets/containers/SimpleActiveCallCtrlPage';

import MainView from '../MainView';
import AppView from '../AppView';

import RecentActivityContainer from '../RecentActivityContainer';
import ThirdPartyConferenceInviteButton from '../ThirdPartyConferenceInviteButton';

import SettingsPage from '../SettingsPage';
import CallsListPage from '../CallsListPage';
import ActiveCallsPage from '../ActiveCallsPage';

export default function App({
  phone,
}) {
  const getAvatarUrl = async (contact) => {
    const avatarUrl = await phone.contacts.getProfileImage(contact, true);
    return avatarUrl;
  };
  return (
    <PhoneProvider phone={phone}>
      <Provider store={phone.store} >
        <Router history={phone.routerInteraction.history} >
          <Route
            component={routerProps => (
              <AppView>
                {routerProps.children}
                <CallBadgeContainer
                  hidden={(
                    routerProps.location.pathname && (
                      routerProps.location.pathname.indexOf('/calls/active') > -1 ||
                      routerProps.location.pathname.indexOf('/conferenceCall') > -1
                    )
                  )}
                  goToCallCtrl={() => {
                    phone.routerInteraction.push('/calls/active');
                  }}
                />
                <IncomingCallPage
                  showContactDisplayPlaceholder={false}
                  getAvatarUrl={getAvatarUrl}
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
                component={() => (
                  <DialerAndCallsTabContainer>
                    <DialerPage />
                  </DialerAndCallsTabContainer>
                )}
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
                path="/history"
                component={() => (
                  <CallsListPage />
                )} />
              <Route
                path="/calls"
                component={() => (
                  <DialerAndCallsTabContainer>
                    <ActiveCallsPage
                      showRingoutCallControl
                      onCallsEmpty={() => {
                        phone.routerInteraction.push('/dialer');
                      }}
                      useV2
                      getAvatarUrl={getAvatarUrl}
                    />
                  </DialerAndCallsTabContainer>
                )} />
              <Route
                path="/calls/active(/:sessionId)"
                component={routerProps => (
                  <CallCtrlPage
                    params={routerProps.params}
                    onAdd={() => {
                      phone.routerInteraction.push('/dialer');
                    }}
                    onBackButtonClick={() => {
                      phone.routerInteraction.push('/calls');
                    }}
                    getAvatarUrl={getAvatarUrl}
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
                        async (personId) => {
                          if (personId === phone.glipPersons.me.id) {
                            return;
                          }
                          let group = phone.glipGroups.groups.slice(0, 10).find((g) => {
                            if (g.type !== 'PrivateChat') {
                              return false;
                            }
                            return g.members.indexOf(personId) > -1;
                          });
                          if (!group) {
                            group = await phone.glipGroups.startChat(personId);
                          }
                          if (group && group.id !== routerProps.params.groupId) {
                            phone.routerInteraction.push(`/glip/groups/${group.id}`);
                          }
                        }
                      }
                      onViewGroup={
                        (id) => {
                          if (id !== routerProps.params.groupId) {
                            phone.routerInteraction.push(`/glip/groups/${id}`);
                          }
                        }
                      }
                    />
                  )
                }
              />
              <Route
                path="/conferenceCall/dialer/:fromNumber/:fromSessionId"
                component={routerProps => (
                  <ConferenceCallDialerPage
                    params={routerProps.params}
                    onBack={() => {
                      phone.routerInteraction.push('/calls/active');
                    }}
                  />
                )}
              />
              <Route
                path="/conferenceCall/participants"
                component={() => (
                  <ConferenceParticipantPage />
                )}
              />
              <Route
                path="/conferenceCall/callsOnhold/:fromNumber/:fromSessionId"
                component={routerProps => (
                  <CallsOnholdPage
                    params={routerProps.params}
                    onCreateContact={() => { }}
                    onCallsEmpty={() => { }}
                    getAvatarUrl={getAvatarUrl}
                  />
                )}
              />
              <Route
                path="/transfer/:sessionsId"
                component={() => (
                  <TransferPage />
                )}
              />
              <Route
                path="/simplifycallctrl"
                component={() => (
                  <ActiveCallCtrlPage currentLocale={phone.locale.currentLocale} />
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
};
