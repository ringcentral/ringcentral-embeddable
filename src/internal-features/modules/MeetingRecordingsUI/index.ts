import { Module } from 'ringcentral-integration/lib/di';
import RcUIModule from 'ringcentral-widgets/lib/RcUIModule';

@Module({
  name: 'MeetingListUI',
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
      meetings: this._genericMeeting.recordings,
    };
  }

  getUIFunctions() {
    return {
      fetchMeetings: () => {
        return this._genericMeeting.fetchRecordings();
      },
      dateTimeFormatter: (startTime) => {
        return this._dateTimeFormat.formatDateTime({
          utcTimestamp: new Date(startTime).getTime(),
          type: 'long',
        });
      },
      cleanMettings: () => {
        return this._genericMeeting.cleanRecordings();
      },
      fetchNextPageMeetings: () => {
        const pageToken = this._genericMeeting.recordingPageToken;
        return this._genericMeeting.fetchRecordings(pageToken);
      },
      onClick: (meetingId) => {
        const host = `https://v.ringcentral.com`;
        window.open(`${host}/welcome/meetings/recordings/recording/${meetingId}`);
      }
    };
  }
}
