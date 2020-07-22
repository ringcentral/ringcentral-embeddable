import GenericMeeting from 'ringcentral-integration/modules/GenericMeeting';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewGenericMeeting',
  deps: []
})
export default class NewGenericMeeting extends GenericMeeting {
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
    return this._rcVideo.addThirdPartyProvider(args);
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
}
