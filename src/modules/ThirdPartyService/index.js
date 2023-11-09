import { phoneTypes } from '@ringcentral-integration/commons/enums/phoneTypes';
import {
  getFilterContacts,
} from '@ringcentral-integration/commons/lib/contactHelper';
import { Module } from '@ringcentral-integration/commons/lib/di';
import RcModule from '@ringcentral-integration/commons/lib/RcModule';

import requestWithPostMessage from '../../lib/requestWithPostMessage';
import searchContactPhoneNumbers from '../../lib/searchContactPhoneNumbers';
import actionTypes from './actionTypes';
import getReducer from './getReducer';

function formatPhoneType(phoneType) {
  if (!phoneType) {
    return 'unknown';
  }
  if (phoneTypes[phoneType]) {
    return phoneType;
  }
  const cleanType = phoneType.replace('Phone', '');
  if (phoneTypes[cleanType]) {
    return cleanType;
  }
  return 'other';
}

function formatContacts(contacts) {
  return contacts.map((contact) => {
    const phoneNumbers = contact.phoneNumbers && contact.phoneNumbers.map(p => ({
      phoneNumber: p.phoneNumber,
      phoneType: formatPhoneType(p.phoneType),
    }));
    return {
      ...contact,
      phoneNumbers
    };
  });
}

function getImageUri(sourceUri) {
  if (!sourceUri) {
    return null;
  }
  let imageUri = null;
  const sourceUrl = String(sourceUri);
  if (sourceUrl.indexOf('data:image') === 0) {
    imageUri = sourceUrl;
  } else if (sourceUrl.split('?')[0].match(/.(png|jpg|jpeg)$/)){
    imageUri = sourceUrl;
  }
  return imageUri;
}

@Module({
  deps: [
    'Auth',
    'Contacts',
    'ContactSources',
    'ContactSearch',
    'ContactMatcher',
    'ActivityMatcher',
    'ConversationMatcher',
    'GenericMeeting',
    { dep: 'ThirdPartyContactsOptions', optional: true, spread: true },
  ],
})
export default class ThirdPartyService extends RcModule {
  constructor({
    auth,
    contacts,
    contactSources,
    contactSearch,
    contactMatcher,
    activityMatcher,
    conversationMatcher,
    recordingLink,
    genericMeeting,
    ...options
  }) {
    super({
      actionTypes,
      ...options,
    });

    this._reducer = getReducer(this.actionTypes);

    this._initialized = false;

    this._auth = auth;
    this._contacts = contacts;
    this._contactSources = contactSources;
    this._contactSearch = contactSearch;
    this._contactMatcher = contactMatcher;
    this._activityMatcher = activityMatcher;
    this._conversationMatcher = conversationMatcher;
    this._meeting = genericMeeting;
    this._searchSourceAdded = false;
    this._contactMatchSourceAdded = false;
    this._callLogEntityMatchSourceAdded = false;
    this._recordingLink = recordingLink;
  }

  initialize() {
    this._initialized = true;
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
    window.addEventListener('message', (e) => {
      if (!e.data) {
        return;
      }
      if (e.data.type === 'rc-adapter-register-third-party-service' && this.serviceName === null) {
        const service = e.data.service;
        if (!service || !service.name) {
          return;
        }
        this.store.dispatch({
          type: this.actionTypes.register,
          serviceName: service.name,
        });
        if (service.authorizationPath) {
          this._registerAuthorizationButton(service);
        }
        if (service.contactsPath) {
          this._registerContacts(service);
        }
        if (service.contactSearchPath) {
          this._contactSearchPath = service.contactSearchPath;
          if (!this.authorizationRegistered || this.authorized) {
            this._registerContactSearch(service);
          }
        }
        if (service.contactMatchPath) {
          this._contactMatchPath = service.contactMatchPath;
          if (!this.authorizationRegistered || this.authorized) {
            this._registerContactMatch();
            this._contactMatcher.triggerMatch();
          }
        }
        if (service.activitiesPath) {
          this._registerActivities(service);
        }
        if (service.meetingInviteTitle && service.meetingInvitePath) {
          this._registerMeetingInvite(service);
        }
        if (service.meetingLoggerPath) {
          this._registerMeetingLogger(service);
        }
        if (service.callLoggerPath) {
          this._registerCallLogger(service);
        }
        if (service.callLogEntityMatcherPath) {
          this._callLogEntityMatcherPath = service.callLogEntityMatcherPath;
          if (!this.authorizationRegistered || this.authorized) {
            this._registerCallLogEntityMatch(service);
            this._activityMatcher.triggerMatch();
          }
        }
        if (service.messageLoggerPath) {
          this._registerMessageLogger(service);
        }
        if (service.messageLogEntityMatcherPath) {
          this._messageLogEntityMatcherPath = service.messageLogEntityMatcherPath;
          if (!this.authorizationRegistered || this.authorized) {
            this._registerMessageLogEntityMatch(service);
            this._conversationMatcher.triggerMatch();
          }
        }
        if (service.feedbackPath) {
          this._registerFeedback(service);
        }
        if (service.settingsPath && service.settings && service.settings.length > 0) {
          this._registerSettings(service);
        }
        if (service.vcardHandlerPath) {
          this._registerVCardHandler(service);
        }
      } else if (e.data.type === 'rc-adapter-update-authorization-status') {
        this._updateAuthorizationStatus(e.data);
      } else if (e.data.type === 'rc-adapter-sync-third-party-contacts') {
        this._triggerSyncContacts();
      } else if (e.data.type === 'rc-adapter-trigger-call-logger-match') {
        this._triggerCallLoggerMatch(e.data.sessionIds);
      }
    });
  }

