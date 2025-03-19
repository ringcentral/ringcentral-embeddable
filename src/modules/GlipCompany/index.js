import { GlipCompany as GlipCompanyBase } from '@ringcentral-integration/commons/modules/GlipCompany';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  deps: [
    'AppFeatures',
  ],
})
export class GlipCompany extends GlipCompanyBase {
  constructor(deps) {
    super(deps);
    // TODO: remove this when handled in widget lib
    this._source._props.fetchFunction = async () => {
      try {
        const response = await deps.client.glip().companies('~').get();
        return response;
      } catch (error) {
        if (
          error &&
          error.message === 'Company associated with RC account is not found'
        ) {
          this._deps.appFeatures.setConfigState({
            Glip: false,
          });
          return {};
        }
        throw error;
      }
    };
  }
}
