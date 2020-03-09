import { Module } from 'ringcentral-integration/lib/di';
import RcUIModule from 'ringcentral-widgets/lib/RcUIModule';

@Module({
  name: 'GenericMeetingUI',
  deps: ['GenericMeeting', 'Locale', 'RateLimiter', 'ConnectivityMonitor'],
})
export default class GenericMeetingUI extends RcUIModule {
  _genericMeeting: any;
  _locale: any;
  _rateLimiter: any;
  _connectivityMonitor: any;

  constructor({
    genericMeeting,
    locale,
    rateLimiter,
    connectivityMonitor,
    ...options
  }) {
    super({
      ...options,
    });
    this._genericMeeting = genericMeeting;
    this._locale = locale;
    this._rateLimiter = rateLimiter;
    this._connectivityMonitor = connectivityMonitor;
  }

  getUIProps({
    disabled,
    showWhen,
    showDuration,
    openNewWindow,
    showRecurringMeeting,
    scheduleButton,
    datePickerSize,
    timePickerSize,
  }) {
    return {
      datePickerSize,
      timePickerSize,
      meeting: this._genericMeeting.meeting || {},
      currentLocale: this._locale.currentLocale,
      disabled:
        this._genericMeeting.isScheduling ||
        disabled ||
        !this._connectivityMonitor.connectivity ||
        (this._rateLimiter && this._rateLimiter.throttling),
      showWhen,
      showDuration,
      showRecurringMeeting,
      openNewWindow,
      showSaveAsDefault: this._genericMeeting.showSaveAsDefault,
      isRCM: this._genericMeeting.isRCM,
      isRCV: this._genericMeeting.isRCV,
      scheduleButton,
    };
  }

  getUIFunctions(props?: any) {
    const { schedule } = props;
    return {
      updateMeetingSettings: (value) =>
        this._genericMeeting.updateMeetingSettings(value),
      schedule: async (meetingInfo, opener) => {
        if (schedule) {
          await schedule(meetingInfo, opener);
          return;
        }
        await this._genericMeeting.schedule(meetingInfo, {}, opener);
      },
      init: () => this._genericMeeting.init(),
    };
  }
}
