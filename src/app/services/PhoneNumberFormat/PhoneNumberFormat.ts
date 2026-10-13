import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  delegate,
  globalStorage,
  injectable,
  RcModule,
  state,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import { applyPhoneNumberFormatInput } from './applyPhoneNumberFormatInput';
import { t } from './i18n';
import type {
  PhoneNumberFormatInput,
  PhoneNumberFormatSetting,
} from './PhoneNumberFormat.interface';

const DEFAULT_SETTING: PhoneNumberFormatSetting = {
  formatType: 'national',
  template: '',
  readOnly: false,
  readOnlyReason: '',
};

/**
 * The phone number format setting from 3.x. The user picks it on the settings
 * page, or the host sets it with `rc-adapter-set-phone-number-format`.
 * `NumberFormatter` applies it to the numbers the app shows.
 */
@injectable({
  name: 'PhoneNumberFormat',
})
export class PhoneNumberFormat extends RcModule {
  constructor(
    private readonly _storage: StoragePlugin,
    private readonly _toast: Toast,
  ) {
    super();
    this._storage.enable(this);
  }

  @globalStorage
  @state
  setting: PhoneNumberFormatSetting = DEFAULT_SETTING;

  @action
  private _setSetting(setting: PhoneNumberFormatSetting): void {
    this.setting = setting;
  }

  /**
   * Applies a format change, or shows why it is refused.
   * @returns whether the setting changed to the input.
   */
  @delegate('server')
  async updateSetting(input: PhoneNumberFormatInput): Promise<boolean> {
    const result = applyPhoneNumberFormatInput(this.setting, input);
    if ('error' in result) {
      this._toast.warning({ message: t(result.error) });
      return false;
    }
    this._setSetting(result.setting);
    return true;
  }
}
