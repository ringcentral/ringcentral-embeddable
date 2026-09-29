import type { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';

import type { SmartNoteTranscript } from '../SmartNotes';

export interface ThirdPartyOptions {
  recordingLink?: string;
}

export type UnknownRecord = Record<string, unknown>;

export type ThirdPartySettingOption = {
  id?: string | number;
  name?: string;
  description?: string;
  disabled?: boolean;
};

export type ThirdPartySettingCondition = {
  operator?: string;
  value?: unknown;
};

export type ThirdPartySetting = {
  id?: string;
  name?: string;
  type?: string;
  value?: unknown;
  order?: number;
  groupId?: string;
  options?: ThirdPartySettingOption[];
  multiple?: boolean;
  checkbox?: boolean;
  buttonLabel?: string;
  buttonType?: string;
  uri?: string;
  items?: ThirdPartySetting[];
  readOnly?: boolean;
  readOnlyReason?: string;
  description?: string;
  warning?: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  maxItems?: number;
  severity?: string;
  variant?: string;
  color?: string;
  disabled?: boolean;
  showWhen?: Record<string, ThirdPartySettingCondition>;
  [key: string]: unknown;
};

export type ThirdPartyPhoneNumber = {
  phoneNumber: string;
  phoneType?: string;
};

export type ThirdPartyContact = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  type?: string;
  phoneNumbers?: ThirdPartyPhoneNumber[];
  deleted?: boolean;
  entityType?: string;
  /** Set to the registered service name so the framework treats it as a CRM match. */
  resourceType?: string;
  [key: string]: unknown;
};

export type ThirdPartyWidgetContact = {
  id?: string;
  name?: string;
  phoneNumber?: string;
  phoneNumbers?: ThirdPartyPhoneNumber[];
  [key: string]: unknown;
};

export type DoNotContactRecipient = {
  phoneNumber: string;
  contactId?: string;
  name?: string;
  contactType?: string;
  entityType?: string;
  phoneType?: string;
};

export type DoNotContactRequest =
  | (DoNotContactRecipient & {
      actionType: 'call';
    })
  | {
      actionType: 'sms';
      recipients: DoNotContactRecipient[];
    };

export type DoNotContactResponse = {
  result: boolean;
  message?: string;
  mode?: string;
};

export type ThirdPartyButton = {
  id: string;
  type: string;
  icon?: string;
  label?: string;
};

export type ThirdPartyTabAction = {
  id: string;
  icon?: string;
  title?: string;
};

export type ThirdPartyAuthorizationLink = {
  label: string;
  uri: string;
};

export type ThirdPartyBanner = {
  id: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  action?: {
    label: string;
    variant?: 'text' | 'outlined' | 'contained' | 'plain';
    color?: string;
  };
  closable?: boolean;
  closeButtonLabel?: string;
  hidden?: boolean;
};

