import {
  AccountInfo,
  ExtensionInfo,
  NumberFormatter as NumberFormatterBase,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import type {
  NumberFormatterOptions,
  NumberFormattingParams,
} from '@ringcentral-integration/micro-auth/src/app/services/NumberFormatter/NumberFormatter.interface';
import {
  computed,
  injectable,
  optional,
} from '@ringcentral-integration/next-core';
import {
  format,
  formatTypes,
} from '@ringcentral-integration/phone-number';

import { formatWithTemplate } from '../PhoneNumberFormat/formatWithTemplate';
import { PhoneNumberFormat } from '../PhoneNumberFormat/PhoneNumberFormat';
import type { PhoneNumberFormatType } from '../PhoneNumberFormat/PhoneNumberFormat.interface';

/**
 * Formats numbers with the phone number format setting, so every number the
 * Spring UI shows through `NumberFormatter` follows it, as in 3.x.
 */
@injectable({
  name: 'NumberFormatter',
})
export class NumberFormatter extends NumberFormatterBase {
  constructor(
    accountInfo: AccountInfo,
    extensionInfo: ExtensionInfo,
    regionSettings: RegionSettings,
    private readonly _phoneNumberFormat: PhoneNumberFormat,
    @optional('NumberFormatterOptions')
    options?: NumberFormatterOptions,
  ) {
    super(accountInfo, extensionInfo, regionSettings, options);
  }

  /**
   * Also changes with the format setting: the format hooks memoize on this
   * object, so a new one makes them format again.
   */
  @computed((that: NumberFormatter) => [
    that._regionSettings.areaCode,
    that._regionSettings.countryCode,
    that.isMultipleSiteEnabled,
    that.maxExtNumberLength,
    that._extensionInfo.site?.code,
    that._phoneNumberFormat.setting,
  ])
  override get formattingParams(): NumberFormattingParams {
    return {
      areaCode: this._regionSettings.areaCode,
      maxExtensionLength: this.maxExtNumberLength,
      countryCode: this._regionSettings.countryCode,
      isMultipleSiteEnabled: this.isMultipleSiteEnabled,
      siteCode: this.isMultipleSiteEnabled
        ? this._extensionInfo.site?.code
        : '',
    };
  }

  override formatNumber(phoneNumber = '', international = false): string {
    const { formatType, template } = this._phoneNumberFormat.setting;
    return this.formatNumberWithType(
      phoneNumber,
      international ? 'international' : formatType,
      template,
    );
  }

  /**
   * Formats a number in the given format, whatever the setting is.
   */
  formatNumberWithType(
    phoneNumber: string,
    formatType: PhoneNumberFormatType,
    template = '',
  ): string {
    if (formatType === 'international') {
      return super.formatNumber(phoneNumber, true);
    }
    if (formatType === 'e164') {
      return this._formatE164(phoneNumber);
    }
    // A template is for full numbers; extensions keep the default format.
    if (
      formatType === 'custom' &&
      template &&
      phoneNumber.replace(/\D/g, '').length > this.maxExtNumberLength
    ) {
      return formatWithTemplate(phoneNumber, template) || phoneNumber;
    }
    return super.formatNumber(phoneNumber);
  }

  private _formatE164(phoneNumber: string): string {
    try {
      return (
        format({
          ...this.formattingParams,
          phoneNumber,
          type: formatTypes.e164,
        }) || phoneNumber
      );
    } catch (error) {
      console.error(error);
      return phoneNumber;
    }
  }
}
