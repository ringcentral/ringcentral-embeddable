import {
  getFilterContacts,
} from '@ringcentral-integration/commons/lib/contactHelper';
import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  computed,
  globalStorage,
  watch,
} from '@ringcentral-integration/core';

import requestWithPostMessage from '../../lib/requestWithPostMessage';
import searchContactPhoneNumbers from '../../lib/searchContactPhoneNumbers';
import {
  checkThirdPartySettings,
  formatContacts,
  getImageUri,
  findSettingItem,
  getTranscriptText,
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
    'GlobalStorage',
    'TabManager',
    'CallHistory',
    'CallMonitor',
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
  private _messageLogEntityMatchSourceAdded: boolean;
  private _fetchContactsPromise: Promise<{ contacts: any, syncTimestamp: number }> | null;

  constructor(deps) {
    super({
      deps,
      storageKey: 'thirdPartyService',
      enableGlobalCache: !deps.tabManager.autoMainTab,
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
    this._ignoreModuleReadiness(deps.callHistory);
    this._ignoreModuleReadiness(deps.callMonitor);

    this._searchSourceAdded = false;
    this._contactMatchSourceAdded = false;
    this._callLogEntityMatchSourceAdded = false;
    this._messageLogEntityMatchSourceAdded = false;
    this._recordingLink = deps.thirdPartyContactsOptions.recordingLink;
  }

  onInitOnce() {
    window.addEventListener('message', (e) => {
      if (!e.data) {
        return;
      }
      if (e.data.type === 'rc-adapter-register-third-party-service') {
        const service = e.data.service;
        if (!service || !service.name) {
          return;
        }
        this._registerService({
          serviceName: service.name,
          serviceDisplayName: service.displayName,
          serviceInfo: service.info || '',
        });
        if (service.contactsPath) {
          this._registerContacts(service);
        }
        if (service.contactSearchPath) {
          this._contactSearchPath = service.contactSearchPath;
        }
        if (service.contactMatchPath) {
          this._contactMatchPath = service.contactMatchPath;
          this._contactMatchTtl = service.contactMatchTtl;
          this._contactNoMatchTtl = service.contactNoMatchTtl;
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
        }
        if (service.messageLoggerPath) {
          this._registerMessageLogger(service);
        }
        if (service.messagesLogPageInputChangedEventPath) {
          this._messagesLogPageInputChangedEventPath = service.messagesLogPageInputChangedEventPath;
        }
        if (service.messageLogEntityMatcherPath) {
          this._messageLogEntityMatcherPath = service.messageLogEntityMatcherPath;
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
        const oldAuthorizedStatus = this.authorized;
        if (service.authorizationPath) {
          this._registerAuthorizationButton(service);
        } else {
          // if not authorization service, make it authorized by default
          this.setAuthorized(true, '');
        }
        if (this.authorized && oldAuthorizedStatus === this.authorized) {
          // trigger if authorized status is not changed
          console.log('third party authorized not changed');
          this._onAuthorizedChanged(this.authorized, false);
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
      } else if (e.data.type === 'rc-adapter-register-widget-app') {
        this._onRegisterApp(e.data);
      } else if (e.data.type === 'rc-adapter-unregister-widget-app') {
        this._onUnregisterApp(e.data);
      }
    });
    watch(
      this,
      () => this.authorized,
      (newAuthorized, oldAuthorized) => {
        const isFreshRegister = oldAuthorized === null && newAuthorized;
        this._onAuthorizedChanged(newAuthorized, isFreshRegister);
      },
    )
  }

  _onAuthorizedChanged(authorized, isFreshRegister) {
    if (authorized) {
      console.log('third party authorized');
      this._registerContactSearch();
      this._registerContactMatch();
      this._registerCallLogEntityMatch();
      this._registerMessageLogEntityMatch();
      if (this._deps.tabManager.autoMainTab || this._deps.tabManager.active) {
        this.fetchContacts();
      }
      if (this._deps.tabManager && this._deps.tabManager.active) {
        console.log('third party refreshing matches...');
        if (!isFreshRegister) {
          this._refreshContactMatch();
          this._refreshCallLogEntityMatch();
          this._refreshMessageLogEntityMatch();
        }
        this._deps.contactMatcher.triggerMatch();
        this._deps.activityMatcher.triggerMatch();
        this._deps.conversationMatcher.triggerMatch();
      }
    } else {
      console.log('third party unauthorized');
      this._unregisterContactSearch();
      this._unregisterContactMatch();
      this._unregisterCallLogEntityMatch();
      this._unregisterMessageLogEntityMatch();
    }
  }

  _registerContacts(service) {
    this._contactsPath = service.contactsPath;
    this._contactIcon = service.contactIcon;
    this._deps.contacts.addSource(this);
    if (this._deps.contactSources.indexOf(this) === -1) {
      this._deps.contactSources.push(this);
    }
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
    this._onRegisterAuthorization({
      authorized: service.authorized,
      authorizedTitle: service.authorizedTitle,
      unauthorizedTitle: service.unauthorizedTitle,
      showAuthRedDot: service.showAuthRedDot || false,
      authorizedAccount: service.authorizedAccount,
    });
  }

  async _updateAuthorizationStatus(data) {
    if (!this.authorizationRegistered) {
      return;
    }
    this.setAuthorized(!!data.authorized, data.authorizedAccount);
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
      callLoggerAutoSettingDescription: service.callLoggerAutoSettingDescription,
      callLoggerAutoSettingReadOnly: service.callLoggerAutoSettingReadOnly,
      callLoggerAutoSettingReadOnlyReason: service.callLoggerAutoSettingReadOnlyReason,
      callLoggerAutoSettingReadOnlyValue: service.callLoggerAutoSettingReadOnlyValue,
      callLoggerAutoSettingWarning: service.callLoggerAutoSettingWarning,
      callLoggerAutoLogOnCallSync: service.callLoggerAutoLogOnCallSync, // auto log for calls happened when the app is not opened
      callLoggerHideEditLogButton: service.callLoggerHideEditLogButton,
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
      messageLoggerAutoSettingDescription: service.messageLoggerAutoSettingDescription,
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
      const queryParams = { phoneNumbers } as any;
      if (
        phoneNumbers.length === 1 &&
        phoneNumbers[0] === this._deps.contactMatcher.manualRefreshNumber
      ) {
        queryParams.triggerFrom = 'manual';
        this._deps.contactMatcher.resetManualRefreshNumber();
      }
      const callerIds = {};
      phoneNumbers.forEach((phoneNumber) => {
        const callID = this._deps.callHistory.callerIDMap[phoneNumber];
        if (callID) {
          callerIds[phoneNumber] = callID;
        }
      });
      queryParams.callerIds = callerIds;
      const { data } = await requestWithPostMessage(this._contactMatchPath, queryParams, 30000);
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
      console.error('Match contacts error, please check if contact matcher responds successfully', e);
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
      const activeSessionIds = sessionIds.filter((sessionId) => {
        return !!(this._deps.callMonitor.calls.find((call) => call.sessionId === sessionId));
      });
      const { data } = await requestWithPostMessage(
        this._callLogEntityMatcherPath,
        { sessionIds, activeSessionIds },
        30000
      );
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
      console.error('Match call log error, please check if call log matcher responds successfully', e);
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
      console.error('Message log match error, please check if message match responds successfully', e);
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
      console.error('Log message error, please check if meeting logger responds successfully', e);
    }
  }

  getRecordingLink(recording) {
    if (!recording) {
      return null;
    }
    const isSandbox = recording.uri.indexOf('platform.devtest') > -1;
    let recordingLink = this._recordingLink;
    if (isSandbox) {
      recordingLink = `${recordingLink}sandbox`;
    }
    return `${recordingLink}?media=${encodeURIComponent(recording.contentUri)}`;
  }

  async logCall({ call, ...options }) {
    try {
      if (!this._callLoggerPath) {
        return;
      }
      if (
        this._deps.smartNotes.hasPermission && (
          !!call.internalType || // call log from history
          call.result === 'Disconnected' // active call after call end
        )
      ) {
        options.aiNote = await this._deps.smartNotes.fetchSmartNoteText(call.telephonySessionId);
        const transcript = await this._deps.smartNotes.fetchTranscript(call.telephonySessionId);
        if (transcript) {
          options.transcript = getTranscriptText(transcript, call);
        }
      }
      const callItem = { ...call };
      if (call.recording) {
        let contentUri = call.recording.contentUri.split('?')[0];
        if (this._callLoggerRecordingWithToken) {
          contentUri = `${contentUri}?access_token=${this._deps.auth.accessToken}`;
        }
        callItem.recording = {
          ...call.recording,
          link: this.getRecordingLink(call.recording),
          contentUri,
        };
      }
      await requestWithPostMessage(this._callLoggerPath, { call: callItem, ...options }, 15000);
      if (this._callLogEntityMatchSourceAdded) {
        this._deps.activityMatcher.match({
          queries: [call.sessionId],
          ignoreCache: true
        });
      }
    } catch (e) {
      console.error('Log call error, please check if call logger responds successfully', e);
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
      await requestWithPostMessage(this._messageLoggerPath, { conversation: item, ...options }, 15000);
      if (this._messageLogEntityMatchSourceAdded) {
        this._deps.conversationMatcher.match({
          queries: [item.conversationLogId],
          ignoreCache: true
        });
      }
    } catch (e) {
      console.error('Log message error, please check if message logger responds successfully', e);
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

  @globalStorage
  @state
  serviceName = null;

  @globalStorage
  @state
  displayName = null;

  @globalStorage
  @state
  serviceInfo = null;

  @globalStorage
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

  @globalStorage
  @state
  _activitiesRegistered = false;

  @globalStorage
  @state
  activityName = null;

  @globalStorage
  @state
  activitiesLoaded = false;

  @globalStorage
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

  @globalStorage
  @state
  meetingInviteTitle = null;

  @action
  _onRegisterMeetingInvite({
    meetingInviteTitle,
  }) {
    this.meetingInviteTitle = meetingInviteTitle;
  }

  @globalStorage
  @state
  callLoggerRegistered = false;

  @globalStorage
  @state
  callLoggerTitle = null;

  @globalStorage
  @state
  callLoggerAutoSettingLabel = null;

  @globalStorage
  @state
  callLoggerAutoSettingDescription = '';

  @globalStorage
  @state
  showLogModal = false;

  @globalStorage
  @state
  callLoggerAutoSettingReadOnly = false;

  @globalStorage
  @state
  callLoggerAutoSettingReadOnlyReason = '';

  @globalStorage
  @state
  callLoggerAutoSettingReadOnlyValue: null | boolean = null;

  @globalStorage
  @state
  callLoggerAutoSettingWarning = '';

  @globalStorage
  @state
  callLoggerAutoLogOnCallSync = false;

  @globalStorage
  @state
  callLoggerHideEditLogButton = false;

  @action
  _onRegisterCallLogger({
    callLoggerTitle,
    callLoggerAutoSettingLabel,
    callLoggerAutoSettingDescription,
    showLogModal,
    callLoggerAutoSettingReadOnly,
    callLoggerAutoSettingReadOnlyReason,
    callLoggerAutoSettingReadOnlyValue,
    callLoggerAutoSettingWarning = '',
    callLoggerAutoLogOnCallSync,
    callLoggerHideEditLogButton = false,
  }) {
    if (callLoggerTitle) {
      this.callLoggerTitle = callLoggerTitle;
    }
    if (callLoggerAutoSettingLabel) {
      this.callLoggerAutoSettingLabel = callLoggerAutoSettingLabel;
    }
    if (callLoggerAutoSettingDescription) {
      this.callLoggerAutoSettingDescription = callLoggerAutoSettingDescription;
    }
    this.callLoggerAutoSettingWarning = callLoggerAutoSettingWarning;
    this.showLogModal = showLogModal;
    this.callLoggerAutoSettingReadOnly = !!callLoggerAutoSettingReadOnly;
    this.callLoggerAutoSettingReadOnlyReason = callLoggerAutoSettingReadOnlyReason || '';
    if (this.callLoggerAutoSettingReadOnly && typeof callLoggerAutoSettingReadOnlyValue === 'boolean') {
      this.callLoggerAutoSettingReadOnlyValue = callLoggerAutoSettingReadOnlyValue;
    }
    this.callLoggerRegistered = true;
    this.callLoggerAutoLogOnCallSync = !!callLoggerAutoLogOnCallSync;
    this.callLoggerHideEditLogButton = !!callLoggerHideEditLogButton;
  }

  @globalStorage
  @state
  messageLoggerRegistered = false;

  @globalStorage
  @state
  messageLoggerTitle = null;

  @globalStorage
  @state
  messageLoggerAutoSettingLabel = null;

  @globalStorage
  @state
  messageLoggerAutoSettingDescription = '';

  @globalStorage
  @state
  messageLoggerAutoSettingReadOnly = false;

  @globalStorage
  @state
  messageLoggerAutoSettingReadOnlyReason = '';

  @globalStorage
  @state
  messageLoggerAutoSettingReadOnlyValue: null | boolean = null;

  _onRegisterMessageLogger({
    messageLoggerTitle,
    messageLoggerAutoSettingLabel,
    messageLoggerAutoSettingDescription,
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
    if (messageLoggerAutoSettingDescription) {
      this.messageLoggerAutoSettingDescription = messageLoggerAutoSettingDescription;
    }
    this.messageLoggerAutoSettingReadOnly = !!messageLoggerAutoSettingReadOnly;
    this.messageLoggerAutoSettingReadOnlyReason = messageLoggerAutoSettingReadOnlyReason || '';
    if (this.messageLoggerAutoSettingReadOnly && typeof messageLoggerAutoSettingReadOnlyValue === 'boolean') {
      this.messageLoggerAutoSettingReadOnlyValue = messageLoggerAutoSettingReadOnlyValue;
    }
    this.messageLoggerRegistered = true;
  }

  @globalStorage
  @state
  authorized = null;

  @globalStorage
  @state
  authorizedAccount = null;

  @globalStorage
  @state
  authorizedTitle = null;

  @globalStorage
  @state
  unauthorizedTitle = null;

  @globalStorage
  @state
  _showAuthRedDot = false;

  @action
  _onRegisterAuthorization({
    authorized,
    authorizedTitle,
    unauthorizedTitle,
    showAuthRedDot,
    authorizedAccount,
  }) {
    this.authorized = authorized;
    this.authorizedTitle = authorizedTitle;
    this.unauthorizedTitle = unauthorizedTitle;
    this._showAuthRedDot = showAuthRedDot;
    this.authorizedAccount = authorizedAccount;
  }

  get authorizationLogo() {
    return this._authorizationLogo;
  }

  @action
  setAuthorized(value, account) {
    this.authorized = value;
    this.authorizedAccount = account
  }

  get authorizationRegistered() {
    return this.authorized !== null;
  }

  get showAuthRedDot() {
    return (
      this.authorizationRegistered &&
      this._showAuthRedDot &&
      !this.authorized
    );
  }

  get contactIcon() {
    return this._contactIcon;
  }

  @globalStorage
  @state
  showFeedback = false;

  @action
  _onRegisterFeedback() {
    this.showFeedback = true;
  }

  @globalStorage
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

  @globalStorage
  @state
  meetingLoggerRegistered = false;

  @globalStorage
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

  @globalStorage
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

  @globalStorage
  @state
  viewMatchedContactExternal = false;

  @action
  setViewMatchedContactExternal(value) {
    this.viewMatchedContactExternal = value;
  }

  @globalStorage
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
      darkIconUri: tab.darkIconUri,
      priority: tab.priority,
      unreadCount: tab.unreadCount,
      path: `/customizedTabs/${tab.id}`,
      hidden: tab.hidden,
    }));
  }

  @globalStorage
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

  @globalStorage
  @state
  apps = [];

  @action
  updateApps(app) {
    if (!app.id) {
      console.error('App id is required');
      return;
    }
    const index = this.apps.findIndex(x => x.id === app.id);
    if (index > -1) {
      Object.keys(app).forEach((key) => {
        if (key === 'id') {
          return;
        }
        this.apps[index][key] = app[key];
      });
      return;
    }
    this.apps.push(app);
  }

  @action
  removeApp(appId) {
    this.apps = this.apps.filter(x => x.id !== appId);
  }

  _onRegisterApp(data) {
    this.updateApps(data.app);
  }

  _onUnregisterApp(data) {
    this.removeApp(data.appId);
  }

  async loadAppPage({
      app,
      contact,
      formData = null,
      changedKeys = null,
      type,
      button = null,
    }) {
    if (!app || !app.id) {
      console.error('App id is required');
      return;
    }
    let path;
    const params: {
      contact: any;
      app: any;
      formData?: any;
      changedKeys?: any;
      refresh?: boolean;
      button?: any;
    } = {
      contact,
      app,
    };
    if (type === 'inputChanged') {
      path = app.inputChangedPath;
      params.formData = formData;
      params.changedKeys = changedKeys
    } else if (type === 'submit') {
      path = app.submitPath;
      params.formData = formData;
    } else if (type === 'buttonClick') {
      params.button = button;
      path = app.buttonEventPath;
    } else {
      path = app.pagePath;
      if (type === 'refresh') {
        params.refresh = true;
        params.formData = formData;
      }
    }
    if (!path) {
      return;
    }
    try {
      const { data } = await requestWithPostMessage(
        path,
        params,
      );
      return data;
    } catch (e) {
      console.error('Load app page error', e);
      return null;
    }
  }
}
