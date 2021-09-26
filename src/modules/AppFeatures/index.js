import { AppFeatures } from '@ringcentral-integration/commons/modules/AppFeatures';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'AppFeatures',
  deps: [
    { dep: 'RolesAndPermissionsOptions', optional: true }
  ]
})
export default class NewAppFeatures extends AppFeatures {
  get ringtonePermission() {
    return !!this.config.RingtoneSettings;
  }
}
