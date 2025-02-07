import { NumberValidate as NumberValidateBase } from '@ringcentral-integration/commons/modules/NumberValidate';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewNumberValidate',
  deps: []
})
export class NumberValidate extends NumberValidateBase {
  override handleExtension(resultItem) {
    if (resultItem.dialingDetails?.serviceCode?.dialing) {
      return {
        isAnExtension: false,
        parsedNumber: resultItem.originalString,
      };
    }
    return super.handleExtension(resultItem);
  }
}
