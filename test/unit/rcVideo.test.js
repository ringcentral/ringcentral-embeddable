const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const { RcVideo: RcVideoBase } = require('@ringcentral-integration/commons/modules/RcVideo');

const { RcVideo } = require('../../src/modules/RcVideo');

function createBridge(overrides = {}) {
  return {
    id: 'bridge-1',
    name: 'Weekly sync',
    pins: {
      pstn: {
        participant: '123456',
        host: '654321',
      },
      web: '999888',
    },
    discovery: {
      web: 'https://v.ringcentral.com/join/999888',
    },
    preferences: {
      joinBeforeHost: true,
      join: {
        audioMuted: true,
        videoMuted: false,
        pstn: {
          promptAnnouncement: true,
          promptParticipants: false,
        },
        waitingRoomRequired: 'GuestsOnly',
      },
      musicOnHold: true,
      playTones: 'EnterOnly',
      recordingsMode: 'Automatic',
      screenSharing: true,
      transcriptionsMode: 'Auto',
    },
    security: {
      e2ee: true,
      noGuests: false,
      password: {
        joinQuery: 'masked',
        plainText: 'secret',
        pstn: '1234',
      },
      passwordProtected: true,
      sameAccount: true,
    },
    host: {
      accountId: 'account-1',
      extensionId: 'extension-1',
    },
    ...overrides,
  };
}

function createPlatform() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    send: jest.fn(),
  };
}

function createVideo(overrides = {}) {
  const platform = createPlatform();
  const video = Object.create(RcVideo.prototype);
  Object.assign(video, {
    _enablePersonalMeeting: true,
    _fetchingUpcomingMeetings: false,
    _thirdPartyProviders: {},
    calendars: [],
    calendarsLoaded: false,
    historyMeetings: [],
    parentModule: {
      analytics: {
        track: jest.fn(),
      },
    },
    upcomingMeetings: [],
    _deps: {
      appFeatures: {
        hasInternalVideoScope: true,
      },
      client: {
        service: {
          platform: jest.fn(() => platform),
        },
      },
    },
    _errorHandle: jest.fn(),
    _resetPersonalMeeting: jest.fn(),
    _savePersonalMeeting: jest.fn(function savePersonalMeeting(meeting) {
      this.personalMeeting = meeting;
    }),
    createMeeting: jest.fn(async (meeting) => ({
      id: 'meeting-1',
      ...meeting,
    })),
    ...overrides,
  });
  Object.defineProperties(video, {
    accountId: {
      configurable: true,
      value: 111,
    },
    extensionId: {
      configurable: true,
      value: 222,
    },
  });
  video._testPlatform = platform;
  return video;
}

