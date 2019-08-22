import GlipCompany from 'ringcentral-integration/modules/GlipCompany';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  deps: [],
})
export default class NewGlipCompany extends GlipCompany {
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
