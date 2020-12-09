import DialerUIBase from 'ringcentral-widgets/modules/DialerUI';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'DialerUI',
  deps: ['RolesAndPermissions']
})
export default class DialerUI extends DialerUIBase {
  constructor({
    rolesAndPermissions,
    ...options
  }) {
    super(options);
    this._rolesAndPermissions = rolesAndPermissions;
  }

  get showFromField() {
    return this._rolesAndPermissions.ready &&
      !!this._rolesAndPermissions.permissions.OutboundCallerId;
  }

  getUIProps({ showFromField = true } = {}) {
    return {
      ...super.getUIProps(),
      showFromField: showFromField && this.showFromField,
    }
  }
}
