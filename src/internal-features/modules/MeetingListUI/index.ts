import { Module } from 'ringcentral-integration/lib/di';
import RcUIModule from 'ringcentral-widgets/lib/RcUIModule';

@Module({
  name: 'GenericMeetingUI',
  deps: ['GenericMeeting', 'Locale', 'DateTimeFormat'],
})
export default class MeetingListUI extends RcUIModule {
  private _genericMeeting: any;
  private _locale: any;
  private _dateTimeFormat: any;

  constructor({ genericMeeting, locale, dateTimeFormat, ...options }) {
    super({
      ...options,
    });
    this._genericMeeting = genericMeeting;
    this._locale = locale;
    this._dateTimeFormat = dateTimeFormat;
  }

  getUIProps() {
    return {
      currentLocale: this._locale.ready && this._locale.currentLocale,
      showSpinner: !(
        this._genericMeeting.ready &&
        this._locale.ready &&
        this._dateTimeFormat.ready
      ),
      meetings: this._genericMeeting.recentMeetings,
    };
  }

  getUIFunctions() {
    return {
      fetchMeetings: () => {
        return this._genericMeeting.fetchRecentMeetings();
      },
      dateTimeFormatter: (startTime) => {
        return this._dateTimeFormat.formatDateTime({
          utcTimestamp: new Date(startTime).getTime(),
          type: 'long',
        });
      },
      cleanMettings: () => {
        return this._genericMeeting.cleanRecentMeetings();
      },
      fetchNextPageMeetings: () => {
        const pageToken = this._genericMeeting.recentMeetingPageToken;
        return this._genericMeeting.fetchRecentMeetings(pageToken);
      },
    };
  }
}