  _registerContacts(service) {
    this._contactsPath = service.contactsPath;
    this._contactIcon = service.contactIcon;
    this._contacts.addSource(this);
    if (this._contactSources.indexOf(this) === -1) {
      this._contactSources.push(this);
    }
    this.fetchContacts();
  }

  // contact source interface
  filterContacts(searchFilter) {
    return getFilterContacts(this.contacts, searchFilter);
  }

  _registerContactSearch() {
    if (this._searchSourceAdded || !this._contactSearchPath) {
      return;
    }
    this._contactSearch.addSearchSource({
      sourceName: this.sourceName,
      searchFn: async ({ searchString }) => {
        if (!searchString) {
          return [];
        }
        const contacts = await this.searchContacts(searchString);
        return searchContactPhoneNumbers(contacts, searchString, this.sourceName);
      },
      formatFn: entities => entities,
      readyCheckFn: () => this.sourceReady,
    });
    this._searchSourceAdded = true;
  }

  _unregisterContactSearch() {
    if (!this._searchSourceAdded) {
      return;
    }
    this._contactSearch._searchSources.delete(this.sourceName);
    this._contactSearch._searchSourcesFormat.delete(this.sourceName);
    this._contactSearch._searchSourcesCheck.delete(this.sourceName);
    this._searchSourceAdded = false;
  }

  _registerContactMatch() {
    if (this._contactMatchSourceAdded || !this._contactMatchPath) {
      return;
    }
    this._contactMatcher.addSearchProvider({
      name: this.sourceName,
      searchFn: async ({ queries }) => {
        const result = await this.matchContacts(queries);
        return result;
      },
      readyCheckFn: () => this.sourceReady,
    });
    this._contactMatchSourceAdded = true;
  }

  _unregisterContactMatch() {
    if (!this._contactMatchSourceAdded) {
      return;
    }
    this._contactMatcher._searchProviders.delete(this.sourceName);
    this._contactMatchSourceAdded = false;
  }

  _refreshContactMatch() {
    if (!this._contactMatchSourceAdded) {
      return;
    }
    const queries = this._contactMatcher._getQueries();
    this._contactMatcher.match({
      queries: queries.slice(0, 30),
      ignoreCache: true
    });
  }

  _registerMeetingInvite(service) {
    this._meetingInvitePath = service.meetingInvitePath;
    this.store.dispatch({
      type: this.actionTypes.registerMeetingInvite,
      meetingInviteTitle: service.meetingInviteTitle,
    });
    if (service.meetingUpcomingPath) {
      this._meetingUpcomingPath = service.meetingUpcomingPath;
      this._meeting.addThirdPartyProvider({
        name: service.name,
        fetchUpcomingMeetingList: () => this._fetchUpcomingMeetingList()
      });
    }
  }

