import GlipGroups from '@ringcentral-integration/commons/modules/GlipGroups';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  deps: [
    'AppFeatures',
  ],
})
export default class NewGlipGroups extends GlipGroups {
  constructor({ appFeatures, ...options }) {
    super(options);
    this._appFeatures = appFeatures;
  }

  // TODO: update permission check in widgets lib
  get _hasPermission() {
    return !!this._appFeatures.hasGlipPermission;
  }

  // TODO: hack for 400 error (Company associated with RC account is not found)
  async _fetchFunction() {
    try {
      const data = await super._fetchFunction();
      return data;
    } catch (error) {
      if (
        error &&
        error.message === 'Company associated with RC account is not found'
      ) {
        return [];
      }
      throw error;
    }
  }
}