export type ThirdPartyPage = {
  id: string;
  title?: string;
  type?: string;
  schema?: UnknownRecord;
  formData?: UnknownRecord;
  iconUri?: string;
  activeIconUri?: string;
  darkIconUri?: string;
  priority?: number;
  unreadCount?: number;
  hidden?: boolean;
  hideBackButton?: boolean;
  actions?: ThirdPartyTabAction[];
  uiSchema?: {
    submitButtonOptions?: {
      submitText?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type ThirdPartyApp = {
  id: string;
  name?: string;
  description?: string;
  iconUri?: string;
  pagePath?: string;
  inputChangedPath?: string;
  submitPath?: string;
  buttonEventPath?: string;
  [key: string]: unknown;
};

export type ThirdPartyServiceRegistration = {
  name: string;
  displayName?: string;
  info?: string;
  contactsPath?: string;
  contactIcon?: string;
  contactSearchPath?: string;
  contactMatchPath?: string;
  contactMatchTtl?: number;
  contactNoMatchTtl?: number;
  viewMatchedContactPath?: string;
  activitiesPath?: string;
  activityPath?: string;
  activityName?: string;
  meetingInviteTitle?: string;
  meetingInvitePath?: string;
  meetingUpcomingPath?: string;
  meetingLoggerPath?: string;
  meetingLoggerTitle?: string;
  callLoggerPath?: string;
  callLoggerTitle?: string;
  showLogModal?: boolean;
  callLoggerAutoSettingLabel?: string;
  callLoggerAutoSettingDescription?: string;
  callLoggerAutoSettingReadOnly?: boolean;
  callLoggerAutoSettingReadOnlyReason?: string;
  callLoggerAutoSettingReadOnlyValue?: boolean;
  callLoggerAutoLogSettingHidden?: boolean;
  callLoggerAutoSettingWarning?: string;
  callLoggerAutoLogOnCallSync?: boolean;
  callLoggerHideEditLogButton?: boolean;
  recordingWithToken?: boolean;
  callLogEntityMatcherPath?: string;
  leadViewerPath?: string;
  callLogPageInputChangedEventPath?: string;
  messageLoggerPath?: string;
  messageLoggerTitle?: string;
  messageLoggerAutoSettingLabel?: string;
  messageLoggerAutoSettingDescription?: string;
  messageLoggerAutoSettingReadOnly?: boolean;
  messageLoggerAutoSettingReadOnlyReason?: string;
  messageLoggerAutoSettingReadOnlyValue?: boolean;
  messageLoggerAutoSettingHidden?: boolean;
  attachmentWithToken?: boolean;
  messageLogEntityMatcherPath?: string;
  messagesLogPageInputChangedEventPath?: string;
  feedbackPath?: string;
  settingsPath?: string;
  settings?: ThirdPartySetting[];
  authorizationPath?: string;
  authorizationLogo?: string;
  authorized?: boolean;
  authorizedTitle?: string;
  unauthorizedTitle?: string;
  showAuthRedDot?: boolean;
  authorizedAccount?: string;
  licenseStatus?: string;
  licenseStatusColor?: string;
  licenseDescription?: string;
  authorizationLinks?: ThirdPartyAuthorizationLink[];
  vcardHandlerPath?: string;
  buttonEventPath?: string;
  buttons?: ThirdPartyButton[];
  customizedPageInputChangedEventPath?: string;
  doNotContactPath?: string;
  voicemailDropFilesPath?: string;
  banner?: ThirdPartyBanner;
};

export type ThirdPartyMessageData = {
  type?: string;
  service?: ThirdPartyServiceRegistration;
  authorized?: boolean;
  authorizedAccount?: string;
  licenseStatus?: string;
  licenseStatusColor?: string;
  licenseDescription?: string;
  sessionIds?: string[];
  phoneNumbers?: string[];
  settings?: ThirdPartySetting[];
  page?: ThirdPartyPage;
  app?: ThirdPartyApp;
  appId?: string;
  banner?: ThirdPartyBanner;
  [key: string]: unknown;
};

export type SearchContactEntity = {
  id: string;
  name: string;
  type?: string;
  phoneNumber: string;
  phoneType: string;
  entityType: string;
  contactId: string;
  isPrimary: boolean;
  contact: ThirdPartyContact;
};

export type ContactSource = {
  sourceName: string | null;
  readonly ready: boolean;
  sourceReady: boolean;
  contacts: ThirdPartyContact[];
  rawContacts: ThirdPartyContact[];
  filterContacts: (searchFilter: unknown) => ThirdPartyContact[];
  findContact: (contactId: string) => ThirdPartyContact | undefined;
  sync: (params?: FetchContactsParams) => Promise<void>;
};

export type ContactSearchApi = {
  addSearchSource: (args: {
    sourceName: string;
    searchFn: (args: {
      searchString: string;
    }) => Promise<SearchContactEntity[]>;
    formatFn: (entities: SearchContactEntity[]) => SearchContactEntity[];
    readyCheckFn: () => boolean;
  }) => void;
  _searchSources: Map<string, unknown>;
  _searchSourcesFormat: Map<string, unknown>;
  _searchSourcesCheck: Map<string, unknown>;
};

export type MatcherApi<TQuery extends string = string> = {
  addSearchProvider: (args: {
    name: string;
    searchFn: (args: {
      queries: TQuery[];
    }) => Promise<Record<string, unknown[]>>;
    readyCheckFn: () => boolean;
  }) => void;
  match: (args: { queries: TQuery[]; ignoreCache: boolean }) => unknown;
  triggerMatch?: () => unknown;
  _getQueries: () => TQuery[];
  _searchProviders: Map<string, unknown>;
};

export type ContactMatcherApi = MatcherApi<string> & {
  dataMapping: Record<string, ThirdPartyContact[]>;
  manualRefreshNumber: string | null;
  setManualRefreshNumber: (phoneNumber: string) => void;
  resetManualRefreshNumber: () => void;
  removeSearchProvider: (name: string) => void;
};

export type GenericMeetingWithThirdPartyProvider = GenericMeeting & {
  addThirdPartyProvider: (args: {
    name: string;
    fetchUpcomingMeetingList: () => Promise<unknown[]>;
  }) => void;
};

export type CallHistoryApi = {
  calls: ThirdPartyCall[];
};

export type CallMonitorApi = {
  calls?: Array<{ sessionId?: string }>;
};

export type MessageStoreApi = {
  voicemailTranscriptionMap?: Record<string, { text?: string }>;
  fetchVoicemailTranscription?: (
    message: ThirdPartyMessage
  ) => Promise<unknown>;
};

export type FetchContactsParams = {
  page?: number;
  type?: string;
};

export type FetchContactsResult = {
  contacts: ThirdPartyContact[];
  syncTimestamp: number | null;
};

export type ThirdPartyRecording = {
  uri: string;
  contentUri: string;
  [key: string]: unknown;
};

export type ThirdPartyCall = {
  sessionId?: string;
  telephonySessionId?: string;
  internalType?: string;
  result?: string;
  recording?: ThirdPartyRecording;
  from: {
    extensionId?: string;
    name?: string;
    phoneNumber?: string;
    extensionNumber?: string;
  };
  to: {
    extensionId?: string;
    name?: string;
    phoneNumber?: string;
    extensionNumber?: string;
  };
  fromName?: string;
  toName?: string;
  [key: string]: unknown;
};

export type ThirdPartyMessageAttachment = {
  id?: string;
  uri: string;
  [key: string]: unknown;
};

export type ThirdPartyMessage = {
  id?: string;
  attachments?: ThirdPartyMessageAttachment[];
  [key: string]: unknown;
};

export type ThirdPartyConversation = {
  type?: string;
  conversationLogId?: string;
  messages?: ThirdPartyMessage[];
  [key: string]: unknown;
};

export type Transcript = SmartNoteTranscript;

export type LoadAppPageParams = {
  app: ThirdPartyApp;
  contact?: ThirdPartyWidgetContact;
  formData?: UnknownRecord | null;
  changedKeys?: string[] | null;
  type?: 'init' | 'inputChanged' | 'submit' | 'buttonClick' | 'refresh';
  button?: Pick<ThirdPartyButton, 'id'> | null;
  theme?: string;
};
