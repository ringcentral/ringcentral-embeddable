import GlipPersons from '@ringcentral-integration/commons/modules/GlipPersons';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  deps: [
    'AppFeatures',
  ],
})
export default class NewGlipPersons extends GlipPersons {
  constructor({ appFeatures, ...options }) {
    super(options);
    this._appFeatures = appFeatures;
  }

  // TODO: update permission check in widgets lib
  get _hasPermission() {
    return !!this._appFeatures.hasGlipPermission;
  }
}
