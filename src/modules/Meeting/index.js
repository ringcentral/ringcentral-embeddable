import Meeting from 'ringcentral-integration/modules/Meeting';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewMeeting',
  deps: []
})
export default class NewMeeting extends Meeting {
  get personalMeeting() {
    return null;
  }
}
