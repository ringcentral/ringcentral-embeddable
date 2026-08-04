import { getFilterContacts } from '@ringcentral-integration/commons/lib/contactHelper';
import { Auth } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  ActivityMatcher,
  Contacts,
  ContactMatcher,
  type ContactMatcherOptions,
  ContactSearch,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';
import {
  ConversationMatcher,
  MessageStore,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  CallHistory,
  CallMonitor,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  computed,
  delegate,
  inject,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  storage,
  StoragePlugin,
  watch,
} from '@ringcentral-integration/next-core';

import requestWithPostMessage from '../../../lib/requestWithPostMessage';

import { SmartNotes } from '../SmartNotes';
import { VoicemailDrop, type VoicemailMessage } from '../VoicemailDrop';
import {
  checkThirdPartySettings,
  findSettingItem,
  formatContacts,
  getImageUri,
  getTranscriptText,
  isSafeAuthorizationLink,
  searchContactPhoneNumbers,
} from './ThirdParty.helper';
import type {
  CallHistoryApi,
  CallMonitorApi,
  ContactMatcherApi,
  ContactSearchApi,
  ContactSource,
  FetchContactsParams,
  FetchContactsResult,
  GenericMeetingWithThirdPartyProvider,
  LoadAppPageParams,
  MatcherApi,
  MessageStoreApi,
  ThirdPartyApp,
  ThirdPartyAuthorizationLink,
  ThirdPartyBanner,
  ThirdPartyButton,
  ThirdPartyCall,
  ThirdPartyContact,
  ThirdPartyConversation,
  ThirdPartyMessage,
  ThirdPartyMessageData,
  ThirdPartyOptions,
  ThirdPartyPage,
  ThirdPartyRecording,
  ThirdPartyServiceRegistration,
  ThirdPartySetting,
  ThirdPartyTabAction,
  ThirdPartyWidgetContact,
  UnknownRecord,
} from './ThirdParty.interface';

const CONTACT_MATCH_REFRESH_LIMIT = 30;
const CONTACT_FETCH_TIMEOUT = 60000;
const MATCH_TIMEOUT = 30000;
const LOG_TIMEOUT = 15000;
const MEETING_LOG_TIMEOUT = 6000;
const DEFAULT_RECORDING_LINK = '';

@injectable({
  name: 'ThirdParty',
})
export class ThirdParty extends RcModule {
  private _searchSourceAdded = false;
  private _contactMatchSourceAdded = false;
  private _contactsSourceAdded = false;
  private _callLogEntityMatchSourceAdded = false;
  private _messageLogEntityMatchSourceAdded = false;
  private readonly _recordingLink: string;
  private _fetchContactsPromise: Promise<FetchContactsResult> | null = null;

  constructor(
    protected _storage: StoragePlugin,
    protected _portManager: PortManager,
    protected _auth: Auth,
    protected _contacts: Contacts,
    @inject('ContactSources')
    protected _contactSources: ContactSource[],
    protected _contactSearch: ContactSearch,
    protected _contactMatcher: ContactMatcher,
    @inject('ContactMatcherOptions')
    protected _contactMatcherOptions: ContactMatcherOptions,
    protected _genericMeeting: GenericMeeting,
    protected _messageStore: MessageStore,
    protected _callHistory: CallHistory,
    protected _callMonitor: CallMonitor,
    protected _voicemailDrop: VoicemailDrop,
    @optional() protected _activityMatcher?: ActivityMatcher,
    @optional() protected _conversationMatcher?: ConversationMatcher,
    @optional() protected _smartNotes?: SmartNotes,
    @optional('ThirdPartyOptions')
    protected _thirdPartyOptions?: ThirdPartyOptions
  ) {
    super();
    if (this._smartNotes) {
      this._ignoreModuleReadiness(this._smartNotes);
    }
    this._storage.enable(this);
    this._recordingLink =
      this._thirdPartyOptions?.recordingLink ?? DEFAULT_RECORDING_LINK;
    this._setupRuntime();
  }

  @state
  private _serviceRegistration: ThirdPartyServiceRegistration | null = null;

  @state
  contacts: ThirdPartyContact[] = [];

  @state
  isContactSourceRegistered = false;

  @state
  contactSyncTimestamp: number | null = null;

  @state
  contactSyncing = false;

  @state
  serviceName: string | null = null;

  @state
  displayName: string | null = null;

  @state
  serviceInfo: string | null = null;

  @state
  private _sourceReady = false;

  @state
  private _activitiesRegistered = false;

  @state
  activityName: string | null = null;

  @state
  activitiesLoaded = false;

  @state
  activities: unknown[] = [];

  @state
  meetingInviteTitle: string | null = null;

  @state
  callLoggerRegistered = false;

  @state
  callLoggerTitle: string | null = null;

  @state
  callLoggerAutoSettingLabel: string | null = null;

  @state
  callLoggerAutoSettingDescription = '';

  @state
  showLogModal = false;

  @state
  callLoggerAutoSettingReadOnly = false;

  @state
  callLoggerAutoSettingReadOnlyReason = '';

  @state
  callLoggerAutoSettingReadOnlyValue: boolean | null = null;

  @state
  callLoggerAutoSettingWarning = '';

  @state
  callLoggerAutoLogOnCallSync = false;

  @state
  callLoggerHideEditLogButton = false;

  @state
  callLoggerAutoLogSettingHidden = false;

  @state
  messageLoggerRegistered = false;

  @state
  messageLoggerTitle: string | null = null;

  @state
  messageLoggerAutoSettingLabel: string | null = null;

  @state
  messageLoggerAutoSettingDescription = '';

  @state
  messageLoggerAutoSettingReadOnly = false;

  @state
  messageLoggerAutoSettingReadOnlyReason = '';

  @state
  messageLoggerAutoSettingReadOnlyValue: boolean | null = null;

  @state
  messageLoggerAutoSettingHidden = false;

  @state
  authorized: boolean | null = null;

  @state
  authorizedAccount: string | null = null;

  @state
  authorizedTitle = '';

  @state
  unauthorizedTitle = '';

  @state
  private _showAuthRedDot = false;

  @state
  showAuthButton = false;

  @state
  licenseStatus = '';

  @state
  licenseStatusColor = '';

  @state
  licenseDescription = '';

  @state
  authorizationLinks: ThirdPartyAuthorizationLink[] = [];

  @state
  showFeedback = false;

  @state
  settings: ThirdPartySetting[] = [];

  @state
  meetingLoggerRegistered = false;

  @state
  meetingLoggerTitle: string | null = null;

  @state
  additionalButtons: ThirdPartyButton[] = [];

  @state
  viewMatchedContactExternal = false;

  @state
  customizedPages: ThirdPartyPage[] = [];

  @state
  doNotContactRegistered = false;

  @state
  apps: ThirdPartyApp[] = [];

  @storage
  @state
  pinAppIds: string[] = [];

  @state
  customizedBanner: ThirdPartyBanner | null = null;

  get sourceName(): string | null {
    return this.serviceName;
  }

  get rawContacts(): ThirdPartyContact[] {
    return this.contacts;
  }

  get sourceReady(): boolean {
    if (this.authorizationRegistered && !this.authorized) {
      return false;
    }
    return this._sourceReady;
  }

  get activitiesRegistered(): boolean {
    if (this.authorizationRegistered && !this.authorized) {
      return false;
    }
    return this._activitiesRegistered;
  }

  get authorizationLogo(): string | null {
    return this._authorizationLogo;
  }

  get authorizationRegistered(): boolean {
    return this.authorized !== null;
  }

  get showAuthRedDot(): boolean {
    return (
      this.authorizationRegistered && this._showAuthRedDot && !this.authorized
    );
  }

  get contactIcon(): string | null {
    return this._contactIcon;
  }

  @computed((that: ThirdParty) => [that.additionalButtons])
  get additionalSMSToolbarButtons(): ThirdPartyButton[] {
    return this.additionalButtons.filter(
      (button) => button.type === 'smsToolbar'
    );
  }

