import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';
import phoneTypes from 'ringcentral-widgets/enums/phoneTypes';

import actionTypes from './actionTypes';
import getReducer from './getReducer';

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
  deps: [
    'Auth',
    'Contacts',
    'ContactSearch',
    'ContactMatcher',
    'ActivityMatcher',
    { dep: 'ThirdPartyContactsOptions', optional: true, spread: true },
  ],
})
export default class ThirdPartyService extends RcModule {
  constructor({
    auth,
    contacts,
    contactSearch,
    contactMatcher,
    activityMatcher,
    recordingLink,
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
    this._contactSearch = contactSearch;
    this._contactMatcher = contactMatcher;
    this._activityMatcher = activityMatcher;
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
        if (service.conferenceInviteTitle && service.conferenceInvitePath) {
          this._registerConferenceInvite(service);
        }
        if (service.meetingInviteTitle && service.meetingInvitePath) {
          this._registerMeetingInvite(service);
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
        if (service.feedbackPath) {
          this._registerFeedback(service);
        }
        if (service.settingsPath && service.settings && service.settings.length > 0) {
          this._registerSettings(service);
        }
      } else if (e.data.type === 'rc-adapter-update-authorization-status') {
        this._updateAuthorizationStatus(e.data);
      }
    });
  }

  _registerContacts(service) {
    this._contactsPath = service.contactsPath;
    this._contactIcon = service.contactIcon;
    this._contacts.addSource(this);
    this.fetchContacts();
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

  _registerConferenceInvite(service) {
    this._conferenceInvitePath = service.conferenceInvitePath;
    this.store.dispatch({
      type: this.actionTypes.registerConferenceInvite,
      conferenceInviteTitle: service.conferenceInviteTitle,
    });
  }

  _registerMeetingInvite(service) {
    this._meetingInvitePath = service.meetingInvitePath;
    this.store.dispatch({
      type: this.actionTypes.registerMeetingInvite,
      meetingInviteTitle: service.meetingInviteTitle,
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
      this._refreshCallLogEntityMatch();
      this._activityMatcher.triggerMatch();
    }
    if (lastAuthorized && !this.authorized) {
      this._unregisterContactSearch();
      this._unregisterContactMatch();
      this._unregisterCallLogEntityMatch();
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
    this._callLoggerRecordingWithToken = !!service.recordingWithToken
    this.store.dispatch({
      type: this.actionTypes.registerCallLogger,
      callLoggerTitle: service.callLoggerTitle,
      showLogModal: !!service.showLogModal,
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

  async _fetchContacts(page = 1) {
    const { data, nextPage, syncTimestamp } =
      await requestWithPostMessage(this._contactsPath, {
        page,
        syncTimestamp: this.contactSyncTimestamp,
      }, 8000);
    if (!Array.isArray(data)) {
      return { contacts: [], syncTimestamp };
    }
    const contacts = formatContacts(data);
    if (!nextPage) {
      return { contacts, syncTimestamp };
    }
    const nextPageData = await this._fetchContacts(nextPage);
    const nextPageContacts = formatContacts(nextPageData.contacts);
    return { contacts: contacts.concat(nextPageContacts), syncTimestamp };
  }

  async fetchContacts() {
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
      this._fetchContactsPromise = this._fetchContacts();
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

  async searchContacts(searchString) {
    try {
      if (!this._contactSearchPath) {
        return [];
      }
      const { data } = await requestWithPostMessage(this._contactSearchPath, { searchString });
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
      const { data } = await requestWithPostMessage(this._contactMatchPath, { phoneNumbers }, 6000);
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

  async matchCallLogEntities(sessionIds) {
    try {
      const result = {};
      if (!this._callLogEntityMatcherPath) {
        return result;
      }
      const { data } = await requestWithPostMessage(this._callLogEntityMatcherPath, { sessionIds });
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

  async inviteConference(conference) {
    try {
      if (!this._conferenceInvitePath) {
        return;
      }
      await requestWithPostMessage(this._conferenceInvitePath, { conference });
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
          recordingLink = `${recordingLink}sandbox/`;
        }
        callItem.recording = {
          ...call.recording,
          link: `${recordingLink}?id=${call.id}&recordingId=${call.recording.id}`,
          contentUri,
        };
      }
      await requestWithPostMessage(this._callLoggerPath, { call: callItem, ...options });
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

  async sync() {
    await this.fetchContacts();
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
}
