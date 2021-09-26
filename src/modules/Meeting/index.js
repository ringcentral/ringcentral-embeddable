import Meeting from '@ringcentral-integration/commons/modules/Meeting';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewMeeting',
  deps: []
})
export default class NewMeeting extends Meeting {
  get personalMeeting() {
    return null;
  }
}
