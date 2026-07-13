export interface SmartNoteContact {
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  [key: string]: unknown;
}

export interface SmartNoteSession {
  id: string;
  status: string;
  phoneNumber?: string;
  contact?: SmartNoteContact;
  direction: string;
  startTime?: string;
}

export interface WebphoneSmartNoteSession {
  partyData?: {
    sessionId?: string;
  };
  direction: string;
  to?: string;
  from?: string;
  toUserName?: string;
  fromUserName?: string;
  startTime?: Date | number | string;
}

export interface SmartNoteCallMetadata {
  startTime: string;
  direction: string;
  from?: {
    phoneNumber: string;
    name: string;
  };
  to?: {
    phoneNumber: string;
    name: string;
  };
}

export interface SmartNoteTranscript {
  context?: {
    participants: Array<{
      accountId?: string;
      extensionId?: string;
      name: string;
      participantId: string;
    }>;
  };
  transcripts?: Array<{
    text: string;
    participantId: string;
  }>;
}

export interface SmartNoteQueryResult {
  id: string;
  noted: boolean;
}

export interface SmartNoteTextRecord {
  id: string;
  text: string;
}

export interface SmartNoteTranscriptRecord {
  id: string;
  transcript: SmartNoteTranscript;
}

export interface SmartNoteClientInstance {
  readonly transcriptionStatus: string;
  readonly transcriptions: unknown[];
  start(): Promise<void>;
  stop(): Promise<void> | void;
  pause(): Promise<void> | void;
  resume(): Promise<void> | void;
  updateTelephonySessionStatus(status: string): Promise<void> | void;
  on(event: 'statusUpdate', handler: (status: string) => void): void;
  removeAllListeners(): void;
}

export interface SmartNoteClientConstructor {
  new (options: {
    sdk: unknown;
    telephonySessionId: string;
    extensionId: string;
    telephonySessionStatus: string;
    contact: SmartNoteContact;
    smartNoteIframeUri: string;
    callMetaData: SmartNoteCallMetadata;
  }): SmartNoteClientInstance;
  querySmartNotes(
    sdk: unknown,
    telephonySessionIds: string[],
  ): Promise<{
    records: Array<{ telephonySessionId: string }>;
  }>;
  getNotes(
    sdk: unknown,
    telephonySessionId: string,
  ): Promise<{
    status: string;
    data?: string;
  }>;
  getTranscripts(
    sdk: unknown,
    telephonySessionId: string,
  ): Promise<SmartNoteTranscript>;
}

export interface SmartNotesPluginConfig {
  smartNotesMFE?: string;
  smartNotesIframe?: string;
}

export interface SmartNotesRemoteModule {
  SmartNoteClient: SmartNoteClientConstructor;
}
