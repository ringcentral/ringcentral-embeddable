import ActiveCallControl from 'ringcentral-integration/modules/ActiveCallControl';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewActiveCallControl',
  deps: []
})
export default class NewActiveCallControl extends ActiveCallControl {
  get _hasPermission() {
    return this._rolesAndPermissions.hasActiveCallControlPermission;
  }
}
