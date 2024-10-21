import {
  getFilterContacts,
} from '@ringcentral-integration/commons/lib/contactHelper';
import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  computed,
} from '@ringcentral-integration/core';

import requestWithPostMessage from '../../lib/requestWithPostMessage';
import searchContactPhoneNumbers from '../../lib/searchContactPhoneNumbers';
import {
  checkThirdPartySettings,
  formatContacts,
  getImageUri,
  findSettingItem,
} from './helper';

@Module({
  name: 'ThirdPartyService',
  deps: [
    'Auth',
    'Contacts',
    'ContactSources',
    'ContactSearch',
    'ContactMatcher',
    'ContactMatcherOptions',
    'ActivityMatcher',
    'ConversationMatcher',
    'GenericMeeting',
    'SmartNotes',
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
  private _viewMatchedContactPath?: string;
  private _contactMatchTtl?: number;
  private _contactNoMatchTtl?: number;
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
  private _callLogPageInputChangedEventPath?: string;
  private _messagesLogPageInputChangedEventPath?: string;
  private _customizedPageInputChangedEventPath?: string;
  private _doNotContactPath?: string;

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
    this._ignoreModuleReadiness(deps.smartNotes);

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
          serviceDisplayName: service.displayName,
          serviceInfo: service.info || '',
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
          this._contactMatchTtl = service.contactMatchTtl;
          this._contactNoMatchTtl = service.contactNoMatchTtl;
          if (!this.authorizationRegistered || this.authorized) {
            this._registerContactMatch();
            this._deps.contactMatcher.triggerMatch();
          }
        }
        if (service.viewMatchedContactPath) {
          this._viewMatchedContactPath = service.viewMatchedContactPath;
          this._registerViewMatchedContact();
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
        if (service.callLogPageInputChangedEventPath) {
          this._callLogPageInputChangedEventPath = service.callLogPageInputChangedEventPath;
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
        if (service.messagesLogPageInputChangedEventPath) {
          this._messagesLogPageInputChangedEventPath = service.messagesLogPageInputChangedEventPath;
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
        if (service.buttonEventPath) {
          this._registerButtons(service);
        }
        if (service.customizedPageInputChangedEventPath) {
          this._customizedPageInputChangedEventPath = service.customizedPageInputChangedEventPath;
        }
        if (service.doNotContactPath) {
          this._registerDoNotContact(service);
        }
      } else if (e.data.type === 'rc-adapter-update-authorization-status') {
        this._updateAuthorizationStatus(e.data);
      } else if (e.data.type === 'rc-adapter-sync-third-party-contacts') {
        this._triggerSyncContacts();
      } else if (e.data.type === 'rc-adapter-trigger-call-logger-match') {
        this._triggerCallLoggerMatch(e.data.sessionIds);
      } else if (e.data.type === 'rc-adapter-trigger-contact-match') {
        this._triggerContactMatch(e.data.phoneNumbers);
      } else if (e.data.type === 'rc-adapter-update-third-party-settings') {
        this._updateSettings(e.data.settings);
      } else if (e.data.type === 'rc-adapter-update-call-log-page') {
        this._onUpdateCallLogPage(e.data);
      } else if (e.data.type === 'rc-adapter-update-messages-log-page') {
        this._onUpdateMessagesLogPage(e.data);
      } else if (e.data.type === 'rc-adapter-register-customized-page') {
        this._onRegisterCustomizedPage(e.data);
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
    if (this._contactMatchTtl) {
      this._deps.contactMatcherOptions.ttl = this._contactMatchTtl;
    }
    if (this._contactNoMatchTtl) {
      this._deps.contactMatcherOptions.noMatchTtl = this._contactNoMatchTtl;
    }
  }

  _registerViewMatchedContact() {
    this.setViewMatchedContactExternal(true);
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
      ignoreCache: false
    });
  }

  _registerMeetingInvite(service) {
    this._meetingInvitePath = service.meetingInvitePath;
    this._onRegisterMeetingInvite({
      meetingInviteTitle: service.meetingInviteTitle,
    });
    if (service.meetingUpcomingPath) {
      this._meetingUpcomingPath = service.meetingUpcomingPath;
      this._deps.genericMeeting.addThirdPartyProvider({
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
    this._onRegisterSettings({
      settings: checkThirdPartySettings(service.settings),
    });
  }

  _updateSettings(settings = []) {
    this._onRegisterSettings({
      settings: checkThirdPartySettings(settings),
    });
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
      callLoggerAutoSettingReadOnly: service.callLoggerAutoSettingReadOnly,
      callLoggerAutoSettingReadOnlyReason: service.callLoggerAutoSettingReadOnlyReason,
      callLoggerAutoSettingReadOnlyValue: service.callLoggerAutoSettingReadOnlyValue,
      callLoggerAutoLogOnCallSync: service.callLoggerAutoLogOnCallSync, // auto log for calls happened when the app is not opened
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
      messageLoggerAutoSettingReadOnly: service.messageLoggerAutoSettingReadOnly,
      messageLoggerAutoSettingReadOnlyReason: service.messageLoggerAutoSettingReadOnlyReason,
      messageLoggerAutoSettingReadOnlyValue: service.messageLoggerAutoSettingReadOnlyValue,
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
    this._additionalButtonPath = service.buttonEventPath;
    if (!Array.isArray(service.buttons)) {
      return;
    }
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
          result[phoneNumber] = data[phoneNumber].map((contact) => {
            return ({
              ...contact,
              entityType: contact.entityType || contact.type,
            });
          });
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

  async onViewMatchedContactExternal(contact) {
    try {
      await requestWithPostMessage(this._viewMatchedContactPath, contact);
    } catch (e) {
      console.error(e);
    }
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
      if (this._deps.smartNotes.hasPermission) {
        options.aiNote = await this._deps.smartNotes.fetchSmartNoteText(call.telephonySessionId);
      }
      const callItem = { ...call };
      if (call.recording) {
        let contentUri = call.recording.contentUri.split('?')[0];
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

  _triggerContactMatch(phoneNumbers) {
    if (!Array.isArray(phoneNumbers)) {
      return;
    }
    const queries = this._deps.contactMatcher._getQueries();
    const validatedPhoneNumbers = [];
    phoneNumbers.forEach((phoneNumber) => {
      if (queries.indexOf(phoneNumber) > -1) {
        validatedPhoneNumbers.push(phoneNumber);
      }
    });
    if (validatedPhoneNumbers.length === 0) {
      return;
    }
    this._deps.contactMatcher.match({
      queries: validatedPhoneNumbers,
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

  async onUpdateSetting(setting) {
    this._onUpdateSettings({ setting });
    await requestWithPostMessage(this._settingsPath, {
      settings: this.settings,
      setting,
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

  async onClickSettingButton(buttonId) {
    const setting = findSettingItem(this.settings, buttonId);
    if (!setting) {
      console.error('Setting not found');
      return;
    }
    if (!this._additionalButtonPath) {
      console.error('additionalButtonPath is not registered');
      return;
    }
    await requestWithPostMessage(this._additionalButtonPath, {
      button: {
        id: setting.id,
        type: 'setting',
        label: setting.buttonLabel,
        name: setting.name,
      },
    });
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
  displayName = null;

  @state
  serviceInfo = null;

  @state
  _sourceReady = false;

  @action
  _registerService({
    serviceName,
    serviceDisplayName,
    serviceInfo,
  }) {
    this.serviceName = serviceName;
    if (serviceDisplayName) {
      this.displayName = serviceDisplayName;
    }
    this._sourceReady = true;
    this.serviceInfo = serviceInfo;
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

  @state
  callLoggerAutoSettingReadOnly = false;

  @state
  callLoggerAutoSettingReadOnlyReason = '';

  @state
  callLoggerAutoSettingReadOnlyValue: null | boolean = null;

  @state
  callLoggerAutoLogOnCallSync = false;

  @action
  _onRegisterCallLogger({
    callLoggerTitle,
    callLoggerAutoSettingLabel,
    showLogModal,
    callLoggerAutoSettingReadOnly,
    callLoggerAutoSettingReadOnlyReason,
    callLoggerAutoSettingReadOnlyValue,
    callLoggerAutoLogOnCallSync,
  }) {
    if (callLoggerTitle) {
      this.callLoggerTitle = callLoggerTitle;
    }
    if (callLoggerAutoSettingLabel) {
      this.callLoggerAutoSettingLabel = callLoggerAutoSettingLabel;
    }
    this.showLogModal = showLogModal;
    this.callLoggerAutoSettingReadOnly = !!callLoggerAutoSettingReadOnly;
    this.callLoggerAutoSettingReadOnlyReason = callLoggerAutoSettingReadOnlyReason || '';
    if (this.callLoggerAutoSettingReadOnly && typeof callLoggerAutoSettingReadOnlyValue === 'boolean') {
      this.callLoggerAutoSettingReadOnlyValue = callLoggerAutoSettingReadOnlyValue;
    }
    this.callLoggerRegistered = true;
    this.callLoggerAutoLogOnCallSync = !!callLoggerAutoLogOnCallSync;
  }

  @state
  messageLoggerRegistered = false;

  @state
  messageLoggerTitle = null;

  @state
  messageLoggerAutoSettingLabel = null;

  @state
  messageLoggerAutoSettingReadOnly = false;

  @state
  messageLoggerAutoSettingReadOnlyReason = '';

  @state
  messageLoggerAutoSettingReadOnlyValue: null | boolean = null;

  _onRegisterMessageLogger({
    messageLoggerTitle,
    messageLoggerAutoSettingLabel,
    messageLoggerAutoSettingReadOnly,
    messageLoggerAutoSettingReadOnlyReason,
    messageLoggerAutoSettingReadOnlyValue,
  }) {
    if (messageLoggerTitle) {
      this.messageLoggerTitle = messageLoggerTitle;
    }
    if (messageLoggerAutoSettingLabel) {
      this.messageLoggerAutoSettingLabel = messageLoggerAutoSettingLabel;
    }
    this.messageLoggerAutoSettingReadOnly = !!messageLoggerAutoSettingReadOnly;
    this.messageLoggerAutoSettingReadOnlyReason = messageLoggerAutoSettingReadOnlyReason || '';
    if (this.messageLoggerAutoSettingReadOnly && typeof messageLoggerAutoSettingReadOnlyValue === 'boolean') {
      this.messageLoggerAutoSettingReadOnlyValue = messageLoggerAutoSettingReadOnlyValue;
    }
    this.messageLoggerRegistered = true;
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

  @action
  _onUpdateSettings({
    setting,
  }) {
    const settingItem = findSettingItem(this.settings, setting.id);
    if (!settingItem) {
      return;
    }
    Object.keys(setting).forEach((key) => {
      settingItem[key] = setting[key];
    });
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

  @state
  viewMatchedContactExternal = false;

  @action
  setViewMatchedContactExternal(value) {
    this.viewMatchedContactExternal = value;
  }

  @state
  customizedPages = [];

  @action
  updateCustomizedPage(page) {
    if (!page.id) {
      console.error('Customized page id is required');
      return;
    }
    const index = this.customizedPages.findIndex(x => x.id === page.id);
    if (index > -1) {
      Object.keys(page).forEach((key) => {
        if (key === 'id') {
          return;
        }
        this.customizedPages[index][key] = page[key];
      });
    } else {
      this.customizedPages.push(page);
    }
  }

  async onCustomizedLogCallPageInputChanged({ call, formData, keys }) {
    if (!this._callLogPageInputChangedEventPath) {
      return;
    }
    try {
      await requestWithPostMessage(this._callLogPageInputChangedEventPath, {
        call,
        formData,
        keys,
        page: this.customizedLogCallPage,
      });
    } catch (e) {
      console.error(e);
    }
  }

  _onUpdateCallLogPage(data) {
    const newPage = {
      ...data.page,
      id: '$LOG-CALL',
    };
    if (!newPage.uiSchema) {
      newPage.uiSchema = {
        submitButtonOptions: {
          submitText: 'Save',
        },
      };
    } else {
      newPage.uiSchema.submitButtonOptions = {
        submitText: 'Save',
        ...newPage.uiSchema.submitButtonOptions,
      };
    }
    this.updateCustomizedPage(newPage);
  }

  get customizedLogCallPage() {
    return this.customizedPages.find(x => x.id === '$LOG-CALL');
  }

  async onCustomizedLogMessagesPageInputChanged({ conversation, formData, keys }) {
    if (!this._messagesLogPageInputChangedEventPath) {
      return;
    }
    try {
      await requestWithPostMessage(this._messagesLogPageInputChangedEventPath, {
        conversation,
        formData,
        keys,
        page: this.customizedLogMessagesPage,
      });
    } catch (e) {
      console.error(e);
    }
  }

  _onUpdateMessagesLogPage(data) {
    this.updateCustomizedPage({
      ...data.page,
      id: '$LOG-MESSAGES',
    });
  }

  get customizedLogMessagesPage() {
    return this.customizedPages.find(x => x.id === '$LOG-MESSAGES');
  }

  _onRegisterCustomizedPage(data) {
    this.updateCustomizedPage(data.page);
  }

  getCustomizedPage(id) {
    return this.customizedPages.find(x => x.id === id);
  }

  async onCustomizedPageInputChanged({ pageId, formData, keys }) {
    if (!this._customizedPageInputChangedEventPath) {
      return;
    }
    const page = this.getCustomizedPage(pageId);
    if (!page) {
      return;
    }
    try {
      await requestWithPostMessage(this._customizedPageInputChangedEventPath, {
        page,
        formData,
        keys,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async onClickButtonInCustomizedPage(buttonId, type, formData = undefined) {
    const button : {
      id: string;
      type: string;
      formData?: any;
    } = {
      id: buttonId,
      type,
    };
    if (formData) {
      button.formData = formData;
    }
    await requestWithPostMessage(this._additionalButtonPath, {
      button,
    });
  }

  async onClickLinkInAlertDetail(id) {
    if (!this._additionalButtonPath) {
      console.warn('Button event is not registered, ');
      return;
    }
    await requestWithPostMessage(this._additionalButtonPath, {
      button: {
        id,
        type: 'linkInAlertDetail',
      },
    });
  }

  @computed(that => [that.customizedPages])
  get customizedTabs() {
    return this.customizedPages.filter(x => x.type === 'tab').map(tab => ({
      id: tab.id,
      label: tab.title,
      iconUri: tab.iconUri,
      activeIconUri: tab.activeIconUri,
      priority: tab.priority,
      unreadCount: tab.unreadCount,
      path: `/customizedTabs/${tab.id}`,
      hidden: tab.hidden,
    }));
  }

  @state
  doNotContactRegistered = false;

  @action
  _setDoNotContactRegistered(value) {
    this.doNotContactRegistered = value;
  }

  _registerDoNotContact(service) {
    this._doNotContactPath = service.doNotContactPath;
    this._setDoNotContactRegistered(true);
  }

  async checkDoNotContact(contact) {
    if (!this._doNotContactPath) {
      return false;
    }
    const { data } = await requestWithPostMessage(this._doNotContactPath, contact);
    return data;
  }
}
