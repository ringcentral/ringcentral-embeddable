import { Module } from 'ringcentral-integration/lib/di';
import RcUIModule from 'ringcentral-widgets/lib/RcUIModule';

@Module({
  name: 'MeetingHomeUI',
  deps: ['GenericMeeting', 'Locale', 'RouterInteraction'],
})
export default class MeetingHomeUI extends RcUIModule {
  private _genericMeeting: any;
  private _locale: any;
  private _router: any;

  constructor({ genericMeeting, locale, routerInteraction, ...options }) {
    super({
      ...options,
    });
    this._genericMeeting = genericMeeting;
    this._locale = locale;
    this._router = routerInteraction;
  }

  getUIProps() {
    return {
      currentLocale: this._locale.ready && this._locale.currentLocale,
      showSpinner: !(
        this._genericMeeting.ready &&
        this._locale.ready
      ),
      upcomingMeetings: this._genericMeeting.upcomingMeetings,
    };
  }

  getUIFunctions() {
    return {
      gotoSchedule: () => {
        this._router.push('/meeting/schedule');
      },
      onStart: () => {
        window.open(this._genericMeeting.personalMeeting.joinUri);
      },
      onJoin: (meetingID) => {
        if (!meetingID) {
          return;
        }
        if (meetingID.indexOf('https://')) {
          window.open(meetingID);
          return;
        }
        window.open(`https://v.ringcentral.com/join/${meetingID}`);
      },
      fetchUpcomingMeetings: () => {
        return this._genericMeeting.fetchUpcomingMeetings();
      },
    };
  }
}
