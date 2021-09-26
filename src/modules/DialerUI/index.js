import DialerUIBase from '@ringcentral-integration/widgets/modules/DialerUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'DialerUI',
})
export default class DialerUI extends DialerUIBase {
  get showFromField() {
    return this._extensionFeatures.ready &&
      this._extensionFeatures.features &&
      this._extensionFeatures.features.EditOutboundCallerId &&
      this._extensionFeatures.features.EditOutboundCallerId.available
  }

  getUIProps({ showFromField = true } = {}) {
    return {
      ...super.getUIProps(),
      showFromField: showFromField && this.showFromField,
    }
  }
}
