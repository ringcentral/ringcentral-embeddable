import GenericMeeting from '@ringcentral-integration/commons/modules/GenericMeeting';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { selector } from '@ringcentral-integration/commons/lib/selector';

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

  protected get _meetingModule() {
    if (this.isRCM) {
      return this._meeting;
    }
    if (this.isRCV) {
      return this._rcVideo;
    }
    return null;
  }

  // // TODO: fix password validate bug in widgets lib
  // @selector
  // meeting: any = [
  //   () => this.meetingProviderType,
  //   () => this._meetingModule && this._meetingModule.meeting,
  //   () => {
  //     if (!this._meetingModule) {
  //       return {};
  //     }
  //     if (this.isRCM) {
  //       return this._meetingModule.meeting;
  //     }
  //     if (this.isRCV) {
  //       return {
  //         ...this._meetingModule.meeting,
  //         password: this._meetingModule.meeting.meetingPassword,
  //       }
  //     }
  //   },
  // ];
}
