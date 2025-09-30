import { Module } from '@ringcentral-integration/commons/lib/di';
import { format, formatTypes } from '@ringcentral-integration/phone-number';
import {
  action,
  RcModuleV2,
  state,
  globalStorage,
} from '@ringcentral-integration/core';
import type { PhonNumberFormatter } from './interface';

type InputParam = {
  phoneNumber: string;
  areaCode: string;
  countryCode: string;
  maxExtensionLength: number,
  isMultipleSiteEnabled: boolean;
  siteCode: string;
  international: boolean;
  isEDPEnabled: boolean;
  removeExtension: boolean,
}

@Module({
  name: 'PhoneNumberFormat',
  deps: ['GlobalStorage'],
})
export class PhoneNumberFormat extends RcModuleV2 {
  private _defaultFormatter: PhonNumberFormatter;

  constructor(deps) {
    super({
      deps,
      storageKey: 'PhoneNumberFormat',
      enableGlobalCache: true,
    });
  }

  @globalStorage
  @state
  formatType = 'national';

  @action
  setFormatType(formatType: string) {
    this.formatType = formatType;
  }

  @globalStorage
  @state
  formatTypeReadOnly = false;

  @action
  setFormatTypeReadOnly(formatTypeReadOnly: boolean) {
    this.formatTypeReadOnly = formatTypeReadOnly;
  }

  setDefaultFormatter() {
    if (!this._defaultFormatter) {
      this._defaultFormatter = format;
    }
  }

  override onInit() {
    this.setDefaultFormatter();
  }

  format(param: InputParam) {
    return this.formatWithType(param, this.formatType);
  }

  formatWithType(param: InputParam, type: string) {
    if (type === 'international' || param.international) {
      return this._defaultFormatter({
        ...param,
        type: formatTypes.international,
      });
    }
    if (type === 'e164') {
      return this._defaultFormatter({
        ...param,
        type: formatTypes.e164,
      });
    }
    return this._defaultFormatter({
      ...param,
      type: formatTypes.local,
    });
  }

  supportedFormats() {
    return [{
      id: 'national',
      name: 'National',
      placeholder: '(###) ###-####',
    }, {
      id: 'international',
      name: 'International',
      placeholder: '+1 ## ### ####',
    }, {
      id: 'e164',
      name: 'E.164',
      placeholder: '+1##########',
    }]
  }
}
