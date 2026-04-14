import {
  action,
  injectable,
  state,
  optional,
  StoragePlugin,
  delegate,
} from '@ringcentral-integration/next-core';
import {
  Brand,
  Locale,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  AccountInfo,
  Analytics,
  AppFeatures,
  AvailabilityMonitor,
  Client,
  ExtensionInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  RcVideo as RcVideoBase,
  VideoConfiguration,
} from '@ringcentral-integration/micro-meeting/src/app/services';
import type {
  RcVDialInNumberObj,
  RcVideoAPI,
} from '@ringcentral-integration/commons/interfaces/Rcv.model';
import type { RcVideoOptions } from '@ringcentral-integration/micro-meeting/src/app/services/RcVideo/RcVideo.interface';
import {
  transformV1MeetingToV2,
  transformV2ResponseToV1,
} from '@ringcentral-integration/micro-meeting/src/app/services/RcVideo/videoHelper';

import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';

const PLAY_TONES_ENUM: Record<string, number> = {
  On: 0,
  Off: 1,
  ExitOnly: 2,
  EnterOnly: 3,
};

const WAITING_ROOM_MODE_ENUM: Record<string, number> = {
  Nobody: 0,
  Everybody: 1,
  GuestsOnly: 2,
  OtherAccount: 3,
};

interface BridgeData {
  id: string;
  name: string;
  pins: {
    pstn: { participant: string; host: string };
    web: string;
  };
  discovery: { web: string };
  preferences: {
    joinBeforeHost: boolean;
    join: {
      pstn: { promptAnnouncement: boolean; promptParticipants: boolean };
      audioMuted: boolean;
      videoMuted: boolean;
      waitingRoomRequired: string;
    };
    musicOnHold: boolean;
    playTones: string;
    screenSharing: boolean;
    recordingsMode: string;
    transcriptionsMode: string;
  };
  security: {
    e2ee: boolean;
    passwordProtected: boolean;
    password: { plainText: string; pstn: string; joinQuery: string };
    noGuests: boolean;
    sameAccount: boolean;
  };
  host: { accountId: string; extensionId: string };
}

interface MeetingDetail {
  type?: number;
  name?: string;
  accountId?: string;
  extensionId?: string;
  muteAudio?: boolean;
  muteVideo?: boolean;
  waitingRoomMode?: number;
  allowJoinBeforeHost?: boolean;
  allowScreenSharing?: boolean;
  isMeetingSecret?: boolean;
  meetingPassword?: string;
  isOnlyAuthUserJoin?: boolean;
  isOnlyCoworkersJoin?: boolean;
  e2ee?: boolean;
}

function formatV2Bridge(bridge: BridgeData): Record<string, unknown> {
  return {
    id: bridge.id,
    name: bridge.name,
    participantCode: bridge.pins.pstn.participant,
    hostCode: bridge.pins.pstn.host,
    shortId: bridge.pins.web,
    joinUri: bridge.discovery.web,
    allowJoinBeforeHost: bridge.preferences.joinBeforeHost,
    type: 0,
    announceOnEnter: bridge.preferences.join.pstn.promptAnnouncement,
    countOnEnter: bridge.preferences.join.pstn.promptParticipants,
    e2ee: bridge.security.e2ee,
    musicEnabled: bridge.preferences.musicOnHold,
    enterExitTonesMode: PLAY_TONES_ENUM[bridge.preferences.playTones],
    muteAudio: bridge.preferences.join.audioMuted,
    muteVideo: bridge.preferences.join.videoMuted,
    accountId: bridge.host.accountId,
    extensionId: bridge.host.extensionId,
    isMeetingSecret: bridge.security.passwordProtected,
    allowScreenSharing: bridge.preferences.screenSharing,
    isOnlyAuthUserJoin: bridge.security.noGuests,
    isOnlyCoworkersJoin: bridge.security.sameAccount,
    waitingRoomMode: WAITING_ROOM_MODE_ENUM[bridge.preferences.join.waitingRoomRequired],
    recordingsMode: bridge.preferences.recordingsMode,
    transcriptionsMode: bridge.preferences.transcriptionsMode,
    phoneGroup: 1,
    meetingPassword: bridge.security.password.plainText,
    meetingPasswordPSTN: bridge.security.password.pstn,
    meetingPasswordMasked: bridge.security.password.joinQuery,
  };
}

