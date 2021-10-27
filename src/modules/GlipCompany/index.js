import GlipCompany from '@ringcentral-integration/commons/modules/GlipCompany';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  deps: [
    'AppFeatures',
  ],
})
export default class NewGlipCompany extends GlipCompany {
  constructor({ appFeatures, ...options }) {
    super(options);
    this._appFeatures = appFeatures;
  }

  // TODO: update permission check in widgets lib
  get _hasPermission() {
    return !!this._appFeatures.hasGlipPermission;
  }

  // TODO: hack for 400 error (Company associated with RC account is not found)
  async _fetchWithForbiddenCheck() {
    try {
      const data = await super._fetchWithForbiddenCheck();
      return data;
    } catch (error) {
      if (
        error &&
        error.message === 'Company associated with RC account is not found'
      ) {
        return {};
      }
      throw error;
    }
  }
}
