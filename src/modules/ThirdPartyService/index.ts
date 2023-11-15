import { phoneTypes } from '@ringcentral-integration/commons/enums/phoneTypes';
import {
  getFilterContacts,
} from '@ringcentral-integration/commons/lib/contactHelper';
import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
} from '@ringcentral-integration/core';

import requestWithPostMessage from '../../lib/requestWithPostMessage';
import searchContactPhoneNumbers from '../../lib/searchContactPhoneNumbers';

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
  name: 'ThirdPartyService',
  deps: [
    'Auth',
    'Contacts',
    'ContactSources',
    'ContactSearch',
    'ContactMatcher',
    'ActivityMatcher',
    'ConversationMatcher',
    'GenericMeeting',
    { dep: 'ThirdPartyContactsOptions', optional: true },
  ],
})
export default class ThirdPartyService extends RcModuleV2 {
  private _searchSourceAdded: boolean;
  private _contactMatchSourceAdded: boolean;
  private _callLogEntityMatchSourceAdded: boolean;
  private _contactsPath?: string;
  private _contactSearchPath?: string;
  private _contactMatchPath?: string;
  private _activitiesPath?: string;
  private _activityPath?: string;
  private _meetingInvitePath?: string;
  private _meetingUpcomingPath?: string;
  private _meetingLoggerPath?: string;
  private _callLoggerPath?: string;
  private _callLogEntityMatcherPath?: string;
  private _messageLoggerPath?: string;
  private _messageLogEntityMatcherPath?: string;
  private _feedbackPath?: string;
  private _settingsPath?: string;
  private _authorizationPath?: string;
  private _authorizationLogo?: string;
  private _authorizedAccount?: string;
  private _contactIcon?: string;
  private _recordingLink?: string;
  private _callLoggerRecordingWithToken?: boolean;
  private _messageLoggerAttachmentWithToken?: boolean;
  private _additionalButtonPath?: string;
  private _vcardHandlerPath?: string;

  constructor(deps) {
    super({
      deps,
      storageKey: 'thirdPartyService',
      enableGlobalCache: false,
    });

    this._ignoreModuleReadiness(deps.auth);
    this._ignoreModuleReadiness(deps.contacts);
    this._ignoreModuleReadiness(deps.contactSources);
    this._ignoreModuleReadiness(deps.contactSearch);
    this._ignoreModuleReadiness(deps.contactMatcher);
    this._ignoreModuleReadiness(deps.activityMatcher);
    this._ignoreModuleReadiness(deps.conversationMatcher);
    this._ignoreModuleReadiness(deps.genericMeeting);

    this._searchSourceAdded = false;
    this._contactMatchSourceAdded = false;
    this._callLogEntityMatchSourceAdded = false;
    this._recordingLink = deps.thirdPartyContactsOptions.recordingLink;
  }

