import React from 'react';

import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Route, Router } from 'react-router';

import { CallsOnholdPage } from '@ringcentral-integration/widgets/containers/CallsOnholdPage';
import { ConferenceParticipantPage } from '@ringcentral-integration/widgets/containers/ConferenceParticipantPage';

import FlipPage from '@ringcentral-integration/widgets/containers/FlipPage';
import { LoginPage } from '@ringcentral-integration/widgets/containers/LoginPage';

import RegionSettingsPage from '@ringcentral-integration/widgets/containers/RegionSettingsPage';
import { ThemeContainer } from '@ringcentral-integration/widgets/containers/ThemeContainer';

import { PhoneContext } from '@ringcentral-integration/widgets/lib/phoneContext';
import { trackEvents } from '../../modules/Analytics/trackEvents';
import ThirdPartyContactSourceIcon from '../../components/ThirdPartyContactSourceIcon';
import GenericMeetingPage from '../GenericMeetingPage';
import { formatMeetingInfo } from '../../lib/formatMeetingInfo';
import AppView from '../AppView';
import { PhoneTabsContainer } from '../PhoneTabsContainer';
import AudioSettingsPage from '../AudioSettingsPage';
import DialerPage from '../DialerPage';
import { CallCtrlPage } from '../CallCtrlPage';
import { OtherDeviceCallCtrlPage } from '../OtherDeviceCallCtrlPage';
import { ParkPage } from '../ParkPage';
import { CallHUDPage } from '../CallHUDPage';
import TransferPage from '../TransferPage';
import LogCallPage from '../LogCallPage';
import { CallsListPage } from '../CallsListPage';
import ConferenceCallDialerPage from '../ConferenceCallDialerPage';
import ComposeTextPage from '../ComposeTextPage';
import ConversationsPage from '../ConversationsPage';
import ConversationPage from '../ConversationPage';
import LogMessagesPage from '../LogMessagesPage';
import TextSettingPage from '../TextSettingPage';
import MainView from '../MainView';
import MeetingHistoryPage from '../MeetingHistoryPage';
import MeetingHomePage from '../MeetingHomePage';

import MeetingTabContainer from '../MeetingTabContainer';
import RingtoneSettingsPage from '../RingtoneSettingsPage';
import SettingsPage from '../SettingsPage';
import MeetingScheduleButton from '../ThirdPartyMeetingScheduleButton';
import ThirdPartySettingSectionPage from '../ThirdPartySettingSectionPage';
import ThemeSettingPage from '../ThemeSettingPage';
import CallingSettingsPage from '../CallingSettingsPage';
import CallQueueSettingsPage from '../CallQueueSettingsPage';
import ContactsPage from '../ContactsPage';
import ContactDetailsPage from '../ContactDetailsPage';
import CustomizedPage from '../CustomizedPage';

import GlipChatPage from '../GlipChatPage';
import GlipGroupsPage from '../GlipGroupsPage';

