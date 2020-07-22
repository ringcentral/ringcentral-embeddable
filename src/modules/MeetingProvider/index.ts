import { Module } from 'ringcentral-integration/lib/di';
import MeetingProvider from 'ringcentral-integration/modules/MeetingProvider';
import { meetingProviderTypes } from 'ringcentral-integration/modules/MeetingProvider/interface';

@Module({
  name: 'NewMeetingProvider',
  deps: [
    'RolesAndPermissions',
  ]
})
export default class NewMeetingProvider extends MeetingProvider {
  private _rolesAndPermissions: any;

  constructor({
    rolesAndPermissions,
    ...options
  }) {
    super({
      cleanOnReset: true,
      readyCheckFn: () => this._rolesAndPermissions.ready,
      ...options,
    });

    this._rolesAndPermissions = rolesAndPermissions;
  }

  get _hasPermission() {
    return !!this._rolesAndPermissions.organizeMeetingEnabled;
  }

  get isRCV() {
    return this.provider === meetingProviderTypes.video;
  }
}