  onInitOnce() {
    window.addEventListener('message', (e) => {
      if (!e.data) {
        return;
      }
      if (e.data.type === 'rc-adapter-register-third-party-service' && this.serviceName === null) {
        const service = e.data.service;
        if (!service || !service.name) {
          return;
        }
        this._registerService({
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
            this._deps.contactMatcher.triggerMatch();
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
            this._deps.activityMatcher.triggerMatch();
          }
        }
        if (service.messageLoggerPath) {
          this._registerMessageLogger(service);
        }
        if (service.messageLogEntityMatcherPath) {
          this._messageLogEntityMatcherPath = service.messageLogEntityMatcherPath;
          if (!this.authorizationRegistered || this.authorized) {
            this._registerMessageLogEntityMatch(service);
            this._deps.conversationMatcher.triggerMatch();
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
        if (service.buttons) {
          this._registerButtons(service);
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
    this._deps.contacts.addSource(this);
    if (this._deps.contactSources.indexOf(this) === -1) {
      this._deps.contactSources.push(this);
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
    this._deps.contactSearch.addSearchSource({
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
    this._deps.contactSearch._searchSources.delete(this.sourceName);
    this._deps.contactSearch._searchSourcesFormat.delete(this.sourceName);
    this._deps.contactSearch._searchSourcesCheck.delete(this.sourceName);
    this._searchSourceAdded = false;
  }

  _registerContactMatch() {
    if (this._contactMatchSourceAdded || !this._contactMatchPath) {
      return;
    }
    this._deps.contactMatcher.addSearchProvider({
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
    this._deps.contactMatcher._searchProviders.delete(this.sourceName);
    this._contactMatchSourceAdded = false;
  }

  _refreshContactMatch() {
    if (!this._contactMatchSourceAdded) {
      return;
    }
    const queries = this._deps.contactMatcher._getQueries();
    this._deps.contactMatcher.match({
      queries: queries.slice(0, 30),
      ignoreCache: true
    });
  }

  _registerMeetingInvite(service) {
    this._meetingInvitePath = service.meetingInvitePath;
    this._onRegisterMeetingInvite({
      meetingInviteTitle: service.meetingInviteTitle,
    });
    if (service.meetingUpcomingPath) {
      this._meetingUpcomingPath = service.meetingUpcomingPath;
      this._deps.meeting.addThirdPartyProvider({
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
    this._onRegisterMeetingLogger({
      meetingLoggerTitle: service.meetingLoggerTitle,
    });
  }

  _registerFeedback(service) {
    this._feedbackPath = service.feedbackPath;
    this._onRegisterFeedback();
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
    this._onRegisterSettings({ settings });
  }

  _registerAuthorizationButton(service) {
    this._authorizationPath = service.authorizationPath;
    this._authorizationLogo = getImageUri(service.authorizationLogo);
    this._authorizedAccount = service.authorizedAccount;
    this._onRegisterAuthorization({
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
    this.setAuthorized(!!data.authorized)
    if (!lastAuthorized && this.authorized) {
      await this.fetchContacts();
      this._registerContactSearch();
      this._registerContactMatch();
      this._refreshContactMatch();
      this._deps.contactMatcher.triggerMatch();
      this._registerCallLogEntityMatch();
      this._registerMessageLogEntityMatch();
      this._refreshCallLogEntityMatch();
      this._refreshMessageLogEntityMatch();
      this._deps.activityMatcher.triggerMatch();
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
    this._onRegisterActivities({
      activityName: service.activityName,
    });
  }

  _registerCallLogger(service) {
    this._callLoggerPath = service.callLoggerPath;
    this._callLoggerRecordingWithToken = !!service.recordingWithToken;
    this._onRegisterCallLogger({
      callLoggerTitle: service.callLoggerTitle,
      showLogModal: !!service.showLogModal,
      callLoggerAutoSettingLabel: service.callLoggerAutoSettingLabel,
    });
  }

  _registerCallLogEntityMatch() {
    if (this._callLogEntityMatchSourceAdded || !this._callLogEntityMatcherPath) {
      return;
    }
    this._deps.activityMatcher.addSearchProvider({
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
    this._deps.activityMatcher._searchProviders.delete(this.sourceName);
    this._callLogEntityMatchSourceAdded = false;
  }

  _refreshCallLogEntityMatch() {
    if (!this._callLogEntityMatchSourceAdded) {
      return;
    }
    const queries = this._deps.activityMatcher._getQueries();
    this._deps.activityMatcher.match({
      queries: queries.slice(0, 30),
      ignoreCache: true
    });
  }

  _registerMessageLogger(service) {
    this._messageLoggerPath = service.messageLoggerPath;
    this._messageLoggerAttachmentWithToken = !!service.attachmentWithToken
    this._onRegisterMessageLogger({
      messageLoggerTitle: service.messageLoggerTitle,
      messageLoggerAutoSettingLabel: service.messageLoggerAutoSettingLabel,
    });
  }

  _registerMessageLogEntityMatch() {
    if (this._messageLogEntityMatchSourceAdded || !this._messageLogEntityMatcherPath) {
      return;
    }
    this._deps.conversationMatcher.addSearchProvider({
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
    this._deps.conversationMatcher._searchProviders.delete(this.sourceName);
    this._messageLogEntityMatchSourceAdded = false;
  }

  _registerButtons(service) {
    if (!Array.isArray(service.buttons)) {
      return;
    }
    this._additionalButtonPath = service.buttonEventPath;
    const additionalButtons = [];
    service.buttons.forEach((button) => {
      if (
        typeof button.id === 'string' &&
        typeof button.type === 'string' &&
        typeof button.label === 'string' &&
        typeof button.icon === 'string'
      ) {
        additionalButtons.push({
          id: button.id,
          type: button.type,
          icon: button.icon,
          label: button.label,
        });
      }
    });
    if (additionalButtons.length > 0) {
      this._onRegisterAdditionalButtons({
        additionalButtons,
      });
    }
  }

  _refreshMessageLogEntityMatch() {
    if (!this._messageLogEntityMatchSourceAdded) {
      return;
    }
    const queries = this._deps.conversationMatcher._getQueries();
    this._deps.conversationMatcher.match({
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
      this._setContactSyncing(true);
      this._fetchContactsPromise = this._fetchContacts(params);
      const { contacts, syncTimestamp } = await this._fetchContactsPromise;
      if (this.contactSyncTimestamp && syncTimestamp) {
        this._syncContactsSuccess({ contacts, syncTimestamp });
      } else {
        this._fetchContactsSuccess({ contacts, syncTimestamp });
      }
    } catch (e) {
      this._setContactSyncing(false);
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
      this._onLoadActivities();
      const response = await requestWithPostMessage(this._activitiesPath, { contact });
      const activities = response.data;
      this._onLoadActivitiesSuccess({
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
      const formattedMeeting = {
        ...meeting,
      };
      if (meeting.recordings && meeting.recordings.length > 0) {
        const meetingHost = `https://v.ringcentral.com`;
        formattedMeeting.recordings = meeting.recordings.map(({ contentUri, ...recording }) => {
          return {
            ...recording,
            link: `${meetingHost}/welcome/meetings/recordings/recording/${meeting.id}`,
          };
        });
      }
      await requestWithPostMessage(this._meetingLoggerPath, { meeting: formattedMeeting }, 6000);
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
          contentUri = `${contentUri}?access_token=${this._deps.auth.accessToken}`;
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
        this._deps.activityMatcher.match({
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
    const queries = this._deps.activityMatcher._getQueries();
    const validatedSessionIds = [];
    sessionIds.forEach((sessionId) => {
      if (queries.indexOf(sessionId) > -1) {
        validatedSessionIds.push(sessionId);
      }
    });
    if (validatedSessionIds.length === 0) {
      return;
    }
    this._deps.activityMatcher.match({
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
                uri = `${a.uri}?access_token=${this._deps.auth.accessToken}`;
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
        this._deps.conversationMatcher.match({
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
    const newSetting = { ...setting, value: !setting.value };
    this._onUpdateSettings({ setting: newSetting });
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

  async onClickAdditionalButton(buttonId) {
    const button = this.additionalButtons.find(x => x.id === buttonId);
    if (button) {
      await requestWithPostMessage(this._additionalButtonPath, {
        button: {
          id: button.id,
          type: button.type,
          label: button.label,
        },
      });
    }
  }

  async sync(params) {
    await this.fetchContacts(params);
  }

  @state
  contacts = [];

  @state
  contactSyncTimestamp = null;

  @state
  contactSyncing = false;

  @action
  _fetchContactsSuccess({ contacts, syncTimestamp = null }) {
    this.contacts = contacts;
    this.contactSyncTimestamp = syncTimestamp;
    this.contactSyncing = false; 
  }

  @action
  _syncContactsSuccess({ contacts, syncTimestamp = null }) {
    const contactsMap = {};
    let newContacts = [];
    contacts.forEach((c) => {
      contactsMap[c.id] = 1;
    });
    newContacts = this.contacts.filter(c => !contactsMap[c.id]);
    this.contacts = newContacts.concat(contacts.filter(c => !c.deleted));
    this.contactSyncTimestamp = syncTimestamp;
    this.contactSyncing = false;
  }

  @action
  _setContactSyncing(value) {
    this.contactSyncing = value;
  }

  @state
  serviceName = null;

  @state
  _sourceReady = false;

  @action
  _registerService({
    serviceName,
  }) {
    this.serviceName = serviceName;
    this._sourceReady = true;
  }

  get sourceName() {
    return this.serviceName;
  }

  get sourceReady() {
    if (this.authorizationRegistered && !this.authorized) {
      return false;
    }
    return this._sourceReady;
  }

  @state
  _activitiesRegistered = false;

  @state
  activityName = null;

  @state
  activitiesLoaded = false;

  @state
  activities = [];

  @action
  _onRegisterActivities({
    activityName,
  }) {
    this._activitiesRegistered = true;
    if (activityName) {
      this.activityName = activityName;
    }
  }

  @action
  _onLoadActivities() {
    this.activitiesLoaded = false;
    this.activities = [];
  };

  @action
  _onLoadActivitiesSuccess({
    activities
  }) {
    this.activitiesLoaded = true;
    this.activities = activities;
  }

  get activitiesRegistered() {
    if (this.authorizationRegistered && !this.authorized) {
      return false;
    }
    return this._activitiesRegistered;
  }

  @state
  meetingInviteTitle = null;

  @action
  _onRegisterMeetingInvite({
    meetingInviteTitle,
  }) {
    this.meetingInviteTitle = meetingInviteTitle;
  }

  @state
  callLoggerRegistered = false;

  @state
  callLoggerTitle = null;

  @state
  callLoggerAutoSettingLabel = null;

  @state
  showLogModal = false;

  @action
  _onRegisterCallLogger({
    callLoggerTitle,
    callLoggerAutoSettingLabel,
    showLogModal,
  }) {
    this.callLoggerRegistered = true;
    if (callLoggerTitle) {
      this.callLoggerTitle = callLoggerTitle;
    }
    if (callLoggerAutoSettingLabel) {
      this.callLoggerAutoSettingLabel = callLoggerAutoSettingLabel;
    }
    this.showLogModal = showLogModal;
  }

  @state
  messageLoggerRegistered = false;

  @state
  messageLoggerTitle = null;

  @state
  messageLoggerAutoSettingLabel = null;

  _onRegisterMessageLogger({
    messageLoggerTitle,
    messageLoggerAutoSettingLabel,
  }) {
    this.messageLoggerRegistered = true;
    if (messageLoggerTitle) {
      this.messageLoggerTitle = messageLoggerTitle;
    }
    if (messageLoggerAutoSettingLabel) {
      this.messageLoggerAutoSettingLabel = messageLoggerAutoSettingLabel;
    }
  }

  @state
  authorized = null;

  @state
  authorizedTitle = null;

  @state
  unauthorizedTitle = null;

  @state
  _showAuthRedDot = false;

  @action
  _onRegisterAuthorization({
    authorized,
    authorizedTitle,
    unauthorizedTitle,
    showAuthRedDot,
  }) {
    this.authorized = authorized;
    this.authorizedTitle = authorizedTitle;
    this.unauthorizedTitle = unauthorizedTitle;
    this._showAuthRedDot = showAuthRedDot;
  }

  @action
  setAuthorized(value) {
    this.authorized = value;
  }

  get authorizationRegistered() {
    return this.authorized !== null;
  }

  get authorizationLogo() {
    return this._authorizationLogo;
  }

  get showAuthRedDot() {
    return (
      this.authorizationRegistered &&
      this._showAuthRedDot &&
      !this.authorized
    );
  }

  get authorizedAccount() {
    return this._authorizedAccount;
  }

  get contactIcon() {
    return this._contactIcon;
  }

  @state
  showFeedback = false;

  @action
  _onRegisterFeedback() {
    this.showFeedback = true;
  }

  @state
  settings = [];

  @action
  _onRegisterSettings({
    settings,
  }) {
    this.settings = settings;
  }

  _onUpdateSettings({
    setting,
  }) {
    let newSettings = [];
    newSettings = newSettings.concat(this.settings);
    const settingIndex = newSettings.findIndex(s => s.name === setting.name);
    if (settingIndex > -1) {
      newSettings[settingIndex] = setting;
    }
    this.settings = newSettings;
  }

  @state
  meetingLoggerRegistered = false;

  @state
  meetingLoggerTitle = null;

  @action
  _onRegisterMeetingLogger({
    meetingLoggerTitle,
  }) {
    this.meetingLoggerRegistered = true;
    if (meetingLoggerTitle) {
      this.meetingLoggerTitle = meetingLoggerTitle;
    }
  }

  @state
  additionalButtons = [];

  _onRegisterAdditionalButtons({
    additionalButtons,
  }) {
    this.additionalButtons = additionalButtons;
  };

  get additionalSMSToolbarButtons() {
    return this.additionalButtons.filter(x => x.type === 'smsToolbar');
  }
}