  @computed((that: ThirdParty) => [that.additionalButtons])
  get additionalCallActions(): ThirdPartyButton[] {
    return this.additionalButtons.filter(
      (button) => button.type === 'callAction'
    );
  }

  @computed((that: ThirdParty) => [that.additionalButtons])
  get additionalMessageActions(): ThirdPartyButton[] {
    return this.additionalButtons.filter(
      (button) => button.type === 'messageAction'
    );
  }

  @computed((that: ThirdParty) => [that.additionalButtons])
  get additionalContactActions(): ThirdPartyButton[] {
    return this.additionalButtons.filter(
      (button) => button.type === 'contactAction'
    );
  }

  get customizedLogCallPage(): ThirdPartyPage | undefined {
    return this.customizedPages.find((page) => page.id === '$LOG-CALL');
  }

  get customizedLogMessagesPage(): ThirdPartyPage | undefined {
    return this.customizedPages.find((page) => page.id === '$LOG-MESSAGES');
  }

  private get _contactsPath(): string | undefined {
    return this._serviceRegistration?.contactsPath;
  }

  private get _contactSearchPath(): string | undefined {
    return this._serviceRegistration?.contactSearchPath;
  }

  private get _contactMatchPath(): string | undefined {
    return this._serviceRegistration?.contactMatchPath;
  }

  private get _viewMatchedContactPath(): string | undefined {
    return this._serviceRegistration?.viewMatchedContactPath;
  }

  private get _contactMatchTtl(): number | undefined {
    return this._serviceRegistration?.contactMatchTtl;
  }

  private get _contactNoMatchTtl(): number | undefined {
    return this._serviceRegistration?.contactNoMatchTtl;
  }

  private get _activitiesPath(): string | undefined {
    return this._serviceRegistration?.activitiesPath;
  }

  private get _activityPath(): string | undefined {
    return this._serviceRegistration?.activityPath;
  }

  private get _meetingInvitePath(): string | undefined {
    return this._serviceRegistration?.meetingInvitePath;
  }

  private get _meetingUpcomingPath(): string | undefined {
    return this._serviceRegistration?.meetingUpcomingPath;
  }

  private get _meetingLoggerPath(): string | undefined {
    return this._serviceRegistration?.meetingLoggerPath;
  }

  private get _callLoggerPath(): string | undefined {
    return this._serviceRegistration?.callLoggerPath;
  }

  private get _callLogEntityMatcherPath(): string | undefined {
    return this._serviceRegistration?.callLogEntityMatcherPath;
  }

  private get _messageLoggerPath(): string | undefined {
    return this._serviceRegistration?.messageLoggerPath;
  }

  private get _messageLogEntityMatcherPath(): string | undefined {
    return this._serviceRegistration?.messageLogEntityMatcherPath;
  }

  private get _feedbackPath(): string | undefined {
    return this._serviceRegistration?.feedbackPath;
  }

  private get _settingsPath(): string | undefined {
    return this._serviceRegistration?.settingsPath;
  }

  private get _authorizationPath(): string | undefined {
    return this._serviceRegistration?.authorizationPath;
  }

  private get _authorizationLogo(): string | null {
    return getImageUri(this._serviceRegistration?.authorizationLogo);
  }

  private get _contactIcon(): string | null {
    return this._serviceRegistration?.contactIcon || null;
  }

  private get _callLoggerRecordingWithToken(): boolean {
    return Boolean(this._serviceRegistration?.recordingWithToken);
  }

  private get _messageLoggerAttachmentWithToken(): boolean {
    return Boolean(this._serviceRegistration?.attachmentWithToken);
  }

  private get _additionalButtonPath(): string | undefined {
    return this._serviceRegistration?.buttonEventPath;
  }

  private get _vcardHandlerPath(): string | undefined {
    return this._serviceRegistration?.vcardHandlerPath;
  }

  private get _callLogPageInputChangedEventPath(): string | undefined {
    return this._serviceRegistration?.callLogPageInputChangedEventPath;
  }

  private get _messagesLogPageInputChangedEventPath(): string | undefined {
    return this._serviceRegistration?.messagesLogPageInputChangedEventPath;
  }

  private get _customizedPageInputChangedEventPath(): string | undefined {
    return this._serviceRegistration?.customizedPageInputChangedEventPath;
  }

  private get _doNotContactPath(): string | undefined {
    return this._serviceRegistration?.doNotContactPath;
  }

  private get _voicemailDropFilesPath(): string | undefined {
    return this._serviceRegistration?.voicemailDropFilesPath;
  }

  @computed((that: ThirdParty) => [that.customizedPages])
  get customizedTabs(): Array<{
    id: string;
    label?: string;
    iconUri?: string;
    activeIconUri?: string;
    darkIconUri?: string;
    priority?: number;
    unreadCount?: number;
    path: string;
    hidden?: boolean;
    actions: ThirdPartyTabAction[];
  }> {
    return this.customizedPages
      .filter((page) => page.type === 'tab')
      .map((tab) => ({
        id: tab.id,
        label: tab.title,
        iconUri: tab.iconUri,
        activeIconUri: tab.activeIconUri,
        darkIconUri: tab.darkIconUri,
        priority: tab.priority,
        unreadCount: tab.unreadCount,
        path: `/customizedTabs/${tab.id}`,
        hidden: tab.hidden,
        actions: tab.actions || [],
      }));
  }

  private get _contactSearchApi(): ContactSearchApi {
    return this._contactSearch as unknown as ContactSearchApi;
  }

  private get _contactMatcherApi(): ContactMatcherApi {
    return this._contactMatcher as unknown as ContactMatcherApi;
  }

  private get _activityMatcherApi(): MatcherApi<string> | null {
    return this._activityMatcher as unknown as MatcherApi<string> | null;
  }

  private get _conversationMatcherApi(): MatcherApi<string> | null {
    return this._conversationMatcher as unknown as MatcherApi<string> | null;
  }

  private get _callHistoryApi(): CallHistoryApi {
    return this._callHistory as unknown as CallHistoryApi;
  }

  private get _callMonitorApi(): CallMonitorApi {
    return this._callMonitor as unknown as CallMonitorApi;
  }

  private get _messageStoreApi(): MessageStoreApi {
    return this._messageStore as unknown as MessageStoreApi;
  }

  private _setupRuntime(): void {
    if (this._portManager.shared) {
      this._portManager.onClient(() => this._bindClient());
      this._portManager.onServer(() => this._bindServer());
      return;
    }
    this._bindClient();
    this._bindServer();
  }

  private _bindClient(): () => void {
    if (!globalThis.window) {
      return () => {};
    }
    this._registerVoicemailDropFiles();
    window.addEventListener('message', this._onWindowMessage);
    return () => window.removeEventListener('message', this._onWindowMessage);
  }

  private _bindServer(): () => void {
    const unwatchAuthorized = watch(
      this,
      () => this.authorized,
      (newAuthorized, oldAuthorized) => {
        const isFreshRegister =
          oldAuthorized === null && Boolean(newAuthorized);
        void this._onAuthorizedChanged(Boolean(newAuthorized), isFreshRegister);
      }
    );
    return () => unwatchAuthorized?.();
  }

  private _onWindowMessage = (
    event: MessageEvent<ThirdPartyMessageData>
  ): void => {
    const data = event.data;
    if (!data?.type) {
      return;
    }
    void this._handleWindowMessage(data);
  };

  @delegate('server')
  private async _handleWindowMessage(
    data: ThirdPartyMessageData
  ): Promise<void> {
    switch (data.type) {
      case 'rc-adapter-register-third-party-service':
        this._onRegisterServiceMessage(data.service);
        break;
      case 'rc-adapter-update-authorization-status':
        this._updateAuthorizationStatus(data);
        break;
      case 'rc-adapter-refresh-license-status':
        this._refreshLicenseStatus(data);
        break;
      case 'rc-adapter-sync-third-party-contacts':
        await this._triggerSyncContacts();
        break;
      case 'rc-adapter-trigger-call-logger-match':
        this._triggerCallLoggerMatch(data.sessionIds);
        break;
      case 'rc-adapter-trigger-contact-match':
        this._triggerContactMatch(data.phoneNumbers);
        break;
      case 'rc-adapter-update-third-party-settings':
        this._updateSettings(data.settings);
        break;
      case 'rc-adapter-update-call-log-page':
        this._onUpdateCallLogPage(data);
        break;
      case 'rc-adapter-update-messages-log-page':
        this._onUpdateMessagesLogPage(data);
        break;
      case 'rc-adapter-register-customized-page':
        this._onRegisterCustomizedPage(data);
        break;
      case 'rc-adapter-register-widget-app':
        this._onRegisterApp(data);
        break;
      case 'rc-adapter-unregister-widget-app':
        this._onUnregisterApp(data);
        break;
      case 'rc-adapter-update-customized-banner':
        this._setCustomizedBanner(data.banner);
        break;
      default:
        break;
    }
  }

