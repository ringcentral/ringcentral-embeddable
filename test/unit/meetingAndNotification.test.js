jest.mock('@ringcentral-integration/widgets/lib/MeetingCalendarHelper', () => ({
  getRcmEventTpl: jest.fn(() => 'rcm details'),
  getRcvEventTpl: jest.fn(() => 'rcv details'),
}));

import {
  formatMeetingForm,
  formatMeetingInfo,
  formatRCMInfo,
  formatRCVInfo,
} from '../../src/lib/formatMeetingInfo';
import Notification from '../../src/lib/notification';

describe('meeting format helpers', () => {
  it('formats RingCentral Meetings calendar data', () => {
    const result = formatRCMInfo(
      {
        meeting: {
          topic: 'Planning',
          meetingType: 'Scheduled',
          schedule: {
            startTime: '2025-01-01T10:00:00Z',
            durationInMinutes: 30,
          },
          links: {
            joinUri: 'https://meet.example.com/1',
          },
        },
      },
      'RingCentral',
      'en-US',
    );

    expect(result).toEqual({
      topic: 'Planning',
      location: 'https://meet.example.com/1',
      timeFrom: '2025-01-01T10:00:00Z',
      timeTo: '2025-01-01T10:30:00Z',
      details: 'rcm details',
    });
  });

  it('formats recurring RingCentral Meetings with a current time range', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T10:00:00Z'));

    const result = formatMeetingInfo(
      {
        meeting: {
          topic: 'Standup',
          meetingType: 'Recurring',
          links: {
            joinUri: 'https://meet.example.com/2',
          },
        },
      },
      'RingCentral',
      'en-US',
    );

    expect(result).toMatchObject({
      topic: 'Standup',
      location: 'https://meet.example.com/2',
      timeFrom: '2025-01-01T10:00:00Z',
      timeTo: '2025-01-01T11:00:00Z',
      details: 'rcm details',
    });
    jest.useRealTimers();
  });

  it('formats RingCentral Video calendar data', () => {
    const result = formatRCVInfo(
      {
        meeting: {
          name: 'Video Planning',
          startTime: '2025-01-01T12:00:00Z',
          duration: 45,
          joinUri: 'https://video.example.com/1',
        },
      },
      'RingCentral',
      'en-US',
    );

    expect(result).toEqual({
      topic: 'Video Planning',
      location: 'https://video.example.com/1',
      timeFrom: '2025-01-01T12:00:00Z',
      timeTo: '2025-01-01T12:45:00Z',
      details: 'rcv details',
    });
    expect(
      formatMeetingInfo(
        {
          meeting: {
            name: 'Video Planning',
            startTime: '2025-01-01T12:00:00Z',
            duration: 45,
            joinUri: 'https://video.example.com/1',
          },
        },
        'RingCentral',
        'en-US',
        true,
      ),
    ).toEqual(result);
  });

  it('maps meeting form fields for RCV and leaves RCM unchanged', () => {
    const meetingInfo = {
      title: 'Planning',
      schedule: {
        startTime: '2025-01-01T10:00:00Z',
        durationInMinutes: 30,
      },
      allowJoinBeforeHost: true,
      muteAudio: false,
      startParticipantsVideo: false,
    };

    expect(formatMeetingForm(meetingInfo, false)).toBe(meetingInfo);
    expect(formatMeetingForm(meetingInfo, true)).toEqual({
      ...meetingInfo,
      name: 'Planning',
      startTime: '2025-01-01T10:00:00Z',
      duration: 30,
      allowJoinBeforeHost: true,
      muteAudio: false,
      muteVide: true,
    });
  });
});

describe('Notification', () => {
  afterEach(() => {
    delete global.window;
    jest.restoreAllMocks();
  });

  it('enables and creates native notifications when permission is granted', () => {
    const onClick = jest.fn();
    const NativeNotification = jest.fn(function NotificationConstructor(title, options) {
      this.title = title;
      this.options = options;
    });
    NativeNotification.permission = 'granted';
    global.window = {
      Notification: NativeNotification,
    };

    const notification = new Notification();
    notification.notify({
      title: 'New message',
      text: 'Hello',
      icon: 'icon.png',
      onClick,
    });

    expect(NativeNotification).toHaveBeenCalledWith('New message', {
      body: 'Hello',
      icon: 'icon.png',
    });
    expect(NativeNotification.mock.instances[0].onclick).toBe(onClick);
  });

  it('requests permission when available and skips unsupported browsers', () => {
    const requestPermission = jest.fn((callback) => callback());
    const NativeNotification = jest.fn();
    NativeNotification.permission = 'default';
    NativeNotification.requestPermission = requestPermission;
    global.window = {
      Notification: NativeNotification,
    };

    const notification = new Notification();

    expect(requestPermission).toHaveBeenCalledWith(expect.any(Function));
    expect(notification._enableNotification).toBe(false);

    jest.spyOn(console, 'log').mockImplementation(() => {});
    global.window = {};
    new Notification();
    expect(console.log).toHaveBeenCalledWith(
      'This browser does not support system notifications.',
    );
  });

  it('enables notifications when requested permission becomes granted', () => {
    const requestPermission = jest.fn((callback) => {
      NativeNotification.permission = 'granted';
      callback();
    });
    const NativeNotification = jest.fn();
    NativeNotification.permission = 'default';
    NativeNotification.requestPermission = requestPermission;
    global.window = {
      Notification: NativeNotification,
    };

    const notification = new Notification();

    expect(notification._enableNotification).toBe(true);
  });

  it('does not request permission when native permission is denied', () => {
    const requestPermission = jest.fn();
    const NativeNotification = jest.fn();
    NativeNotification.permission = 'denied';
    NativeNotification.requestPermission = requestPermission;
    global.window = {
      Notification: NativeNotification,
    };

    const notification = new Notification();
    notification.notify({
      title: 'Blocked',
      text: 'No-op',
      icon: 'icon.png',
      onClick: jest.fn(),
    });

    expect(requestPermission).not.toHaveBeenCalled();
    expect(NativeNotification).not.toHaveBeenCalled();
  });
});
