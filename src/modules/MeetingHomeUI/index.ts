import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, track } from '@ringcentral-integration/core';

@Module({
  name: 'MeetingHomeUI',
  deps: ['GenericMeeting', 'Locale', 'RouterInteraction'],
})
export class MeetingHomeUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps() {
    return {
      currentLocale: this._deps.locale.ready && this._deps.locale.currentLocale,
      showSpinner: !(
        this._deps.genericMeeting.ready &&
        this._deps.locale.ready
      ),
      upcomingMeetings: this._deps.genericMeeting.upcomingMeetings,
    };
  }

  getUIFunctions() {
    return {
      gotoSchedule: () => {
        this._deps.routerInteraction.push('/meeting/schedule');
      },
      onStart: async () => {
        const { meeting } = (await this._deps.genericMeeting.createInstantMeeting()) || {};
        if (meeting) {
          window.open(meeting.joinUri);
        }
      },
      onJoin: (meetingID) => {
        if (!meetingID) {
          return;
        }
        this._onJoinMeeting(meetingID);
      },
      fetchUpcomingMeetings: () => {
        return this._deps.genericMeeting.fetchUpcomingMeetings();
      },
    };
  }

  @track(() => ['Join Meeting'])
  _onJoinMeeting(meetingID) {
    if (meetingID.indexOf('https://') === 0) {
      window.open(meetingID);
      return;
    }
    window.open(`https://v.ringcentral.com/join/${meetingID}`);
  }
}