describe('RcVideo module', () => {
  beforeEach(() => {
    setStagedState({});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('saves and clears local meeting and calendar state', async () => {
    const video = createVideo();

    video._saveCalendars([{ id: 'calendar-1' }]);
    expect(video.calendars).toEqual([{ id: 'calendar-1' }]);
    expect(video.calendarsLoaded).toBe(true);

    video._saveMeetings({
      meetings: [{ id: 'history-1' }],
      pageToken: undefined,
    });
    video._saveMeetings({
      meetings: [{ id: 'history-2' }],
      pageToken: 'next-page',
    });
    expect(video.historyMeetings).toEqual([
      { id: 'history-1' },
      { id: 'history-2' },
    ]);

    video._saveUpcomingMeetings({ meetings: [{ id: 'upcoming-1' }] });
    expect(video.upcomingMeetings).toEqual([{ id: 'upcoming-1' }]);

    await expect(video.createInstantMeeting()).resolves.toEqual({
      id: 'meeting-1',
      type: 1,
    });
    expect(video.createMeeting).toHaveBeenCalledWith({ type: 1 });

    await video.cleanHistoryMeetings();
    expect(video.historyMeetings).toEqual([]);

    video._clearCalendars();
    expect(video.calendars).toEqual([]);
    expect(video.calendarsLoaded).toBe(false);
  });

  it('fetches history meetings and upcoming calendar/provider meetings', async () => {
    const video = createVideo();
    video._testPlatform.get.mockImplementation(async (url) => {
      if (url === '/rcvideo/v1/history/meetings') {
        return {
          json: async () => ({
            meetings: [{ id: 'history-meeting' }],
            nextPageToken: 'next',
          }),
        };
      }
      if (url === '/restapi/v1.0/account/~/extension/~/cloud-calendars/ucc') {
        return {
          json: async () => ({
            records: [
              { connected: true, primary: true, providerId: 'Google', calendarId: 'primary' },
              { connected: true, primary: false, providerId: 'Google', calendarId: 'secondary' },
              { connected: false, primary: true, providerId: 'Outlook', calendarId: 'work' },
            ],
          }),
        };
      }
      if (url.includes('/events')) {
        return {
          json: async () => ({
            records: [
              {
                allDay: false,
                cancelled: false,
                end: { dateTime: '2026-01-01T11:00:00.000Z' },
                id: 'calendar-event',
                location: 'Room 1',
                start: { dateTime: '2026-01-01T10:00:00.000Z' },
                subject: 'Calendar sync',
                webViewUri: 'https://calendar.example.com/event',
              },
              {
                cancelled: true,
                id: 'cancelled-event',
              },
            ],
          }),
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    });
    video.addThirdPartyProvider({
      name: 'crm',
      fetchUpcomingMeetingList: jest.fn(async () => ([{
        id: 'third-party-event',
        startTime: '2026-01-01T09:00:00.000Z',
        title: 'CRM meeting',
      }])),
    });

    await expect(video.fetchHistoryMeetings({
      pageToken: 'page-2',
      searchText: 'sync',
      type: 'recordings',
    })).resolves.toEqual({
      meetings: [{ id: 'history-meeting' }],
      nextPageToken: 'next',
    });
    expect(video._testPlatform.get).toHaveBeenCalledWith(
      '/rcvideo/v1/history/meetings',
      {
        pageToken: 'page-2',
        perPage: 20,
        text: 'sync',
        type: 'All',
      },
    );
    expect(video.historyMeetings).toEqual([{ id: 'history-meeting' }]);

    await video.fetchUpcomingMeetings();

    expect(video.calendars).toEqual([
      { connected: true, primary: true, providerId: 'Google', calendarId: 'primary' },
    ]);
    expect(video.upcomingMeetings).toEqual([
      {
        id: 'third-party-event',
        startTime: '2026-01-01T09:00:00.000Z',
        title: 'CRM meeting',
      },
      {
        editEventUrl: 'https://calendar.example.com/event',
        endTime: '2026-01-01T11:00:00.000Z',
        id: 'calendar-event',
        isAllDay: false,
        location: 'Room 1',
        startTime: '2026-01-01T10:00:00.000Z',
        title: 'Calendar sync',
      },
    ]);
    expect(video._fetchingUpcomingMeetings).toBe(false);

    video.removeThirdPartyProvider({ name: 'crm' });
    expect(video._thirdPartyProviders).toEqual({});
  });

  it('guards upcoming fetches and handles calendar/provider failures', async () => {
    const video = createVideo({
      _fetchingUpcomingMeetings: true,
    });

    await video.fetchUpcomingMeetings();
    expect(video._testPlatform.get).not.toHaveBeenCalled();

    const failingVideo = createVideo();
    failingVideo._fetchUpcomingMeetings = jest.fn(async () => {
      throw new Error('fetch failed');
    });
    await failingVideo.fetchUpcomingMeetings();
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    expect(failingVideo._fetchingUpcomingMeetings).toBe(false);

    const scopedOutVideo = createVideo({
      _deps: {
        appFeatures: {
          hasInternalVideoScope: false,
        },
        client: {
          service: {
            platform: jest.fn(() => createPlatform()),
          },
        },
      },
    });
    scopedOutVideo.addThirdPartyProvider({
      name: 'external',
      fetchUpcomingMeetingList: jest.fn(async () => ([{
        id: 'external',
        startTime: '2026-01-01T12:00:00.000Z',
      }])),
    });
    await expect(scopedOutVideo._fetchUpcomingMeetings()).resolves.toEqual([
      { id: 'external', startTime: '2026-01-01T12:00:00.000Z' },
    ]);

    const eventFailureVideo = createVideo({
      calendars: [{ connected: true, primary: true, providerId: 'Google', calendarId: 'primary' }],
      calendarsLoaded: true,
    });
    eventFailureVideo._testPlatform.get.mockRejectedValueOnce(new Error('events failed'));
    await expect(eventFailureVideo._fetchUpcomingMeetings()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      'Fetching events error:',
      expect.any(Error),
    );
  });

  it('formats bridge v2 responses and request bodies for personal and scheduled meetings', async () => {
    const video = createVideo();
    const bridge = createBridge();
    video._testPlatform.get.mockResolvedValue({
      json: async () => bridge,
    });
    video._testPlatform.post.mockResolvedValue({
      json: async () => bridge,
    });
    video._testPlatform.send.mockResolvedValue({
      json: async () => bridge,
    });

    await video._initPersonalMeeting();
    expect(video._testPlatform.get).toHaveBeenCalledWith(
      '/rcvideo/v2/account/111/extension/222/bridges/default',
    );
    expect(video._savePersonalMeeting).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'account-1',
      allowJoinBeforeHost: true,
      enterExitTonesMode: 3,
      hostCode: '654321',
      isMeetingSecret: true,
      joinUri: 'https://v.ringcentral.com/join/999888',
      meetingPassword: 'secret',
      meetingPasswordMasked: 'masked',
      meetingPasswordPSTN: '1234',
      participantCode: '123456',
      waitingRoomMode: 2,
    }));

    await expect(video._postBridges({
      accountId: 'account-1',
      extensionId: 'extension-1',
      name: 'Scheduled bridge',
      type: 0,
      muteAudio: true,
      muteVideo: false,
      waitingRoomMode: 3,
      allowJoinBeforeHost: false,
      allowScreenSharing: true,
      isMeetingSecret: true,
      meetingPassword: 'pass',
      isOnlyAuthUserJoin: true,
      isOnlyCoworkersJoin: false,
      e2ee: true,
    })).resolves.toEqual(expect.objectContaining({
      id: 'bridge-1',
      shortId: '999888',
    }));
    expect(video._testPlatform.post).toHaveBeenCalledWith(
      '/rcvideo/v2/account/account-1/extension/extension-1/bridges',
      {
        name: 'Scheduled bridge',
        preferences: {
          join: {
            audioMuted: true,
            videoMuted: false,
            waitingRoomRequired: 'OtherAccount',
          },
          joinBeforeHost: false,
          screenSharing: true,
        },
        security: {
          e2ee: true,
          noGuests: true,
          password: 'pass',
          passwordProtected: true,
          sameAccount: false,
        },
        type: 'Scheduled',
      },
    );

    await video._patchBridges('bridge-1', {
      name: 'Patched bridge',
      type: 0,
      waitingRoomMode: 1,
    });
    expect(video._testPlatform.send).toHaveBeenCalledWith({
      method: 'PATCH',
      url: '/rcvideo/v2/bridges/bridge-1',
      body: {
        name: 'Patched bridge',
        preferences: {
          join: {
            audioMuted: undefined,
            videoMuted: undefined,
            waitingRoomRequired: 'Everybody',
          },
          joinBeforeHost: undefined,
          screenSharing: undefined,
        },
        security: {
          e2ee: undefined,
          noGuests: undefined,
          password: undefined,
          passwordProtected: undefined,
          sameAccount: undefined,
        },
      },
    });

    await video._postBridges({ type: 1 });
    expect(video._testPlatform.post).toHaveBeenLastCalledWith(
      '/rcvideo/v2/account/~/extension/~/bridges',
      { type: 'Instant' },
    );

    await expect(video.getMeeting('999888')).resolves.toEqual(expect.objectContaining({
      id: 'bridge-1',
      name: 'Weekly sync',
    }));
    expect(video._testPlatform.get).toHaveBeenCalledWith('/rcvideo/v2/bridges/pin/web/999888');
  });

  it('handles personal-meeting errors and internal-scope base behavior', async () => {
    const video = createVideo();
    video._testPlatform.get.mockRejectedValueOnce({
      response: { status: 404 },
    });
    await video._initPersonalMeeting();
    expect(video._resetPersonalMeeting).toHaveBeenCalled();
    expect(video._errorHandle).not.toHaveBeenCalled();

    video._testPlatform.get.mockRejectedValueOnce(new Error('server failed'));
    await video._initPersonalMeeting();
    expect(video._errorHandle).toHaveBeenCalledWith(expect.any(Error));

    const disabledVideo = createVideo({
      _enablePersonalMeeting: false,
    });
    await disabledVideo._initPersonalMeeting();
    expect(disabledVideo._testPlatform.get).not.toHaveBeenCalled();

    const initPreferencesSpy = jest
      .spyOn(RcVideoBase.prototype, '_initPreferences')
      .mockImplementation(async function initPreferences() {
        this.preferencesInitialized = true;
      });
    const dialinSpy = jest
      .spyOn(RcVideoBase.prototype, '_getDialinNumbers')
      .mockImplementation(() => ['+16505550100']);

    const scopedVideo = createVideo();
    await scopedVideo._initPreferences();
    expect(initPreferencesSpy).toHaveBeenCalled();
    expect(scopedVideo.preferencesInitialized).toBe(true);
    expect(scopedVideo._getDialinNumbers()).toEqual(['+16505550100']);
    expect(dialinSpy).toHaveBeenCalled();

    const noScopeVideo = createVideo({
      _deps: {
        appFeatures: {
          hasInternalVideoScope: false,
        },
        client: {
          service: {
            platform: jest.fn(() => createPlatform()),
          },
        },
      },
    });
    await expect(noScopeVideo._initPreferences()).resolves.toBeUndefined();
    expect(noScopeVideo._getDialinNumbers()).toEqual([]);
  });
});
