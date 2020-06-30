import RegionSettings from 'ringcentral-integration/modules/RegionSettings';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewRegionSettings',
  deps: []
})
export default class NewRegionSettings extends RegionSettings {
  // hotfix: wrong home country id
  get homeCountryId() {
    const homeCountry = this.availableCountries.find(
      (country) => country.isoCode === this.countryCode,
    );
    const homeCountryId = (homeCountry && homeCountry.id) || '1';
    return homeCountryId;
  }
}