import VoicemailDropSettingsPage from '../VoicemailDropSettingsPage';
import PhoneNumberFormatSettingPage from '../PhoneNumberFormatSettingPage';
export default function App({
  phone,
  showCallBadge,
  appVersion,
  fromPopup,
}) {
  const getAvatarUrl = async (contact) => {
    const avatarUrl = await phone.contacts.getProfileImage(contact, true);
    return avatarUrl;
  };
  const ContactSourceIcon = ({ sourceType }) => {
    if (!phone.thirdPartyService.contactIcon) {
      return null;
    }
    if (sourceType !== phone.thirdPartyService.sourceName) {
      return null;
    }
    return (
      <ThirdPartyContactSourceIcon
        iconUri={phone.thirdPartyService.contactIcon}
        sourceName={phone.thirdPartyService.sourceName}
      />
    );
  };

  const getSourceIcons = () => {
    const sourceIcons = {};
    if (phone.brand.brandConfig && phone.brand.brandConfig.assets && phone.brand.brandConfig.assets.icon) {
      sourceIcons.brandIcon = ({ className }) => {
        return (
          <ThirdPartyContactSourceIcon
            iconUri={phone.brand.brandConfig.assets.icon}
            sourceName={phone.brand.brandConfig.name}
            width="14"
            height="14"
            className={className}
          />
        );
      };
    }
    if (!phone.thirdPartyService.sourceName) {
      return sourceIcons;
    }
    const thirdPartyContactUrl = phone.thirdPartyService.contactIcon || phone.thirdPartyService.authorizationLogo;
    if (thirdPartyContactUrl) {
      sourceIcons[phone.thirdPartyService.sourceName] = ({
        className,
      }) => {
        return (
          <ThirdPartyContactSourceIcon
            iconUri={thirdPartyContactUrl}
            sourceName={phone.thirdPartyService.sourceName}
            width="14"
            height="14"
            className={className}
          />
        );
      };
    }
    return sourceIcons;
  }

  const onViewContact = ({ contact, forceOpenInWidget = false }) => {
    const { type, id } = contact;
    if (
      forceOpenInWidget ||
      !phone.thirdPartyService.viewMatchedContactExternal ||
      type !== phone.thirdPartyService.sourceName
    ) {
      phone.sideDrawerUI.gotoContactDetails(contact);
      // phone.routerInteraction.push(`/contacts/${type}/${id}?direct=true`);
      return;
    }
    phone.thirdPartyService.onViewMatchedContactExternal(contact);
  };

  const getPresenceOnContactSearch = (contact) => {
    // show presence in contact search result
    if (contact.type !== 'company') {
      return undefined;
    }
    const companyContact = phone.accountContacts.rcCompanyMapping[contact.contactId];
    if (!companyContact) {
      return undefined;
    }
    return phone.contacts.getPresence(companyContact, false);
  };

  return (
    <PhoneContext.Provider value={phone}>
      <Provider store={phone.store} >
        <ThemeContainer>
          <Router history={phone.routerInteraction.history}>
            <Route
              component={routerProps => (
                <AppView
                  fromPopup={fromPopup}
                  getAvatarUrl={getAvatarUrl}
                  getPresence={getPresenceOnContactSearch}
                  showCallBadge={showCallBadge}
                  contactSourceRenderer={ContactSourceIcon}
                  sourceIcons={getSourceIcons()}
                >
                  {routerProps.children}
                </AppView>
              )} >
              <Route
                path="/"
                component={() => (
                  <LoginPage
                    showSignUp={phone.appFeatures.showSignUpButton}
                    onSignUpButtonClick={() => {
                      const signupUrl = phone.brand.brandConfig.signupUrl;
                      window.open(signupUrl, '_blank');
                    }}
                  />
                )}
              />
              <Route
                path="/"
                component={routerProps => (
                  <MainView navigationPosition="bottom">
                    {routerProps.children}
                  </MainView>
                )} >
                <Route
                  path="/dialer"
                  component={() => (
                    <PhoneTabsContainer>
                      <DialerPage
                        withTabs={true}
                        getPresence={getPresenceOnContactSearch}
                        onEnableAudio={() => {
                          phone.audioSettings.setAutoPlayEnabled(true);
                        }}
                      />
                    </PhoneTabsContainer>
                  )}
                />
                <Route
                  path="/history(/:type)"
                  component={(routerProps) => (
                    <PhoneTabsContainer>
                      <CallsListPage
                        showRingoutCallControl={
                          phone.appFeatures.hasCallControl
                        }
                        showSwitchCall
                        getAvatarUrl={getAvatarUrl}
                        type={routerProps.params.type || 'all'}
                        onViewContact={onViewContact}
                        sourceIcons={getSourceIcons()}
                      />
                    </PhoneTabsContainer>
                  )}
                />
                <Route
                  path="/HUD"
                  component={() => (
                    <PhoneTabsContainer>
                      <CallHUDPage />
                    </PhoneTabsContainer>
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
                      appVersion={appVersion}
                    />
                  )}
                />
                <Route
                  path="/messages(/:type)"
                  component={(routerProps) => {
                    if (routerProps.params.type === 'voicemail') {
                      return (
                        <PhoneTabsContainer>
                          <ConversationsPage
                            showGroupNumberName
                            showContactDisplayPlaceholder={false}
                            onViewContact={onViewContact}
                            type="voiceMail"
                            sourceIcons={getSourceIcons()}
                          />
                        </PhoneTabsContainer>
                      );
                    }
                    return (
                      <ConversationsPage
                        showGroupNumberName
                        showContactDisplayPlaceholder={false}
                        onViewContact={onViewContact}
                        type={routerProps.params.type}
                        sourceIcons={getSourceIcons()}
                      />
                    );
                  }}
                />
                <Route
                  path="/contacts"
                  component={() => (
                    <ContactsPage
                      onVisitPage={async () => { await phone.contacts.sync(); }}
                      onRefresh={async () => { await phone.contacts.sync({ type: 'manual' }); }}
                      sourceNodeRenderer={ContactSourceIcon}
                      onItemSelect={(contact) => {
                        onViewContact({ contact, forceOpenInWidget: true });
                      }}
                    />
                  )}
                />
                <Route
                  path="/meeting/schedule"
                  component={() => {
                    const scheduleFunc = async (meetingInfo) => {
                      const resp = await phone.genericMeeting.schedule(meetingInfo);
                      if (!resp) {
                        return;
                      }
                      const formattedMeetingInfo = formatMeetingInfo(
                        resp, phone.brand, phone.locale.currentLocale, phone.genericMeeting.isRCV
                      );
                      phone.analytics.track(trackEvents.meetingScheduled);
                      if (phone.thirdPartyService.meetingInviteTitle) {
                        await phone.thirdPartyService.inviteMeeting(formattedMeetingInfo);
                        return;
                      }
                      phone.meetingInviteUI.showModal(formattedMeetingInfo);
                    };
                    if (phone.genericMeeting.isRCV) {
                      return (
                        <GenericMeetingPage
                          showHeader={true}
                          schedule={scheduleFunc}
                          scheduleButton={MeetingScheduleButton}
                          showRcvAdminLock
                        />
                      );
                    }
                    return (
                      <GenericMeetingPage
                        useRcmV2
                        schedule={scheduleFunc}
                        scheduleButton={MeetingScheduleButton}
                      />
                    );
                  }}
                />
                <Route
                  path="/meeting/home"
                  component={() => (
                    <MeetingTabContainer>
                      <MeetingHomePage />
                    </MeetingTabContainer>
                  )}
                />
                <Route
                  path="/meeting/history(/:type)"
                  component={(routerProps) => (
                    <MeetingTabContainer>
                      <MeetingHistoryPage
                        onLog={
                          phone.thirdPartyService.meetingLoggerRegistered ? (
                            (meeting) => phone.thirdPartyService.logMeeting(meeting)
                          ) : undefined
                        }
                        logTitle={phone.thirdPartyService.meetingLoggerTitle}
                        type={routerProps.params.type || 'all'}
                      />
                    </MeetingTabContainer>
                  )}
                />
                <Route
                  path="/glip"
                  component={
                    () => (
                      <GlipGroupsPage
                        hiddenCurrentGroup
                      />
                    )
                  }
                />
                <Route
                  path="/customizedTabs/:pageId"
                  component={routerProps => (
                    <CustomizedPage
                      params={routerProps.params}
                    />
                  )}
                />
              </Route>
              <Route
                path="/composeText"
                component={() => <ComposeTextPage supportAttachment />}
              />
              <Route
                path="/conversations/:conversationId"
                component={routerProps => (
                  <ConversationPage
                    params={routerProps.params}
                    showContactDisplayPlaceholder={false}
                    showGroupNumberName
                    supportAttachment
                    onAttachmentDownload={(uri, e) => {
                      phone.thirdPartyService.onClickVCard(uri, e);
                    }}
                    sourceIcons={getSourceIcons()}
                  />
                )}
              />
              <Route
                path="/calls/active(/:sessionId)"
                component={routerProps => (
                  <CallCtrlPage
                    params={routerProps.params}
                    onBackButtonClick={() => {
                      phone.routerInteraction.push('/history');
                    }}
                    showPark
                    getAvatarUrl={getAvatarUrl}
                    showContactDisplayPlaceholder={false}
                    showCallQueueName
                    sourceIcons={getSourceIcons()}
                  />
                )} />
              <Route
                path="/conferenceCall/dialer/:fromNumber/:fromSessionId"
                component={(routerProps) => (
                  <ConferenceCallDialerPage
                    params={routerProps.params}
                    getPresence={getPresenceOnContactSearch}
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
                path="/transfer/:sessionId(/:type)"
                component={routerProps => (
                  <TransferPage
                    params={routerProps.params}
                    enableWarmTransfer={routerProps.params.type !== 'active'}
                    getPresence={getPresenceOnContactSearch}
                  />
                )}
              />
              <Route
                path="/flip/:sessionId"
                component={(routerProps) => (
                  <FlipPage params={routerProps.params} />
                )}
              />
              <Route
                path="/park/:sessionId"
                component={routerProps => (
                  <ParkPage params={routerProps.params} />
                )}
              />
              <Route
                path="/simplifycallctrl/:sessionId"
                component={routerProps => (
                  <OtherDeviceCallCtrlPage params={routerProps.params} />
                )}
              />
              <Route
                path="/contacts/:contactType/:contactId"
                component={routerProps => (
                  <ContactDetailsPage
                    params={routerProps.params}
                    contactId={routerProps.params.contactId}
                    sourceNodeRenderer={ContactSourceIcon}
                    onClickMailTo={
                      (email) => {
                        window.open(`mailto:${email}`);
                      }
                    }
                    navigateTo={(path) => {
                      phone.routerInteraction.push(path);
                    }}
                  />
                )}
              />
              <Route
                path="/glip/groups/:groupId"
                component={
                  routerProps => (
                    <GlipChatPage
                      params={routerProps.params}
                    />
                  )
                }
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
                component={() => (
                  <AudioSettingsPage
                    showCallVolume
                    showDialButtonVolume
                    showRingToneVolume
                  />
                )}
              />
              <Route
                path="/settings/ringtone"
                component={RingtoneSettingsPage}
              />
              <Route
                path="/settings/theme"
                component={ThemeSettingPage}
              />
              <Route
                path="/settings/thirdParty/:sectionId"
                component={routerProps => (
                  <ThirdPartySettingSectionPage
                    params={routerProps.params}
                  />
                )}
              />
              <Route
                path="/settings/callQueuePresence"
                component={CallQueueSettingsPage}
              />
              <Route
                path="/settings/text"
                component={TextSettingPage}
              />
              <Route
                path="/settings/phoneNumberFormat"
                component={PhoneNumberFormatSettingPage}
              />
              <Route
                path="/settings/voicemailDrop"
                component={VoicemailDropSettingsPage}
              />
              <Route
                path="/log/call/:callSessionId"
                component={routerProps => (
                  <LogCallPage
                    params={routerProps.params}
                  />
                )}
              />
              <Route
                path="/log/messages/:conversationId"
                component={routerProps => (
                  <LogMessagesPage
                    params={routerProps.params}
                  />
                )}
              />
              <Route
                path="/customized/:pageId"
                component={routerProps => (
                  <CustomizedPage
                    params={routerProps.params}
                  />
                )}
              />
            </Route>
          </Router>
        </ThemeContainer>
      </Provider>
    </PhoneContext.Provider>
  );
}

App.propTypes = {
  phone: PropTypes.object.isRequired,
  showCallBadge: PropTypes.bool.isRequired,
  appVersion: PropTypes.string,
};