  async _fetchUpcomingMeetingList() {
    if (!this._meetingUpcomingPath) {
      return [];
    }
    try {
      const { data } = await requestWithPostMessage(this._meetingUpcomingPath);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  _registerMeetingLogger(service) {
    this._meetingLoggerPath = service.meetingLoggerPath;
    this.store.dispatch({
      type: this.actionTypes.registerMeetingLogger,
      meetingLoggerTitle: service.meetingLoggerTitle,
    });
  }

  _registerFeedback(service) {
    this._feedbackPath = service.feedbackPath;
    this.store.dispatch({
      type: this.actionTypes.registerFeedback,
    });
  }

  _registerSettings(service) {
    this._settingsPath = service.settingsPath;
    const settings = [];
    service.settings.forEach((setting) => {
      if (typeof setting.name === 'string' && typeof setting.value === 'boolean') {
        settings.push({
          name: setting.name,
          value: setting.value,
        });
      }
    });
    this.store.dispatch({
      type: this.actionTypes.registerSettings,
      settings,
    });
  }

  _registerAuthorizationButton(service) {
    this._authorizationPath = service.authorizationPath;
    this._authorizationLogo = getImageUri(service.authorizationLogo);
    this._authorizedAccount = service.authorizedAccount;
    this.store.dispatch({
      type: this.actionTypes.registerAuthorization,
      authorized: service.authorized,
      authorizedTitle: service.authorizedTitle,
      unauthorizedTitle: service.unauthorizedTitle,
      showAuthRedDot: service.showAuthRedDot || false,
    });
  }

  async _updateAuthorizationStatus(data) {
    if (!this.authorizationRegistered) {
      return;
    }
    const lastAuthorized = this.authorized;
    this._authorizedAccount = data.authorizedAccount;
    this.store.dispatch({
      type: this.actionTypes.updateAuthorizationStatus,
      authorized: !!data.authorized,
    });
    if (!lastAuthorized && this.authorized) {
      await this.fetchContacts();
      this._registerContactSearch();
      this._registerContactMatch();
      this._refreshContactMatch();
      this._contactMatcher.triggerMatch();
      this._registerCallLogEntityMatch();
      this._registerMessageLogEntityMatch();
      this._refreshCallLogEntityMatch();
      this._refreshMessageLogEntityMatch();
      this._activityMatcher.triggerMatch();
    }
    if (lastAuthorized && !this.authorized) {
      this._unregisterContactSearch();
      this._unregisterContactMatch();
      this._unregisterCallLogEntityMatch();
      this._unregisterMessageLogEntityMatch();
    }
  }

  _registerActivities(service) {
    this._activitiesPath = service.activitiesPath;
    this._activityPath = service.activityPath;
    this.store.dispatch({
      type: this.actionTypes.registerActivities,
      activityName: service.activityName,
    });
  }

  _registerCallLogger(service) {
    this._callLoggerPath = service.callLoggerPath;
    this._callLoggerRecordingWithToken = !!service.recordingWithToken;
    this.store.dispatch({
      type: this.actionTypes.registerCallLogger,
      callLoggerTitle: service.callLoggerTitle,
      showLogModal: !!service.showLogModal,
      callLoggerAutoSettingLabel: service.callLoggerAutoSettingLabel,
    });
  }

  _registerCallLogEntityMatch() {
    if (this._callLogEntityMatchSourceAdded || !this._callLogEntityMatcherPath) {
      return;
    }
    this._activityMatcher.addSearchProvider({
      name: this.sourceName,
      searchFn: async ({ queries }) => {
        const result = await this.matchCallLogEntities(queries);
        return result;
      },
      readyCheckFn: () => this.sourceReady,
    });
    this._callLogEntityMatchSourceAdded = true;
  }

  _unregisterCallLogEntityMatch() {
    if (!this._callLogEntityMatchSourceAdded) {
      return;
    }
    this._activityMatcher._searchProviders.delete(this.sourceName);
    this._callLogEntityMatchSourceAdded = false;
  }

  _refreshCallLogEntityMatch() {
    if (!this._callLogEntityMatchSourceAdded) {
      return;
    }
    const queries = this._activityMatcher._getQueries();
    this._activityMatcher.match({
      queries: queries.slice(0, 30),
      ignoreCache: true
    });
  }

  _registerMessageLogger(service) {
    this._messageLoggerPath = service.messageLoggerPath;
    this._messageLoggerAttachmentWithToken = !!service.attachmentWithToken
    this.store.dispatch({
      type: this.actionTypes.registerMessageLogger,
      messageLoggerTitle: service.messageLoggerTitle,
      messageLoggerAutoSettingLabel: service.messageLoggerAutoSettingLabel,
    });
  }

  _registerMessageLogEntityMatch() {
    if (this._messageLogEntityMatchSourceAdded || !this._messageLogEntityMatcherPath) {
      return;
    }
    this._conversationMatcher.addSearchProvider({
      name: this.sourceName,
      searchFn: async ({ queries }) => {
        const result = await this.matchMessageLogEntities(queries);
        return result;
      },
      readyCheckFn: () => this.sourceReady,
    });
    this._messageLogEntityMatchSourceAdded = true;
  }

  _unregisterMessageLogEntityMatch() {
    if (!this._messageLogEntityMatchSourceAdded) {
      return;
    }
    this._conversationMatcher._searchProviders.delete(this.sourceName);
    this._messageLogEntityMatchSourceAdded = false;
  }

  _refreshMessageLogEntityMatch() {
    if (!this._messageLogEntityMatchSourceAdded) {
      return;
    }
    const queries = this._conversationMatcher._getQueries();
    this._conversationMatcher.match({
      queries: queries.slice(0, 30),
      ignoreCache: true
    });
  }

  async _fetchContacts({ page = 1, type } = {}) {
    const { data, nextPage, syncTimestamp } =
      await requestWithPostMessage(this._contactsPath, {
        page,
        syncTimestamp: this.contactSyncTimestamp,
        type,
      }, 60000);
    if (!Array.isArray(data)) {
      return { contacts: [], syncTimestamp };
    }
    const contacts = formatContacts(data);
    if (!nextPage) {
      return { contacts, syncTimestamp };
    }
    const nextPageData = await this._fetchContacts({ page: nextPage, type });
    const nextPageContacts = formatContacts(nextPageData.contacts);
    return { contacts: contacts.concat(nextPageContacts), syncTimestamp };
  }

  async fetchContacts(params = {}) {
    try {
      if (!this._contactsPath) {
        return;
      }
      if (this.authorizationRegistered && !this.authorized) {
        return;
      }
      if (this._fetchContactsPromise) {
        await this._fetchContactsPromise;
        return;
      }
      this.store.dispatch({
        type: this.actionTypes.syncContacts,
      });
      this._fetchContactsPromise = this._fetchContacts(params);
      const { contacts, syncTimestamp } = await this._fetchContactsPromise;
      let fetchType;
      if (this.contactSyncTimestamp && syncTimestamp) {
        fetchType = this.actionTypes.syncContactsSuccess;
      } else {
        fetchType = this.actionTypes.fetchContactsSuccess;
      }
      this.store.dispatch({
        type: fetchType,
        contacts,
        syncTimestamp,
      });
    } catch (e) {
      this.store.dispatch({
        type: this.actionTypes.syncContactsError,
      });
      console.error(e);
    }
    this._fetchContactsPromise = null;
  }

  async _triggerSyncContacts() {
    await this.fetchContacts({ type: 'api' });
    await this._refreshContactMatch();
  }

  async searchContacts(searchString) {
    try {
      if (!this._contactSearchPath) {
        return [];
      }
      const { data } = await requestWithPostMessage(
        this._contactSearchPath,
        { searchString },
        30000
      );
      if (!Array.isArray(data)) {
        return [];
      }
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async matchContacts(phoneNumbers) {
    try {
      const result = {};
      if (!this._contactMatchPath) {
        return result;
      }
      const { data } = await requestWithPostMessage(this._contactMatchPath, { phoneNumbers }, 30000);
      if (!data || Object.keys(data).length === 0) {
        return result;
      }
      phoneNumbers.forEach((phoneNumber) => {
        if (data[phoneNumber] && Array.isArray(data[phoneNumber])) {
          result[phoneNumber] = data[phoneNumber];
        } else {
          result[phoneNumber] = [];
        }
      });
      return result;
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  findContact(contactId) {
    return this.contacts.find((x) => x.id === contactId);
  }

  async matchCallLogEntities(sessionIds) {
    try {
      const result = {};
      if (!this._callLogEntityMatcherPath) {
        return result;
      }
      const { data } = await requestWithPostMessage(
        this._callLogEntityMatcherPath,
        { sessionIds },
        30000)
      ;
      if (!data || Object.keys(data).length === 0) {
        return result;
      }
      sessionIds.forEach((sessionId) => {
        if (data[sessionId] && Array.isArray(data[sessionId])) {
          result[sessionId] = data[sessionId];
        } else {
          result[sessionId] = [];
        }
      });
      return result;
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  async matchMessageLogEntities(conversationLogIds) {
    try {
      const result = {};
      if (!this._messageLogEntityMatcherPath) {
        return result;
      }
      const { data } = await requestWithPostMessage(
        this._messageLogEntityMatcherPath, { conversationLogIds }, 30000
      );
      if (!data || Object.keys(data).length === 0) {
        return result;
      }
      conversationLogIds.forEach((conversationLogId) => {
        if (data[conversationLogId] && Array.isArray(data[conversationLogId])) {
          result[conversationLogId] = data[conversationLogId];
        } else {
          result[conversationLogId] = [];
        }
      });
      return result;
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  async fetchActivities(contact) {
    try {
      if (!this._activitiesPath) {
        return;
      }
      this.store.dispatch({
        type: this.actionTypes.loadActivities,
      });
      const response = await requestWithPostMessage(this._activitiesPath, { contact });
      const activities = response.data;
      this.store.dispatch({
        type: this.actionTypes.loadActivitiesSuccess,
        activities,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async openActivity(activity) {
    try {
      if (!this._activityPath) {
        return;
      }
      await requestWithPostMessage(this._activityPath, { activity });
    } catch (e) {
      console.error(e);
    }
  }

  async inviteMeeting(meeting) {
    try {
      if (!this._meetingInvitePath) {
        return;
      }
      await requestWithPostMessage(this._meetingInvitePath, { meeting });
    } catch (e) {
      console.error(e);
    }
  }

  async logMeeting(meeting) {
    try {
      if (!this._meetingLoggerPath) {
        return;
      }
      const formatedMeeting = {
        ...meeting,
      };
      if (meeting.recordings && meeting.recordings.length > 0) {
        const meetingHost = `https://v.ringcentral.com`;
        formatedMeeting.recordings = meeting.recordings.map(({ contentUri, ...recording }) => {
          return {
            ...recording,
            link: `${meetingHost}/welcome/meetings/recordings/recording/${meeting.id}`,
          };
        });
      }
      await requestWithPostMessage(this._meetingLoggerPath, { meeting: formatedMeeting }, 6000);
    } catch (e) {
      console.error(e);
    }
  }

  async logCall({ call, ...options }) {
    try {
      if (!this._callLoggerPath) {
        return;
      }
      const callItem = { ...call };
      if (call.recording) {
        let contentUri = call.recording.contentUri;
        if (this._callLoggerRecordingWithToken) {
          contentUri = `${contentUri}?access_token=${this._auth.accessToken}`;
        }
        const isSandbox = call.recording.uri.indexOf('platform.devtest') > -1;
        let recordingLink = this._recordingLink;
        if (isSandbox) {
          recordingLink = `${recordingLink}sandbox`;
        }
        callItem.recording = {
          ...call.recording,
          link: `${recordingLink}?media=${encodeURIComponent(call.recording.contentUri)}`,
          contentUri,
        };
      }
      await requestWithPostMessage(this._callLoggerPath, { call: callItem, ...options }, 6000);
      if (this._callLogEntityMatchSourceAdded) {
        this._activityMatcher.match({
          queries: [call.sessionId],
          ignoreCache: true
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  _triggerCallLoggerMatch(sessionIds) {
    if (!Array.isArray(sessionIds)) {
      return;
    }
    const queries = this._activityMatcher._getQueries();
    const validatedSessionIds = [];
    sessionIds.forEach((sessionId) => {
      if (queries.indexOf(sessionId) > -1) {
        validatedSessionIds.push(sessionId);
      }
    });
    if (validatedSessionIds.length === 0) {
      return;
    }
    this._activityMatcher.match({
      queries: validatedSessionIds,
      ignoreCache: true,
    });
  }

  async logConversation({ item, ...options }) {
    try {
      if (!this._messageLoggerPath) {
        return;
      }
      if ((item.type === 'VoiceMail' || item.type === 'Fax')) {
        const messages = item.messages && item.messages.map((m) => {
          if (!m.attachments) {
            return m;
          }
          return {
            ...m,
            attachments: m.attachments.map(a => {
              const isSandbox = a.uri.indexOf('media.devtest') > -1;
              let attachmentLink = this._recordingLink;
              if (isSandbox) {
                attachmentLink = `${attachmentLink}sandbox`;
              }
              let uri = a.uri;
              if (this._messageLoggerAttachmentWithToken) {
                uri = `${a.uri}?access_token=${this._auth.accessToken}`;
              }
              return ({
                ...a,
                link: `${attachmentLink}?media=${encodeURIComponent(a.uri)}`,
                uri,
              });
            })
          };
        });
        item.messages = messages;
      }
      await requestWithPostMessage(this._messageLoggerPath, { conversation: item, ...options }, 6000);
      if (this._messageLogEntityMatchSourceAdded) {
        this._conversationMatcher.match({
          queries: [item.conversationLogId],
          ignoreCache: true
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async authorizeService() {
    try {
      if (!this._authorizationPath) {
        return;
      }
      await requestWithPostMessage(this._authorizationPath, {
        authorized: this.authorized,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async onShowFeedback() {
    try {
      if (!this._feedbackPath) {
        return;
      }
      await requestWithPostMessage(this._feedbackPath, {
        show: true,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async onSettingToggle(setting) {
    const newSettng = { ...setting, value: !setting.value };
    this.store.dispatch({
      type: this.actionTypes.updateSetting,
      setting: newSettng,
    });
    await requestWithPostMessage(this._settingsPath, {
      settings: this.settings,
    });
  }

  _registerVCardHandler(service) {
    this._vcardHandlerPath = service.vcardHandlerPath;
  }

  async onClickVCard(vcardUri, event) {
    if (!this._vcardHandlerPath) {
      return;
    }
    if (
      event.currentTarget &&
      event.currentTarget.download &&
      event.currentTarget.download.indexOf('.vcard') > 0
    ) {
      event.preventDefault();
      await requestWithPostMessage(this._vcardHandlerPath, { vcardUri });
    }
  }

  async sync(params) {
    await this.fetchContacts(params);
  }

  get contacts() {
    return this.state.contacts;
  }

  get serviceName() {
    return this.state.serviceName;
  }

  get sourceName() {
    return this.serviceName;
  }

  get status() {
    return this.state.status;
  }

  get sourceReady() {
    if (this.authorizationRegistered && !this.authorized) {
      return false;
    }
    return this.state.sourceReady;
  }

  get activitiesRegistered() {
    if (this.authorizationRegistered && !this.authorized) {
      return false;
    }
    return this.state.activitiesRegistered;
  }

  get activitiesLoaded() {
    return this.state.activitiesLoaded;
  }

  get activities() {
    return this.state.activities;
  }

  get activityName() {
    return this.state.activityName;
  }

  get conferenceInviteTitle() {
    return this.state.conferenceInviteTitle;
  }

  get meetingInviteTitle() {
    return this.state.meetingInviteTitle;
  }

  get callLoggerRegistered() {
    return this.state.callLoggerRegistered;
  }

  get callLoggerTitle() {
    return this.state.callLoggerTitle;
  }

  get callLoggerAutoSettingLabel() {
    return this.state.callLoggerAutoSettingLabel;
  }

  get messageLoggerRegistered() {
    return this.state.messageLoggerRegistered;
  }

  get messageLoggerTitle() {
    return this.state.messageLoggerTitle;
  }

  get messageLoggerAutoSettingLabel() {
    return this.state.messageLoggerAutoSettingLabel;
  }

  get authorizationRegistered() {
    return this.state.authorized !== null;
  }

  get authorized() {
    return this.state.authorized;
  }

  get authorizedTitle() {
    return this.state.authorizedTitle;
  }

  get unauthorizedTitle() {
    return this.state.unauthorizedTitle;
  }

  get authorizationLogo() {
    return this._authorizationLogo;
  }

  get showAuthRedDot() {
    return (
      this.authorizationRegistered &&
      this.state.showAuthRedDot &&
      !this.authorized
    );
  }

  get authorizedAccount() {
    return this._authorizedAccount;
  }

  get showLogModal() {
    return this.state.showLogModal;
  }

  get contactSyncTimestamp() {
    return this.state.contactSyncTimestamp;
  }

  get contactSyncing() {
    return this.state.contactSyncing;
  }

  get contactIcon() {
    return this._contactIcon;
  }

  get showFeedback() {
    return this.state.showFeedback;
  }

  get settings() {
    return this.state.settings;
  }

  get meetingLoggerRegistered() {
    return this.state.meetingLoggerRegistered;
  }

  get meetingLoggerTitle() {
    return this.state.meetingLoggerTitle;
  }
}