  private _onRegisterServiceMessage(
    service?: ThirdPartyServiceRegistration
  ): void {
    if (!service?.name) {
      return;
    }
    this._setServiceRegistration(service);
    this._registerService({
      serviceName: service.name,
      serviceDisplayName: service.displayName,
      serviceInfo: service.info || '',
    });
    if (service.contactsPath) {
      this._registerContacts();
    }
    if (service.viewMatchedContactPath) {
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
    if (service.messageLoggerPath) {
      this._registerMessageLogger(service);
    }
    if (service.feedbackPath) {
      this._registerFeedback();
    }
    if (
      service.settingsPath &&
      service.settings &&
      service.settings.length > 0
    ) {
      this._registerSettings(service);
    }
    if (service.buttonEventPath) {
      this._registerButtons(service);
    }
    if (service.doNotContactPath) {
      this._registerDoNotContact();
    }
    if (service.banner) {
      this._setCustomizedBanner(service.banner);
    }
    const oldAuthorizedStatus = this.authorized;
    if (service.authorizationPath) {
      this._registerAuthorizationButton(service);
    } else {
      this.setAuthorized(true, '');
    }
    if (this.authorized && oldAuthorizedStatus === this.authorized) {
      void this._onAuthorizedChanged(this.authorized, false);
    }
  }

  private async _onAuthorizedChanged(
    authorized: boolean,
    isFreshRegister: boolean
  ): Promise<void> {
    if (authorized) {
      this._registerContactSearch();
      this._registerContactMatch();
      this._registerCallLogEntityMatch();
      this._registerMessageLogEntityMatch();
      await this.fetchContacts();
      if (!isFreshRegister) {
        this._refreshContactMatch();
        this._refreshCallLogEntityMatch();
        this._refreshMessageLogEntityMatch();
      }
      this._contactMatcherApi.triggerMatch?.();
      this._activityMatcherApi?.triggerMatch?.();
      this._conversationMatcherApi?.triggerMatch?.();
      return;
    }
    this._unregisterContactSearch();
    this._unregisterContactMatch();
    this._unregisterCallLogEntityMatch();
    this._unregisterMessageLogEntityMatch();
  }

  private _registerContacts(): void {
    if (!this._contactsSourceAdded && this.sourceName) {
      this._contacts.addSource(this as unknown as ContactSource);
      this._contactsSourceAdded = true;
    }
    if (this._contactSources.indexOf(this as unknown as ContactSource) === -1) {
      this._contactSources.push(this as unknown as ContactSource);
    }
    this._setContactSourceRegistered(true);
  }

  filterContacts(searchFilter: unknown): ThirdPartyContact[] {
    return getFilterContacts(this.contacts, searchFilter);
  }

  private _registerContactSearch(): void {
    if (
      this._searchSourceAdded ||
      !this._contactSearchPath ||
      !this.sourceName
    ) {
      return;
    }
    this._contactSearchApi.addSearchSource({
      sourceName: this.sourceName,
      searchFn: async ({ searchString }) => {
        if (!searchString) {
          return [];
        }
        const contacts = await this.searchContacts(searchString);
        return searchContactPhoneNumbers(
          contacts,
          searchString,
          this.sourceName!
        );
      },
      formatFn: (entities) => entities,
      readyCheckFn: () => this.sourceReady,
    });
    this._searchSourceAdded = true;
  }

  private _unregisterContactSearch(): void {
    if (!this._searchSourceAdded || !this.sourceName) {
      return;
    }
    this._contactSearchApi._searchSources.delete(this.sourceName);
    this._contactSearchApi._searchSourcesFormat.delete(this.sourceName);
    this._contactSearchApi._searchSourcesCheck.delete(this.sourceName);
    this._searchSourceAdded = false;
  }

  private _registerContactMatch(): void {
    if (
      this._contactMatchSourceAdded ||
      !this._contactMatchPath ||
      !this.sourceName
    ) {
      return;
    }
    this._contactMatcherApi.addSearchProvider({
      name: this.sourceName,
      searchFn: async ({ queries }) => this.matchContacts(queries),
      readyCheckFn: () => this.sourceReady,
    });
    this._contactMatchSourceAdded = true;
    if (this._contactMatchTtl) {
      this._contactMatcherOptions.ttl = this._contactMatchTtl;
    }
    if (this._contactNoMatchTtl) {
      this._contactMatcherOptions.noMatchTtl = this._contactNoMatchTtl;
    }
  }

  private _registerViewMatchedContact(): void {
    this.setViewMatchedContactExternal(true);
  }

  private _unregisterContactMatch(): void {
    if (!this._contactMatchSourceAdded || !this.sourceName) {
      return;
    }
    this._contactMatcherApi.removeSearchProvider(this.sourceName);
    this._contactMatchSourceAdded = false;
  }

  private _refreshContactMatch(): void {
    if (!this._contactMatchSourceAdded) {
      return;
    }
    const queries = this._contactMatcherApi._getQueries();
    this._contactMatcherApi.match({
      queries: queries.slice(0, CONTACT_MATCH_REFRESH_LIMIT),
      ignoreCache: false,
    });
  }

  private _registerMeetingInvite(service: ThirdPartyServiceRegistration): void {
    this._onRegisterMeetingInvite({
      meetingInviteTitle: service.meetingInviteTitle,
    });
    if (!service.meetingUpcomingPath) {
      return;
    }
    (
      this._genericMeeting as unknown as GenericMeetingWithThirdPartyProvider
    ).addThirdPartyProvider({
      name: service.name,
      fetchUpcomingMeetingList: () => this._fetchUpcomingMeetingList(),
    });
  }

  @delegate('mainClient')
  private async _fetchUpcomingMeetingList(): Promise<unknown[]> {
    if (!this._meetingUpcomingPath) {
      return [];
    }
    try {
      const { data } = await requestWithPostMessage(this._meetingUpcomingPath);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch {
      return [];
    }
  }

  private _registerMeetingLogger(service: ThirdPartyServiceRegistration): void {
    this._onRegisterMeetingLogger({
      meetingLoggerTitle: service.meetingLoggerTitle,
    });
  }

  private _registerFeedback(): void {
    this._onRegisterFeedback();
  }

  private _registerSettings(service: ThirdPartyServiceRegistration): void {
    this._onRegisterSettings({
      settings: checkThirdPartySettings(service.settings),
    });
  }

  private _updateSettings(settings: ThirdPartySetting[] = []): void {
    this._onRegisterSettings({
      settings: checkThirdPartySettings(settings),
    });
  }

  private _registerAuthorizationButton(
    service: ThirdPartyServiceRegistration
  ): void {
    this._onRegisterAuthorization({
      authorized: Boolean(service.authorized),
      authorizedTitle: service.authorizedTitle,
      unauthorizedTitle: service.unauthorizedTitle,
      showAuthRedDot: service.showAuthRedDot || false,
      authorizedAccount: service.authorizedAccount,
      showAuthButton: Boolean(service.authorizationPath),
      licenseStatus: service.licenseStatus,
      licenseStatusColor: service.licenseStatusColor,
      licenseDescription: service.licenseDescription,
      authorizationLinks: service.authorizationLinks || [],
    });
  }

  @delegate('mainClient')
  async onClickLicenseRefreshButton(): Promise<void> {
    if (!this._additionalButtonPath) {
      console.warn('Button event is not registered');
      return;
    }
    await requestWithPostMessage(this._additionalButtonPath, {
      button: {
        id: 'refreshLicense',
        type: 'refreshLicense',
      },
    });
  }

  private _updateAuthorizationStatus(data: ThirdPartyMessageData): void {
    if (!this.authorizationRegistered) {
      return;
    }
    this.setAuthorized(
      Boolean(data.authorized),
      String(data.authorizedAccount || '')
    );
  }

  private _refreshLicenseStatus(data: ThirdPartyMessageData): void {
    this.setLicenseStatus(
      typeof data.licenseStatus === 'string' ? data.licenseStatus : '',
      typeof data.licenseStatusColor === 'string'
        ? data.licenseStatusColor
        : '',
      typeof data.licenseDescription === 'string' ? data.licenseDescription : ''
    );
  }

  private _registerActivities(service: ThirdPartyServiceRegistration): void {
    this._onRegisterActivities({
      activityName: service.activityName,
    });
  }

  private _registerCallLogger(service: ThirdPartyServiceRegistration): void {
    this._onRegisterCallLogger({
      callLoggerTitle: service.callLoggerTitle,
      showLogModal: Boolean(service.showLogModal),
      callLoggerAutoSettingLabel: service.callLoggerAutoSettingLabel,
      callLoggerAutoSettingDescription:
        service.callLoggerAutoSettingDescription,
      callLoggerAutoSettingReadOnly: service.callLoggerAutoSettingReadOnly,
      callLoggerAutoSettingReadOnlyReason:
        service.callLoggerAutoSettingReadOnlyReason,
      callLoggerAutoSettingReadOnlyValue:
        service.callLoggerAutoSettingReadOnlyValue,
      callLoggerAutoLogSettingHidden: service.callLoggerAutoLogSettingHidden,
      callLoggerAutoSettingWarning: service.callLoggerAutoSettingWarning,
      callLoggerAutoLogOnCallSync: service.callLoggerAutoLogOnCallSync,
      callLoggerHideEditLogButton: service.callLoggerHideEditLogButton,
    });
  }

  private _registerCallLogEntityMatch(): void {
    const activityMatcher = this._activityMatcherApi;
    if (
      this._callLogEntityMatchSourceAdded ||
      !this._callLogEntityMatcherPath ||
      !this.sourceName ||
      !activityMatcher
    ) {
      return;
    }
    activityMatcher.addSearchProvider({
      name: this.sourceName,
      searchFn: async ({ queries }) => this.matchCallLogEntities(queries),
      readyCheckFn: () => this.sourceReady,
    });
    this._callLogEntityMatchSourceAdded = true;
  }

  private _unregisterCallLogEntityMatch(): void {
    if (!this._callLogEntityMatchSourceAdded || !this.sourceName) {
      return;
    }
    this._activityMatcherApi?._searchProviders.delete(this.sourceName);
    this._callLogEntityMatchSourceAdded = false;
  }

  private _refreshCallLogEntityMatch(): void {
    const activityMatcher = this._activityMatcherApi;
    if (!this._callLogEntityMatchSourceAdded || !activityMatcher) {
      return;
    }
    const queries = activityMatcher._getQueries();
    activityMatcher.match({
      queries: queries.slice(0, CONTACT_MATCH_REFRESH_LIMIT),
      ignoreCache: true,
    });
  }

  private _registerMessageLogger(service: ThirdPartyServiceRegistration): void {
    this._onRegisterMessageLogger({
      messageLoggerTitle: service.messageLoggerTitle,
      messageLoggerAutoSettingLabel: service.messageLoggerAutoSettingLabel,
      messageLoggerAutoSettingDescription:
        service.messageLoggerAutoSettingDescription,
      messageLoggerAutoSettingReadOnly:
        service.messageLoggerAutoSettingReadOnly,
      messageLoggerAutoSettingReadOnlyReason:
        service.messageLoggerAutoSettingReadOnlyReason,
      messageLoggerAutoSettingReadOnlyValue:
        service.messageLoggerAutoSettingReadOnlyValue,
      messageLoggerAutoSettingHidden: service.messageLoggerAutoSettingHidden,
    });
  }

  private _registerMessageLogEntityMatch(): void {
    const conversationMatcher = this._conversationMatcherApi;
    if (
      this._messageLogEntityMatchSourceAdded ||
      !this._messageLogEntityMatcherPath ||
      !this.sourceName ||
      !conversationMatcher
    ) {
      return;
    }
    conversationMatcher.addSearchProvider({
      name: this.sourceName,
      searchFn: async ({ queries }) => this.matchMessageLogEntities(queries),
      readyCheckFn: () => this.sourceReady,
    });
    this._messageLogEntityMatchSourceAdded = true;
  }

  private _unregisterMessageLogEntityMatch(): void {
    if (!this._messageLogEntityMatchSourceAdded || !this.sourceName) {
      return;
    }
    this._conversationMatcherApi?._searchProviders.delete(this.sourceName);
    this._messageLogEntityMatchSourceAdded = false;
  }

  private _registerButtons(service: ThirdPartyServiceRegistration): void {
    if (!Array.isArray(service.buttons)) {
      return;
    }
    const additionalButtons = service.buttons.reduce<ThirdPartyButton[]>(
      (result, button) => {
        if (
          typeof button.id === 'string' &&
          typeof button.type === 'string' &&
          typeof button.label === 'string' &&
          typeof button.icon === 'string'
        ) {
          result.push({
            id: button.id,
            type: button.type,
            icon: button.icon,
            label: button.label,
          });
        }
        return result;
      },
      []
    );
    if (additionalButtons.length > 0) {
      this._onRegisterAdditionalButtons({ additionalButtons });
    }
  }

  private _refreshMessageLogEntityMatch(): void {
    const conversationMatcher = this._conversationMatcherApi;
    if (!this._messageLogEntityMatchSourceAdded || !conversationMatcher) {
      return;
    }
    const queries = conversationMatcher._getQueries();
    conversationMatcher.match({
      queries: queries.slice(0, CONTACT_MATCH_REFRESH_LIMIT),
      ignoreCache: true,
    });
  }

  @delegate('mainClient')
  private async _fetchContacts({
    page = 1,
    type,
  }: FetchContactsParams = {}): Promise<FetchContactsResult> {
    const { data, nextPage, syncTimestamp } = await requestWithPostMessage(
      this._contactsPath!,
      {
        page,
        syncTimestamp: this.contactSyncTimestamp,
        type,
      },
      CONTACT_FETCH_TIMEOUT
    );
    if (!Array.isArray(data)) {
      return { contacts: [], syncTimestamp };
    }
    const contacts = formatContacts(data);
    if (!nextPage) {
      return { contacts, syncTimestamp };
    }
    const nextPageData = await this._fetchContacts({ page: nextPage, type });
    return {
      contacts: contacts.concat(nextPageData.contacts),
      syncTimestamp,
    };
  }

  @delegate('server')
  async fetchContacts(params: FetchContactsParams = {}): Promise<void> {
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
    } catch (error) {
      this._setContactSyncing(false);
      console.error(error);
    } finally {
      this._fetchContactsPromise = null;
    }
  }

  private async _triggerSyncContacts(): Promise<void> {
    await this.fetchContacts({ type: 'api' });
    this._refreshContactMatch();
  }

  @delegate('mainClient')
  async searchContacts(searchString: string): Promise<ThirdPartyContact[]> {
    try {
      if (!this._contactSearchPath) {
        return [];
      }
      const { data } = await requestWithPostMessage(
        this._contactSearchPath,
        { searchString },
        MATCH_TIMEOUT
      );
      if (!Array.isArray(data)) {
        return [];
      }
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  @delegate('mainClient')
  async matchContacts(
    phoneNumbers: string[]
  ): Promise<Record<string, ThirdPartyContact[]>> {
    try {
      const result: Record<string, ThirdPartyContact[]> = {};
      if (!this._contactMatchPath) {
        return result;
      }
      const queryParams: {
        phoneNumbers: string[];
        triggerFrom?: string;
        callerIds?: Record<string, string>;
      } = { phoneNumbers };
      if (
        phoneNumbers.length === 1 &&
        phoneNumbers[0] === this._contactMatcherApi.manualRefreshNumber
      ) {
        queryParams.triggerFrom = 'manual';
        this._contactMatcherApi.resetManualRefreshNumber();
      }
      const callerIds: Record<string, string> = {};
      const callerIdMap = this._getCallerIdMap();
      phoneNumbers.forEach((phoneNumber) => {
        const callId = callerIdMap[phoneNumber];
        if (callId) {
          callerIds[phoneNumber] = callId;
        }
      });
      queryParams.callerIds = callerIds;
      const { data } = await requestWithPostMessage(
        this._contactMatchPath,
        queryParams,
        MATCH_TIMEOUT
      );
      if (!data || Object.keys(data).length === 0) {
        return result;
      }
      phoneNumbers.forEach((phoneNumber) => {
        if (Array.isArray(data[phoneNumber])) {
          result[phoneNumber] = data[phoneNumber].map(
            (contact: ThirdPartyContact) => ({
              ...contact,
              entityType: contact.entityType || contact.type,
            })
          );
        } else {
          result[phoneNumber] = [];
        }
      });
      return result;
    } catch (error) {
      console.error(
        'Match contacts error, please check if contact matcher responds successfully',
        error
      );
      return {};
    }
  }

  private _getCallerIdMap(): Record<string, string> {
    const callerIdMap: Record<string, string> = {};
    this._callHistoryApi.calls.forEach((call) => {
      const fromNumber = call.from?.phoneNumber || call.from?.extensionNumber;
      if (fromNumber && call.from?.name && !callerIdMap[fromNumber]) {
        callerIdMap[fromNumber] = call.from.name;
      }
      const toNumber = call.to?.phoneNumber || call.to?.extensionNumber;
      if (toNumber && call.to?.name && !callerIdMap[toNumber]) {
        callerIdMap[toNumber] = call.to.name;
      }
    });
    return callerIdMap;
  }

  findContact(contactId: string): ThirdPartyContact | undefined {
    return this.contacts.find((contact) => contact.id === contactId);
  }

  @delegate('mainClient')
  async onViewMatchedContactExternal(
    contact: ThirdPartyContact
  ): Promise<void> {
    try {
      if (!this._viewMatchedContactPath) {
        return;
      }
      await requestWithPostMessage(this._viewMatchedContactPath, contact);
    } catch (error) {
      console.error(error);
    }
  }

  @delegate('mainClient')
  async matchCallLogEntities(
    sessionIds: string[]
  ): Promise<Record<string, unknown[]>> {
    try {
      const result: Record<string, unknown[]> = {};
      if (!this._callLogEntityMatcherPath) {
        return result;
      }
      const activeSessionIds = sessionIds.filter((sessionId) =>
        Boolean(
          this._callMonitorApi.calls?.find(
            (call) => call.sessionId === sessionId
          )
        )
      );
      const { data } = await requestWithPostMessage(
        this._callLogEntityMatcherPath,
        { sessionIds, activeSessionIds },
        MATCH_TIMEOUT
      );
      if (!data || Object.keys(data).length === 0) {
        return result;
      }
      sessionIds.forEach((sessionId) => {
        result[sessionId] = Array.isArray(data[sessionId])
          ? data[sessionId]
          : [];
      });
      return result;
    } catch (error) {
      console.error(
        'Match call log error, please check if call log matcher responds successfully',
        error
      );
      return {};
    }
  }

  @delegate('mainClient')
  async matchMessageLogEntities(
    conversationLogIds: string[]
  ): Promise<Record<string, unknown[]>> {
    try {
      const result: Record<string, unknown[]> = {};
      if (!this._messageLogEntityMatcherPath) {
        return result;
      }
      const { data } = await requestWithPostMessage(
        this._messageLogEntityMatcherPath,
        { conversationLogIds },
        MATCH_TIMEOUT
      );
      if (!data || Object.keys(data).length === 0) {
        return result;
      }
      conversationLogIds.forEach((conversationLogId) => {
        result[conversationLogId] = Array.isArray(data[conversationLogId])
          ? data[conversationLogId]
          : [];
      });
      return result;
    } catch (error) {
      console.error(
        'Message log match error, please check if message match responds successfully',
        error
      );
      return {};
    }
  }

  @delegate('server')
  async fetchActivities(contact: ThirdPartyContact): Promise<void> {
    try {
      if (!this._activitiesPath) {
        return;
      }
      this._onLoadActivities();
      const activities = await this._fetchActivities(contact);
      this._onLoadActivitiesSuccess({
        activities,
      });
    } catch (error) {
      console.error(error);
    }
  }

  @delegate('mainClient')
  private async _fetchActivities(
    contact: ThirdPartyContact
  ): Promise<unknown[]> {
    if (!this._activitiesPath) {
      return [];
    }
    const response = await requestWithPostMessage(this._activitiesPath, {
      contact,
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  @delegate('mainClient')
  async openActivity(activity: unknown): Promise<void> {
    try {
      if (!this._activityPath) {
        return;
      }
      await requestWithPostMessage(this._activityPath, { activity });
    } catch (error) {
      console.error(error);
    }
  }

  @delegate('mainClient')
  async inviteMeeting(meeting: unknown): Promise<void> {
    try {
      if (!this._meetingInvitePath) {
        return;
      }
      await requestWithPostMessage(this._meetingInvitePath, { meeting });
    } catch (error) {
      console.error(error);
    }
  }

  @delegate('mainClient')
  async logMeeting(meeting: UnknownRecord): Promise<void> {
    try {
      if (!this._meetingLoggerPath) {
        return;
      }
      const formattedMeeting: UnknownRecord = { ...meeting };
      const recordings = meeting.recordings;
      if (Array.isArray(recordings) && recordings.length > 0) {
        const meetingHost = 'https://v.ringcentral.com';
        formattedMeeting.recordings = recordings.map(
          ({ contentUri, ...recording }: UnknownRecord) => ({
            ...recording,
            link: `${meetingHost}/welcome/meetings/recordings/recording/${meeting.id}`,
          })
        );
      }
      await requestWithPostMessage(
        this._meetingLoggerPath,
        { meeting: formattedMeeting },
        MEETING_LOG_TIMEOUT
      );
    } catch (error) {
      console.error(
        'Log message error, please check if meeting logger responds successfully',
        error
      );
    }
  }

  getRecordingLink(recording?: ThirdPartyRecording): string | null {
    if (!recording || !this._recordingLink) {
      return null;
    }
    const isSandbox = recording.uri.includes('platform.devtest');
    const recordingLink = isSandbox
      ? `${this._recordingLink}sandbox`
      : this._recordingLink;
    return `${recordingLink}?media=${encodeURIComponent(recording.contentUri)}`;
  }

  getRecordingContentUri(recording: ThirdPartyRecording): string {
    let contentUri = recording.contentUri.split('?')[0];
    if (this._callLoggerRecordingWithToken) {
      contentUri = `${contentUri}?access_token=${this._auth.accessToken}`;
    }
    return contentUri;
  }

  @delegate('server')
  async logCall({
    call,
    ...options
  }: {
    call: ThirdPartyCall;
    [key: string]: unknown;
  }): Promise<void> {
    try {
      const callLoggerPath = this._callLoggerPath;
      if (!callLoggerPath) {
        return;
      }
      if (
        this._smartNotes?.hasPermission &&
        call.telephonySessionId &&
        (Boolean(call.internalType) || call.result === 'Disconnected')
      ) {
        options.aiNote = await this._smartNotes.fetchSmartNoteText?.(
          call.telephonySessionId
        );
        const transcript = await this._smartNotes.fetchTranscript?.(
          call.telephonySessionId
        );
        if (transcript) {
          options.transcript = getTranscriptText(transcript, call);
        }
      }
      const callItem: ThirdPartyCall = { ...call };
      if (call.recording) {
        callItem.recording = {
          ...call.recording,
          link: this.getRecordingLink(call.recording),
          contentUri: this.getRecordingContentUri(call.recording),
        };
      }
      await this._sendCallLog(callLoggerPath, { call: callItem, ...options });
      if (this._callLogEntityMatchSourceAdded && call.sessionId) {
        this._activityMatcherApi?.match({
          queries: [call.sessionId],
          ignoreCache: true,
        });
      }
    } catch (error) {
      console.error(
        'Log call error, please check if call logger responds successfully',
        error
      );
    }
  }

  @delegate('mainClient')
  private async _sendCallLog(
    path: string,
    data: {
      call: ThirdPartyCall;
      [key: string]: unknown;
    }
  ): Promise<void> {
    await requestWithPostMessage(path, data, LOG_TIMEOUT);
  }

  private _triggerCallLoggerMatch(sessionIds?: string[]): void {
    const activityMatcher = this._activityMatcherApi;
    if (!Array.isArray(sessionIds) || !activityMatcher) {
      return;
    }
    const queries = activityMatcher._getQueries();
    const validatedSessionIds = sessionIds.filter(
      (sessionId) => queries.indexOf(sessionId) > -1
    );
    if (validatedSessionIds.length === 0) {
      return;
    }
    activityMatcher.match({
      queries: validatedSessionIds,
      ignoreCache: true,
    });
  }

  private _triggerContactMatch(phoneNumbers?: string[]): void {
    if (!Array.isArray(phoneNumbers)) {
      return;
    }
    const queries = this._contactMatcherApi._getQueries();
    const validatedPhoneNumbers = phoneNumbers.filter(
      (phoneNumber) => queries.indexOf(phoneNumber) > -1
    );
    if (validatedPhoneNumbers.length === 0) {
      return;
    }
    this._contactMatcherApi.match({
      queries: validatedPhoneNumbers,
      ignoreCache: true,
    });
  }

  @delegate('server')
  async logConversation({
    item,
    ...options
  }: {
    item: ThirdPartyConversation;
    [key: string]: unknown;
  }): Promise<void> {
    try {
      const messageLoggerPath = this._messageLoggerPath;
      if (!messageLoggerPath) {
        return;
      }
      if (item.type === 'VoiceMail' || item.type === 'Fax') {
        await this._hydrateConversationAttachments(item);
      }
      await this._sendConversationLog(messageLoggerPath, {
        conversation: item,
        ...options,
      });
      if (this._messageLogEntityMatchSourceAdded && item.conversationLogId) {
        this._conversationMatcherApi?.match({
          queries: [item.conversationLogId],
          ignoreCache: true,
        });
      }
    } catch (error) {
      console.error(
        'Log message error, please check if message logger responds successfully',
        error
      );
    }
  }

  @delegate('mainClient')
  private async _sendConversationLog(
    path: string,
    data: {
      conversation: ThirdPartyConversation;
      [key: string]: unknown;
    }
  ): Promise<void> {
    await requestWithPostMessage(path, data, LOG_TIMEOUT);
  }

  private async _hydrateConversationAttachments(
    item: ThirdPartyConversation
  ): Promise<void> {
    const messageStore = this._messageStoreApi;
    if (item.type === 'VoiceMail') {
      const message = item.messages?.[0];
      if (message) {
        await messageStore.fetchVoicemailTranscription?.(message);
      }
    }
    item.messages = item.messages?.map((message) => {
      if (!message.attachments) {
        return message;
      }
      const transcript =
        item.type === 'VoiceMail' && message.id
          ? messageStore.voicemailTranscriptionMap?.[message.id]
          : null;
      return {
        ...message,
        attachments: message.attachments.map((attachment) => {
          const isSandbox = attachment.uri.includes('media.devtest');
          const attachmentLink = isSandbox
            ? `${this._recordingLink}sandbox`
            : this._recordingLink;
          const uri = this._messageLoggerAttachmentWithToken
            ? `${attachment.uri}?access_token=${this._auth.accessToken}`
            : attachment.uri;
          return {
            ...attachment,
            link: `${attachmentLink}?media=${encodeURIComponent(
              attachment.uri
            )}`,
            uri,
          };
        }),
        transcript: transcript?.text,
      };
    });
  }

  @delegate('mainClient')
  async authorizeService(): Promise<void> {
    try {
      if (!this._authorizationPath) {
        return;
      }
      await requestWithPostMessage(this._authorizationPath, {
        authorized: this.authorized,
      });
    } catch (error) {
      console.error(error);
    }
  }

  @delegate('mainClient')
  async onShowFeedback(): Promise<void> {
    try {
      if (!this._feedbackPath) {
        return;
      }
      await requestWithPostMessage(this._feedbackPath, { show: true });
    } catch (error) {
      console.error(error);
    }
  }

  @delegate('server')
  async onUpdateSetting(setting: ThirdPartySetting): Promise<void> {
    const settingsPath = this._settingsPath;
    if (!settingsPath) {
      return;
    }
    this._onUpdateSettings({ setting });
    await this._sendSettingsUpdate(settingsPath, {
      settings: this.settings,
      setting,
    });
  }

  @delegate('mainClient')
  private async _sendSettingsUpdate(
    path: string,
    data: {
      settings: ThirdPartySetting[];
      setting: ThirdPartySetting;
    }
  ): Promise<void> {
    await requestWithPostMessage(path, data);
  }

  async onClickVCard(
    vcardUri: string,
    event: Pick<MouseEvent, 'currentTarget' | 'preventDefault'>
  ): Promise<void> {
    const vcardHandlerPath = this._vcardHandlerPath;
    if (!vcardHandlerPath) {
      return;
    }
    const currentTarget = event.currentTarget as HTMLAnchorElement | null;
    if (currentTarget?.download && currentTarget.download.includes('.vcard')) {
      event.preventDefault();
      await this._openVCard(vcardHandlerPath, vcardUri);
    }
  }

  @delegate('mainClient')
  private async _openVCard(path: string, vcardUri: string): Promise<void> {
    await requestWithPostMessage(path, { vcardUri });
  }

  @delegate('mainClient')
  async onClickAdditionalButton(
    buttonId: string,
    resource: unknown = undefined
  ): Promise<void> {
    const button = this.additionalButtons.find((item) => item.id === buttonId);
    if (!button || !this._additionalButtonPath) {
      return;
    }
    await requestWithPostMessage(this._additionalButtonPath, {
      button: {
        id: button.id,
        type: button.type,
        label: button.label,
      },
      resource,
    });
  }

  @delegate('mainClient')
  async onClickSettingButton(buttonId: string): Promise<void> {
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

  @delegate('server')
  async sync(params?: FetchContactsParams): Promise<void> {
    await this.fetchContacts(params);
  }

  @delegate('mainClient')
  async onCustomizedLogCallPageInputChanged({
    call,
    formData,
    keys,
  }: {
    call: ThirdPartyCall;
    formData: UnknownRecord;
    keys: string[];
  }): Promise<void> {
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
    } catch (error) {
      console.error(error);
    }
  }

  private _onUpdateCallLogPage(data: ThirdPartyMessageData): void {
    if (!data.page) {
      return;
    }
    const newPage: ThirdPartyPage = {
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

  @delegate('mainClient')
  async onCustomizedLogMessagesPageInputChanged({
    conversation,
    formData,
    keys,
  }: {
    conversation: ThirdPartyConversation;
    formData: UnknownRecord;
    keys: string[];
  }): Promise<void> {
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
    } catch (error) {
      console.error(error);
    }
  }

  private _onUpdateMessagesLogPage(data: ThirdPartyMessageData): void {
    if (!data.page) {
      return;
    }
    this.updateCustomizedPage({
      ...data.page,
      id: '$LOG-MESSAGES',
    });
  }

  private _onRegisterCustomizedPage(data: ThirdPartyMessageData): void {
    if (data.page) {
      this.updateCustomizedPage(data.page);
    }
  }

  getCustomizedPage(id: string): ThirdPartyPage | undefined {
    return this.customizedPages.find((page) => page.id === id);
  }

  @delegate('mainClient')
  async onCustomizedPageInputChanged({
    pageId,
    formData,
    keys,
  }: {
    pageId: string;
    formData: UnknownRecord;
    keys: string[];
  }): Promise<void> {
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
    } catch (error) {
      console.error(error);
    }
  }

  @delegate('mainClient')
  async onClickButtonInCustomizedPage(
    buttonId: string,
    type: string,
    formData: UnknownRecord | undefined = undefined
  ): Promise<void> {
    if (!this._additionalButtonPath) {
      return;
    }
    const button: {
      id: string;
      type: string;
      formData?: UnknownRecord;
    } = {
      id: buttonId,
      type,
    };
    if (formData) {
      button.formData = formData;
    }
    await requestWithPostMessage(this._additionalButtonPath, { button });
  }

  @delegate('mainClient')
  async onClickLinkInAlertDetail(id: string): Promise<void> {
    if (!this._additionalButtonPath) {
      console.warn('Button event is not registered');
      return;
    }
    await requestWithPostMessage(this._additionalButtonPath, {
      button: {
        id,
        type: 'linkInAlertDetail',
      },
    });
  }

  @delegate('mainClient')
  async onClickCustomizedTabAction(
    tabId: string,
    actionId: string
  ): Promise<void> {
    if (!this._additionalButtonPath) {
      return;
    }
    await requestWithPostMessage(this._additionalButtonPath, {
      button: {
        id: actionId,
        type: 'customizedTabAction',
        tabId,
      },
    });
  }

  private _registerDoNotContact(): void {
    this._setDoNotContactRegistered(true);
  }

  @delegate('mainClient')
  async checkDoNotContact(contact: ThirdPartyContact): Promise<boolean> {
    if (!this._doNotContactPath) {
      return false;
    }
    const { data } = await requestWithPostMessage(
      this._doNotContactPath,
      contact
    );
    return Boolean(data);
  }

  private _registerVoicemailDropFiles(): void {
    this._voicemailDrop.setExternalVoicemailFetcher(() =>
      this._fetchVoicemailDropFiles()
    );
  }

  @delegate('mainClient')
  private async _fetchVoicemailDropFiles(): Promise<VoicemailMessage[]> {
    if (!this._voicemailDropFilesPath) {
      return [];
    }
    const { data } = await requestWithPostMessage(this._voicemailDropFilesPath);
    if (!Array.isArray(data)) {
      console.error('Voicemail drop files must be an array');
      return [];
    }
    return data;
  }

  private _onRegisterApp(data: ThirdPartyMessageData): void {
    if (data.app) {
      this.updateApps(data.app);
    }
  }

  private _onUnregisterApp(data: ThirdPartyMessageData): void {
    if (typeof data.appId === 'string') {
      this.removeApp(data.appId);
    }
  }

  @delegate('mainClient')
  async loadAppPage({
    app,
    contact,
    formData = null,
    changedKeys = null,
    type,
    button = null,
    theme = 'light',
  }: LoadAppPageParams): Promise<unknown | null> {
    if (!app?.id) {
      console.error('App id is required');
      return null;
    }
    const params: {
      contact?: ThirdPartyWidgetContact;
      app: ThirdPartyApp;
      formData?: UnknownRecord | null;
      changedKeys?: string[] | null;
      refresh?: boolean;
      button?: Pick<ThirdPartyButton, 'id'> | null;
      theme: string;
    } = {
      contact,
      app,
      theme,
    };
    let path = app.pagePath;
    if (type === 'inputChanged') {
      path = app.inputChangedPath;
      params.formData = formData;
      params.changedKeys = changedKeys;
    } else if (type === 'submit') {
      path = app.submitPath;
      params.formData = formData;
    } else if (type === 'buttonClick') {
      params.button = button;
      params.formData = formData;
      path = app.buttonEventPath;
    } else if (type === 'refresh') {
      params.refresh = true;
      params.formData = formData;
    }
    if (!path) {
      return null;
    }
    try {
      const { data } = await requestWithPostMessage(path, params, LOG_TIMEOUT);
      return data;
    } catch (error) {
      console.error('Load app page error', error);
      return null;
    }
  }

  @delegate('mainClient')
  async onBannerAction(): Promise<void> {
    if (!this._additionalButtonPath) {
      console.warn('Button event path is not registered');
      return;
    }
    if (!this.customizedBanner) {
      console.warn('Banner not found');
      return;
    }
    try {
      await requestWithPostMessage(this._additionalButtonPath, {
        button: {
          id: this.customizedBanner.id,
          type: 'customizedBanner',
          label: this.customizedBanner.action?.label,
        },
      });
    } catch (error) {
      console.error('Banner action error', error);
    }
  }

  @delegate('server')
  async onBannerClose(): Promise<void> {
    const bannerId = this.customizedBanner?.id;
    const additionalButtonPath = this._additionalButtonPath;
    this._setCustomizedBanner(null);
    if (!additionalButtonPath || !bannerId) {
      return;
    }
    try {
      await this._sendBannerClose(additionalButtonPath, bannerId);
    } catch (error) {
      console.error('Banner close error', error);
    }
  }

  @delegate('mainClient')
  private async _sendBannerClose(
    path: string,
    bannerId: string
  ): Promise<void> {
    await requestWithPostMessage(path, {
      button: {
        id: bannerId,
        type: 'customizedBanner',
        dismissed: true,
      },
    });
  }

  @action
  private _setServiceRegistration(
    service: ThirdPartyServiceRegistration
  ): void {
    this._serviceRegistration = {
      ...(this._serviceRegistration ?? {}),
      ...service,
    };
  }

  @action
  private _fetchContactsSuccess({
    contacts,
    syncTimestamp = null,
  }: FetchContactsResult): void {
    this.contacts = contacts;
    this.contactSyncTimestamp = syncTimestamp;
    this.contactSyncing = false;
  }

  @action
  private _syncContactsSuccess({
    contacts,
    syncTimestamp = null,
  }: FetchContactsResult): void {
    const contactsMap: Record<string, boolean> = {};
    contacts.forEach((contact) => {
      contactsMap[contact.id] = true;
    });
    const oldContacts = this.contacts.filter(
      (contact) => !contactsMap[contact.id]
    );
    this.contacts = oldContacts.concat(
      contacts.filter((contact) => !contact.deleted)
    );
    this.contactSyncTimestamp = syncTimestamp;
    this.contactSyncing = false;
  }

  @action
  private _setContactSyncing(value: boolean): void {
    this.contactSyncing = value;
  }

  @action
  private _setContactSourceRegistered(value: boolean): void {
    this.isContactSourceRegistered = value;
  }

  @action
  private _registerService({
    serviceName,
    serviceDisplayName,
    serviceInfo,
  }: {
    serviceName: string;
    serviceDisplayName?: string;
    serviceInfo: string;
  }): void {
    this.serviceName = serviceName;
    if (serviceDisplayName) {
      this.displayName = serviceDisplayName;
    }
    this._sourceReady = true;
    this.serviceInfo = serviceInfo;
  }

  @action
  private _onRegisterActivities({
    activityName,
  }: {
    activityName?: string;
  }): void {
    this._activitiesRegistered = true;
    if (activityName) {
      this.activityName = activityName;
    }
  }

  @action
  private _onLoadActivities(): void {
    this.activitiesLoaded = false;
    this.activities = [];
  }

  @action
  private _onLoadActivitiesSuccess({
    activities,
  }: {
    activities: unknown[];
  }): void {
    this.activitiesLoaded = true;
    this.activities = activities;
  }

  @action
  private _onRegisterMeetingInvite({
    meetingInviteTitle,
  }: {
    meetingInviteTitle?: string;
  }): void {
    this.meetingInviteTitle = meetingInviteTitle || null;
  }

  @action
  private _onRegisterCallLogger({
    callLoggerTitle,
    callLoggerAutoSettingLabel,
    callLoggerAutoSettingDescription,
    showLogModal,
    callLoggerAutoSettingReadOnly,
    callLoggerAutoSettingReadOnlyReason,
    callLoggerAutoSettingReadOnlyValue,
    callLoggerAutoLogSettingHidden = false,
    callLoggerAutoSettingWarning = '',
    callLoggerAutoLogOnCallSync,
    callLoggerHideEditLogButton = false,
  }: {
    callLoggerTitle?: string;
    callLoggerAutoSettingLabel?: string;
    callLoggerAutoSettingDescription?: string;
    showLogModal?: boolean;
    callLoggerAutoSettingReadOnly?: boolean;
    callLoggerAutoSettingReadOnlyReason?: string;
    callLoggerAutoSettingReadOnlyValue?: boolean;
    callLoggerAutoLogSettingHidden?: boolean;
    callLoggerAutoSettingWarning?: string;
    callLoggerAutoLogOnCallSync?: boolean;
    callLoggerHideEditLogButton?: boolean;
  }): void {
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
    this.showLogModal = Boolean(showLogModal);
    this.callLoggerAutoSettingReadOnly = Boolean(callLoggerAutoSettingReadOnly);
    this.callLoggerAutoSettingReadOnlyReason =
      callLoggerAutoSettingReadOnlyReason || '';
    if (
      this.callLoggerAutoSettingReadOnly &&
      typeof callLoggerAutoSettingReadOnlyValue === 'boolean'
    ) {
      this.callLoggerAutoSettingReadOnlyValue =
        callLoggerAutoSettingReadOnlyValue;
    }
    this.callLoggerRegistered = true;
    this.callLoggerAutoLogOnCallSync = Boolean(callLoggerAutoLogOnCallSync);
    this.callLoggerHideEditLogButton = Boolean(callLoggerHideEditLogButton);
    this.callLoggerAutoLogSettingHidden = Boolean(
      callLoggerAutoLogSettingHidden
    );
  }

  @action
  private _onRegisterMessageLogger({
    messageLoggerTitle,
    messageLoggerAutoSettingLabel,
    messageLoggerAutoSettingDescription,
    messageLoggerAutoSettingReadOnly,
    messageLoggerAutoSettingReadOnlyReason,
    messageLoggerAutoSettingReadOnlyValue,
    messageLoggerAutoSettingHidden,
  }: {
    messageLoggerTitle?: string;
    messageLoggerAutoSettingLabel?: string;
    messageLoggerAutoSettingDescription?: string;
    messageLoggerAutoSettingReadOnly?: boolean;
    messageLoggerAutoSettingReadOnlyReason?: string;
    messageLoggerAutoSettingReadOnlyValue?: boolean;
    messageLoggerAutoSettingHidden?: boolean;
  }): void {
    if (messageLoggerTitle) {
      this.messageLoggerTitle = messageLoggerTitle;
    }
    if (messageLoggerAutoSettingLabel) {
      this.messageLoggerAutoSettingLabel = messageLoggerAutoSettingLabel;
    }
    if (messageLoggerAutoSettingDescription) {
      this.messageLoggerAutoSettingDescription =
        messageLoggerAutoSettingDescription;
    }
    this.messageLoggerAutoSettingReadOnly = Boolean(
      messageLoggerAutoSettingReadOnly
    );
    this.messageLoggerAutoSettingReadOnlyReason =
      messageLoggerAutoSettingReadOnlyReason || '';
    if (
      this.messageLoggerAutoSettingReadOnly &&
      typeof messageLoggerAutoSettingReadOnlyValue === 'boolean'
    ) {
      this.messageLoggerAutoSettingReadOnlyValue =
        messageLoggerAutoSettingReadOnlyValue;
    }
    this.messageLoggerAutoSettingHidden = Boolean(
      messageLoggerAutoSettingHidden
    );
    this.messageLoggerRegistered = true;
  }

  @action
  private _onRegisterAuthorization({
    authorized,
    authorizedTitle = '',
    unauthorizedTitle = '',
    showAuthRedDot = false,
    authorizedAccount = '',
    showAuthButton = false,
    licenseStatus = '',
    licenseStatusColor = '',
    licenseDescription = '',
    authorizationLinks = [],
  }: {
    authorized: boolean;
    authorizedTitle?: string;
    unauthorizedTitle?: string;
    showAuthRedDot?: boolean;
    authorizedAccount?: string;
    showAuthButton?: boolean;
    licenseStatus?: string;
    licenseStatusColor?: string;
    licenseDescription?: string;
    authorizationLinks?: ThirdPartyAuthorizationLink[];
  }): void {
    this.authorized = authorized;
    this.authorizedTitle = authorizedTitle;
    this.unauthorizedTitle = unauthorizedTitle;
    this._showAuthRedDot = showAuthRedDot;
    this.authorizedAccount = authorizedAccount;
    this.showAuthButton = showAuthButton;
    this.licenseStatus = licenseStatus;
    this.licenseStatusColor = licenseStatusColor;
    this.licenseDescription = licenseDescription;
    this.authorizationLinks = authorizationLinks.filter(
      isSafeAuthorizationLink
    );
  }

  @action
  setAuthorized(value: boolean, account: string): void {
    this.authorized = value;
    this.authorizedAccount = account;
  }

  @action
  setLicenseStatus(status = '', color = 'neutral.f04', description = ''): void {
    this.licenseStatus = status;
    this.licenseStatusColor = color;
    this.licenseDescription = description;
  }

  @action
  private _onRegisterFeedback(): void {
    this.showFeedback = true;
  }

  @action
  private _onRegisterSettings({
    settings,
  }: {
    settings: ThirdPartySetting[];
  }): void {
    this.settings = settings;
  }

  @action
  private _onUpdateSettings({ setting }: { setting: ThirdPartySetting }): void {
    const settingItem = findSettingItem(this.settings, setting.id);
    if (!settingItem) {
      return;
    }
    Object.keys(setting).forEach((key) => {
      settingItem[key] = setting[key];
    });
  }

  @action
  private _onRegisterMeetingLogger({
    meetingLoggerTitle,
  }: {
    meetingLoggerTitle?: string;
  }): void {
    this.meetingLoggerRegistered = true;
    if (meetingLoggerTitle) {
      this.meetingLoggerTitle = meetingLoggerTitle;
    }
  }

  @action
  private _onRegisterAdditionalButtons({
    additionalButtons,
  }: {
    additionalButtons: ThirdPartyButton[];
  }): void {
    this.additionalButtons = additionalButtons;
  }

  @action
  setViewMatchedContactExternal(value: boolean): void {
    this.viewMatchedContactExternal = value;
  }

  @action
  updateCustomizedPage(page: ThirdPartyPage): void {
    if (!page.id) {
      console.error('Customized page id is required');
      return;
    }
    const index = this.customizedPages.findIndex((item) => item.id === page.id);
    if (index > -1) {
      Object.keys(page).forEach((key) => {
        if (key !== 'id') {
          this.customizedPages[index][key] = page[key];
        }
      });
      return;
    }
    this.customizedPages.push(page);
  }

  @action
  private _setDoNotContactRegistered(value: boolean): void {
    this.doNotContactRegistered = value;
  }

  @action
  updateApps(app: ThirdPartyApp): void {
    if (!app.id) {
      console.error('App id is required');
      return;
    }
    const index = this.apps.findIndex((item) => item.id === app.id);
    if (index > -1) {
      Object.keys(app).forEach((key) => {
        if (key !== 'id') {
          this.apps[index][key] = app[key];
        }
      });
      return;
    }
    this.apps.push(app);
  }

  @action
  removeApp(appId: string): void {
    this.apps = this.apps.filter((app) => app.id !== appId);
  }

  @action
  toggleAppPin(appId: string): void {
    const index = this.pinAppIds.findIndex((id) => id === appId);
    if (index > -1) {
      this.pinAppIds.splice(index, 1);
      return;
    }
    this.pinAppIds.push(appId);
  }

  @action
  private _setCustomizedBanner(banner?: ThirdPartyBanner | null): void {
    if (!banner || banner.hidden) {
      this.customizedBanner = null;
      return;
    }
    this.customizedBanner = {
      ...(this.customizedBanner || {}),
      id: banner.id,
      message: banner.message || '',
      severity: banner.severity || 'info',
      action: banner.action,
      closable: banner.closable || false,
      closeButtonLabel: banner.closeButtonLabel,
    };
  }
}