function formatBridgeRequestBody(meeting: MeetingDetail): Record<string, unknown> {
  if (meeting.type === 1) {
    return { type: 'Instant' };
  }
  return {
    name: meeting.name,
    type: 'Scheduled',
    preferences: {
      join: {
        audioMuted: meeting.muteAudio,
        videoMuted: meeting.muteVideo,
        waitingRoomRequired: Object.keys(WAITING_ROOM_MODE_ENUM)[meeting.waitingRoomMode ?? 0],
      },
      joinBeforeHost: meeting.allowJoinBeforeHost,
      screenSharing: meeting.allowScreenSharing,
    },
    security: {
      passwordProtected: meeting.isMeetingSecret,
      password: meeting.meetingPassword,
      noGuests: meeting.isOnlyAuthUserJoin,
      sameAccount: meeting.isOnlyCoworkersJoin,
      e2ee: meeting.e2ee,
    },
  };
}

interface ThirdPartyProvider {
  fetchUpcomingMeetingList: () => Promise<unknown[]>;
}

interface UpcomingEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  editEventUrl: string;
  location: string;
}

interface FetchHistoryMeetingsParams {
  pageToken?: string;
  searchText?: string;
  type?: string;
}

@injectable({
  name: 'RcVideo',
})
export class RcVideo extends RcVideoBase {

  constructor(
    protected _toast: Toast,
    protected _client: Client,
    protected _brand: Brand,
    protected _storage: StoragePlugin,
    protected _accountInfo: AccountInfo,
    protected _extensionInfo: ExtensionInfo,
    protected _videoConfiguration: VideoConfiguration,
    protected _locale: Locale,
    protected _appFeatures: AppFeatures,
    @optional() protected _analytics: Analytics,
    @optional()
    protected _availabilityMonitor?: AvailabilityMonitor,
    @optional('RcVideoOptions') protected _rcVideoOptions?: RcVideoOptions,
  ) {
    super(
      _toast,
      _client,
      _brand,
      _storage,
      _accountInfo,
      _extensionInfo,
      _videoConfiguration,
      _locale,
      _appFeatures,
      _analytics,
      _availabilityMonitor,
      _rcVideoOptions,
    );
  }

  private get _embeddableAppFeatures() {
    return this._appFeatures as EmbeddableAppFeatures;
  }

  private _fetchingUpcomingMeetings: boolean = false;
  private _thirdPartyProviders: Record<string, ThirdPartyProvider> = {};

  @state
  historyMeetings: unknown[] = [];

  @state
  upcomingMeetings: unknown[] = [];

  @state
  calendars: unknown[] = [];

  @state
  calendarsLoaded: boolean = false;

  @action
  private _saveCalendars(calendars: unknown[]): void {
    this.calendars = calendars;
    this.calendarsLoaded = true;
  }

  @action
  private _clearCalendars(): void {
    this.calendars = [];
    this.calendarsLoaded = false;
  }

  @action
  private _saveMeetings({ meetings, pageToken }: { meetings: unknown[]; pageToken?: string }): void {
    if (!pageToken) {
      this.historyMeetings = meetings;
      return;
    }
    this.historyMeetings = [...this.historyMeetings, ...meetings];
  }

  @action
  private _clearMeetings(): void {
    this.historyMeetings = [];
  }

  @action
  private _saveUpcomingMeetings({ meetings }: { meetings: unknown[] }): void {
    this.upcomingMeetings = meetings;
  }

  override onReset(): void {
    if (super.onReset) {
      super.onReset();
    }
    this._clearMeetings();
    this._fetchingUpcomingMeetings = false;
    this._saveUpcomingMeetings({ meetings: [] });
    this._clearCalendars();
  }

  @delegate('server')
  async fetchHistoryMeetings({
    pageToken,
    searchText,
    type,
  }: FetchHistoryMeetingsParams = {}): Promise<{ meetings: unknown[]; paging: { nextPageToken?: string } }> {
    const params: Record<string, unknown> = { perPage: 20 };
    if (pageToken) {
      params.pageToken = pageToken;
    }
    if (searchText) {
      params.text = searchText;
    }
    if (type === 'recordings') {
      params.type = 'All';
    }
    const response = await this._client.service
      .platform()
      .get('/rcvideo/v1/history/meetings', params);
    const data = await response.json();
    this._saveMeetings({ meetings: data.meetings, pageToken });
    return data;
  }

  @delegate('server')
  async cleanHistoryMeetings(): Promise<void> {
    this._clearMeetings();
  }

