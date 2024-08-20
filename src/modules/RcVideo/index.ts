import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcVideo as RcVideoBase } from '@ringcentral-integration/commons/modules/RcVideo';

import { action, state, track } from '@ringcentral-integration/core';

const PLAY_TONES_ENUM = {
  On: 0,
  Off: 1,
  ExitOnly: 2,
  EnterOnly: 3,
};

const WAITING_ROOM_MODE_ENUM = {
  Nobody: 0,
  Everybody: 1,
  GuestsOnly: 2,
  OtherAccount: 3,
};

function formatV2Bridge(bridge) {
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

function formatBridgeRequestBody(meeting) {
  if (meeting.type === 1) {
    return {
      type: 'Instant',
    };
  }
  return {
    name: meeting.name,
    type: 'Scheduled',
    preferences: {
      join: {
        audioMuted: meeting.muteAudio,
        videoMuted: meeting.muteVideo,
        waitingRoomRequired: Object.keys(WAITING_ROOM_MODE_ENUM)[meeting.waitingRoomMode],
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

@Module({
  name: 'NewRcVideo',
  deps: []
})
export class RcVideo extends RcVideoBase {
  private _fetchingUpcomingMeetings: boolean;
  private _thirdPartyProviders: any;

  constructor(deps) {
    super(deps);
    this._fetchingUpcomingMeetings = false;
    this._thirdPartyProviders = {};
  }

  @state
  historyMeetings = [];

  @state
  upcomingMeetings = [];

  @action
  private _saveMeetings({ meetings, pageToken }) {
    if (!pageToken) {
      this.historyMeetings = meetings;
      return;
    }
    this.historyMeetings = [].concat(this.historyMeetings, meetings);
  }

  @action
  private _clearMeetings() {
    this.historyMeetings = [];
  }

  @action
  private _saveUpcomingMeetings({ meetings }) {
    this.upcomingMeetings = meetings;
  }

  @track(() => ['Create instant meeting'])
  async createInstantMeeting() {
    const meeting = await this.createMeeting({ type: 1 });
    return meeting;
  }

  async fetchHistoryMeetings({
    pageToken, searchText, type
  } : {
    pageToken?: undefined,
    searchText?: undefined,
    type?: undefined,
  } = {}) {
    const params = { perPage: 20 } as any;
    if (pageToken) {
      params.pageToken = pageToken;
    }
    if (searchText) {
      params.text = searchText;
    }
    if (type === 'recordings') {
      params.type = 'All';
    }
    const response = await this._deps.client.service
      .platform()
      .get('/rcvideo/v1/history/meetings', params);
    const data = await response.json();
    this._saveMeetings({
      meetings: data.meetings,
      pageToken,
    });
    return data;
  }

  async cleanHistoryMeetings() {
    this._clearMeetings();
  }

  async fetchUpcomingMeetings() {
    if (this._fetchingUpcomingMeetings) {
      return;
    }
    this._fetchingUpcomingMeetings = true;
    try {
      const meetings = await this._fetchUpcomingMeetings();
      this._saveUpcomingMeetings({ meetings });
    } catch (e) {
      console.error(e);
    }
    this._fetchingUpcomingMeetings = false;
  }

  async _fetchUpcomingMeetings() {
    const platform = this._deps.client.service.platform();
    const providersRes = await platform.get('/rcvideo/v1/scheduling/providers');
    const providersData = await providersRes.json();
    const providers = providersData.providers.filter(p => p.isAuthorized);
    let allEvents = [];
    await Promise.all(providers.map(async (provider) => {
      try {
        const calendersRes = await platform.get(`/rcvideo/v1/scheduling/providers/${provider.id}/calendars`)
        const calendersData = await calendersRes.json();
        const calendars = calendersData.calendars.filter(
          c => c.isPrimary
        );
        const fromDate = new Date();
        const toDate = new Date();
        toDate.setDate(toDate.getDate() + 7)
        await Promise.all(calendars.map(async (calendar) => {
          try {
            const eventsRes = await platform.get(
              `/rcvideo/v1/scheduling/providers/${provider.id}/calendars/${encodeURIComponent(calendar.id)}/events`,
              {
                includeNonRcEvents: true,
                startTimeFrom: fromDate.toISOString(),
                startTimeTo: toDate.toISOString(),
              }
            )
            const eventsData = await eventsRes.json();
            const events = eventsData.events;
            allEvents = allEvents.concat(events);
          } catch (e) {
            console.error('Fetching events error:', e);
          }
        }));
      } catch (e) {
        console.error('Fetching calendars error:', e);
      }
    }));
    await Promise.all(Object.keys(this._thirdPartyProviders).map(async (name) => {
      const fetchFunc = this._thirdPartyProviders[name].fetchUpcomingMeetingList;
      const events = await fetchFunc();
      allEvents = allEvents.concat(events);
    }));
    return allEvents.sort((a, b) => {
      const date1 = (new Date(a.startTime)).getTime();
      const date2 = (new Date(b.startTime)).getTime();
      return date1 - date2;
    });
  }

  addThirdPartyProvider({ name, fetchUpcomingMeetingList }) {
    this._thirdPartyProviders[name] = {
      fetchUpcomingMeetingList: fetchUpcomingMeetingList,
    };
  }

  removeThirdPartyProvider({ name }) {
    delete this._thirdPartyProviders[name];
  }

  // override for bridge v2 api
  override async _initPersonalMeeting(
    accountId: number = this.accountId,
    extensionId: number = this.extensionId,
  ) {
    if (!this._enablePersonalMeeting) {
      return;
    }
    try {
      const meetingResult = await this._deps.client.service
        .platform()
        .get(`/rcvideo/v2/account/${accountId}/extension/${extensionId}/bridges/default`);
      const meeting = await meetingResult.json();
      this._savePersonalMeeting(formatV2Bridge(meeting));
    } catch (errors) {
      console.error('fetch personal meeting error:', errors);
      this._resetPersonalMeeting();
      this._errorHandle(errors);
    }
  }

  // override for bridge v2 api
  async _postBridges(meetingDetail) {
    const accountId = meetingDetail.accountId || `~`;
    const extensionId = meetingDetail.extensionId || `~`;
    const response = await this._deps.client.service
      .platform()
      .post(
        `/rcvideo/v2/account/${accountId}/extension/${extensionId}/bridges`,
        formatBridgeRequestBody(meetingDetail)
      );
    const result = await response.json();
    return formatV2Bridge(result);
  }

  protected async _patchBridges(meetingId: string, meetingDetail) {
    const body = formatBridgeRequestBody(meetingDetail);
    delete body.type;
    const result = await this._deps.client.service.platform().send({
      method: 'PATCH',
      url: `/rcvideo/v2/bridges/${meetingId}`,
      body,
    });
    const meeting = await result.json();
    return formatV2Bridge(meeting);
  }

  async getMeeting(
    meetingId: string,
  ) {
    const result = await this._deps.client.service
      .platform()
      .get(`/rcvideo/v2/bridges/pin/web/${meetingId}`);
    const meeting = await result.json();
    return formatV2Bridge(meeting);
  }
}
