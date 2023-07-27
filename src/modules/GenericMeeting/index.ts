import { GenericMeeting as GenericMeetingBase } from '@ringcentral-integration/commons/modules/GenericMeeting';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewGenericMeeting',
  deps: []
})
export class GenericMeeting extends GenericMeetingBase {
  async fetchHistoryMeetings(params) {
    return (
      this._meetingModule && this._meetingModule.fetchHistoryMeetings(params)
    );
  }

  async cleanHistoryMeetings() {
    return this._meetingModule && this._meetingModule.cleanHistoryMeetings();
  }

  async fetchUpcomingMeetings() {
    return this._meetingModule && this._meetingModule.fetchUpcomingMeetings();
  }

  async addThirdPartyProvider(args) {
    return this._deps.rcVideo.addThirdPartyProvider(args);
  }

  async createInstantMeeting() {
    return this._meetingModule && this._meetingModule.createInstantMeeting();
  }

  get historyMeetings() {
    return this._meetingModule && this._meetingModule.historyMeetings;
  }

  get upcomingMeetings() {
    return this._meetingModule && this._meetingModule.upcomingMeetings;
  }

  protected get _meetingModule() {
    if (this.isRCM) {
      return this._deps.meeting;
    }
    if (this.isRCV) {
      return this._deps.rcVideo;
    }
    return null;
  }
}