  @delegate('server')
  async fetchUpcomingMeetings(): Promise<void> {
    if (this._fetchingUpcomingMeetings) {
      return;
    }
    this._fetchingUpcomingMeetings = true;
    try {
      const meetings = await this._fetchUpcomingMeetings();
      this._saveUpcomingMeetings({ meetings });
    } catch (err) {
      console.error(err);
    }
    this._fetchingUpcomingMeetings = false;
  }

  @delegate('server')
  private async _fetchCalendars(): Promise<void> {
    if (this.calendarsLoaded) {
      return;
    }
    const platform = this._client.service.platform();
    const providersRes = await platform.get('/restapi/v1.0/account/~/extension/~/cloud-calendars/ucc');
    const providersData = await providersRes.json();
    const newCalendars = (providersData.records as any[]).filter(
      (c) => c.connected && c.primary,
    );
    this._saveCalendars(newCalendars);
  }

  @delegate('server')
  private async _fetchUpcomingMeetings(): Promise<UpcomingEvent[]> {
    let allEvents: UpcomingEvent[] = [];
    if (this._embeddableAppFeatures.hasInternalVideoScope) {
      await this._fetchCalendars();
      const fromDate = new Date();
      const toDate = new Date();
      toDate.setDate(toDate.getDate() + 7);
      const platform = this._client.service.platform();
      await Promise.all(
        (this.calendars as any[]).map(async (calendar) => {
          try {
            const eventsRes = await platform.get(
              `/restapi/v1.0/account/~/extension/~/cloud-calendars/ucc/${String(calendar.providerId).toLowerCase()}/~/${encodeURIComponent(calendar.calendarId)}/events`,
              {
                startTimeFrom: fromDate.toISOString(),
                startTimeTo: toDate.toISOString(),
              },
            );
            const eventsData = await eventsRes.json();
            const events = (eventsData.records as any[]).filter((e) => !e.cancelled);
            allEvents = allEvents.concat(
              events.map((event) => ({
                id: event.id,
                title: event.subject,
                startTime: event.start?.dateTime,
                endTime: event.end?.dateTime,
                isAllDay: event.allDay,
                editEventUrl: event.webViewUri,
                location: event.location,
              })),
            );
          } catch (err) {
            console.error('Fetching events error:', err);
          }
        }),
      );
    }
    await Promise.all(
      Object.keys(this._thirdPartyProviders).map(async (name) => {
        const { fetchUpcomingMeetingList } = this._thirdPartyProviders[name];
        const events = await fetchUpcomingMeetingList();
        allEvents = allEvents.concat(events as UpcomingEvent[]);
      }),
    );
    return allEvents.sort((a, b) => {
      const date1 = new Date(a.startTime).getTime();
      const date2 = new Date(b.startTime).getTime();
      return date1 - date2;
    });
  }

  addThirdPartyProvider({ name, fetchUpcomingMeetingList }: { name: string; fetchUpcomingMeetingList: () => Promise<unknown[]> }): void {
    this._thirdPartyProviders[name] = { fetchUpcomingMeetingList };
  }

  removeThirdPartyProvider({ name }: { name: string }): void {
    delete this._thirdPartyProviders[name];
  }

  override async initPreferences(): Promise<void> {
    if (!this._embeddableAppFeatures.hasInternalVideoScope) {
      return;
    }
    await super.initPreferences();
  }

  @delegate('server')
  override async _getDialinNumbers(): Promise<string | RcVDialInNumberObj[]> {
    if (!this._embeddableAppFeatures.hasInternalVideoScope) {
      return [];
    }
    return super._getDialinNumbers();
  }

  @delegate('server')
  override async _postBridges(
    meetingDetail: RcVideoAPI,
    usePersonalMeetingId: boolean,
  ) {
    if (this._enableV2Api) {
      const postData = transformV1MeetingToV2(
        meetingDetail,
        usePersonalMeetingId,
        {
          enableWaitingRoom: this.enableWaitingRoom,
          enableE2EE: this.enableE2EE,
        },
      );
      if (
        postData.security &&
        postData.security.password === '' &&
        postData.noGuests === undefined &&
        postData.sameAccount === undefined
      ) {
        postData.security = {};
      }
      const result = await this._client.service
        .platform()
        .post(
          `/rcvideo/v2/account/${meetingDetail.accountId}/extension/${meetingDetail.extensionId}/bridges`,
          postData,
        );
      const resp = await result.json();
      return transformV2ResponseToV1(resp);
    } else {
      const result = await this._client.service
        .platform()
        .post('/rcvideo/v1/bridges', meetingDetail);
      return result.json();
    }
  }
}
